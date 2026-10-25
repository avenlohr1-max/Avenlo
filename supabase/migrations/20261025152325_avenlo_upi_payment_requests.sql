-- Independent Avenlo checkout experiment. No YouPI implementation is included.
-- Personal UPI is limited to founder-owned INR 1 tests. No service settlement.
create table public.avenlo_upi_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  reference text not null unique check (reference ~ '^AVT[A-F0-9]{32}$'),
  mode text not null check (mode in ('sandbox','test')),
  amount_paise integer not null default 100 check (amount_paise = 100),
  currency text not null default 'INR' check (currency = 'INR'),
  payee_upi text,
  payee_name text not null check (length(payee_name) between 2 and 120),
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment','reported','confirmed','rejected','expired')),
  payer_reference text check (payer_reference ~ '^[A-Za-z0-9-]{6,80}$'),
  bank_reference text check (bank_reference ~ '^[A-Z0-9-]{6,80}$'),
  bank_received_at timestamptz,
  reviewer_id uuid references public.profiles(id) on delete set null,
  review_note text check (length(review_note) <= 1000),
  reviewed_at timestamptz,
  refund_status text not null default 'none' check (refund_status in ('none','requested')),
  refund_reason text check (length(refund_reason) <= 1000),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '20 minutes',
  check ((mode='sandbox' and payee_upi is null) or (mode='test' and payee_upi ~ '^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$'))
);
create index avenlo_upi_owner_created_idx on public.avenlo_upi_requests(owner_id,created_at desc);
create index avenlo_upi_status_created_idx on public.avenlo_upi_requests(status,created_at);
create unique index avenlo_upi_bank_reference_idx on public.avenlo_upi_requests(lower(payee_upi),bank_reference)
  where mode='test' and bank_reference is not null;
create table public.avenlo_upi_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.avenlo_upi_requests(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('created','reported','confirmed','rejected','refund_requested')),
  created_at timestamptz not null default now()
);
create index avenlo_upi_events_request_idx on public.avenlo_upi_events(request_id,created_at);
create index avenlo_upi_events_actor_idx on public.avenlo_upi_events(actor_id);
alter table public.avenlo_upi_requests enable row level security;
alter table public.avenlo_upi_events enable row level security;
revoke all on public.avenlo_upi_requests, public.avenlo_upi_events from anon, authenticated;
grant select on public.avenlo_upi_requests, public.avenlo_upi_events to authenticated;
grant all on public.avenlo_upi_requests, public.avenlo_upi_events to service_role;
create policy "owner or founder reads own payment requests" on public.avenlo_upi_requests for select to authenticated using (
  exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.status in ('draft','active'))
  and ((owner_id = (select auth.uid()) and (select private.current_user_role()) in ('candidate','founder'))
  or (select private.current_user_role()) = 'founder')
);
create policy "payment events follow request access" on public.avenlo_upi_events for select to authenticated using (
  exists(select 1 from public.avenlo_upi_requests r where r.id=request_id)
);

-- Only the trusted server supplies receiver configuration and selects mode.
create function public.create_avenlo_upi_request(p_owner_id uuid,p_mode text,p_payee_upi text,p_payee_name text)
returns public.avenlo_upi_requests language plpgsql security definer set search_path='' as $$
declare r public.avenlo_upi_requests; owner_role text; request_id uuid:=gen_random_uuid();
begin
  select role::text into owner_role from public.profiles where id=p_owner_id and status in ('draft','active') for update;
  if owner_role not in ('candidate','founder') or owner_role is null then raise exception 'eligible account required'; end if;
  if p_mode not in ('sandbox','test') or p_mode is null then raise exception 'unsupported payment mode'; end if;
  if p_mode='test' and owner_role<>'founder' then raise exception 'personal UPI testing is founder only'; end if;
  if p_mode='test' and (p_payee_upi is null or p_payee_upi !~ '^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$' or length(p_payee_upi)>100) then raise exception 'valid receiver required'; end if;
  if p_payee_name is null or length(btrim(p_payee_name)) not between 2 and 120 then raise exception 'receiver name required'; end if;
  select * into r from public.avenlo_upi_requests where owner_id=p_owner_id and mode=p_mode
    and (status='reported' or (status='awaiting_payment' and expires_at>now())) order by created_at desc limit 1;
  if found then return r; end if;
  if (select count(*) from public.avenlo_upi_requests where owner_id=p_owner_id and created_at>now()-interval '1 day')>=10 then raise exception 'daily test-request limit reached'; end if;
  update public.avenlo_upi_requests set status='expired' where owner_id=p_owner_id and status='awaiting_payment' and expires_at<=now();
  insert into public.avenlo_upi_requests(id,owner_id,reference,mode,payee_upi,payee_name)
  values(request_id,p_owner_id,'AVT'||upper(replace(request_id::text,'-','')),p_mode,case when p_mode='test' then p_payee_upi else null end,btrim(p_payee_name)) returning * into r;
  insert into public.avenlo_upi_events(request_id,actor_id,kind) values(r.id,p_owner_id,'created');
  return r;
end $$;
revoke all on function public.create_avenlo_upi_request(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.create_avenlo_upi_request(uuid,text,text,text) to service_role;

create function public.report_avenlo_upi_payment(p_request_id uuid,p_reference text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.avenlo_upi_requests;
begin
  if (select private.current_user_role()) not in ('candidate','founder') or auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and status in ('draft','active')) then raise exception 'eligible account required'; end if;
  select * into r from public.avenlo_upi_requests where id=p_request_id and owner_id=auth.uid() for update;
  if not found then raise exception 'request not found'; end if;
  if p_reference is null or btrim(p_reference) !~ '^[A-Za-z0-9-]{6,80}$' then raise exception 'valid reference required'; end if;
  if r.status='reported' and r.payer_reference=btrim(p_reference) then return; end if;
  if r.status not in ('awaiting_payment','expired') then raise exception 'request cannot be reported'; end if;
  -- A report, screenshot or browser return never confirms receipt.
  update public.avenlo_upi_requests set status='reported',payer_reference=btrim(p_reference) where id=r.id;
  insert into public.avenlo_upi_events(request_id,actor_id,kind) values(r.id,auth.uid(),'reported');
end $$;
revoke all on function public.report_avenlo_upi_payment(uuid,text) from public,anon;
grant execute on function public.report_avenlo_upi_payment(uuid,text) to authenticated;

create function public.review_avenlo_upi_payment(p_request_id uuid,p_decision text,p_bank_reference text,p_amount_paise integer,p_payee_upi text,p_received_at timestamptz,p_bank_checked boolean,p_note text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.avenlo_upi_requests;
begin
  if (select private.current_user_role()) is distinct from 'founder' or auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and status in ('draft','active')) then raise exception 'founder required'; end if;
  select * into r from public.avenlo_upi_requests where id=p_request_id for update;
  if not found then raise exception 'request not found'; end if;
  if p_decision not in ('confirmed','rejected') or p_decision is null then raise exception 'invalid review'; end if;
  if r.status=p_decision then return; end if;
  if r.status<>'reported' then raise exception 'report required before review'; end if;
  if p_note is null or length(btrim(p_note)) not between 10 and 1000 then raise exception 'review note required'; end if;
  if p_decision='confirmed' and r.mode='test' then
    if p_bank_checked is distinct from true or p_amount_paise is distinct from r.amount_paise or lower(p_payee_upi) is distinct from lower(r.payee_upi)
      or p_bank_reference is null or upper(btrim(p_bank_reference)) !~ '^[A-Z0-9-]{6,80}$'
      or p_received_at is null or p_received_at<r.created_at-interval '5 minutes' or p_received_at>now()+interval '5 minutes'
    then raise exception 'official bank credit, exact receiver, amount and date required'; end if;
  end if;
  update public.avenlo_upi_requests set status=p_decision,reviewer_id=auth.uid(),review_note=btrim(p_note),reviewed_at=now(),
    bank_reference=case when p_decision='confirmed' and r.mode='test' then upper(btrim(p_bank_reference)) else null end,
    bank_received_at=case when p_decision='confirmed' and r.mode='test' then p_received_at else null end where id=r.id;
  insert into public.avenlo_upi_events(request_id,actor_id,kind) values(r.id,auth.uid(),p_decision);
  -- Deliberately no call to service settlement/activation, in either mode.
end $$;
revoke all on function public.review_avenlo_upi_payment(uuid,text,text,integer,text,timestamptz,boolean,text) from public,anon;
grant execute on function public.review_avenlo_upi_payment(uuid,text,text,integer,text,timestamptz,boolean,text) to authenticated;

create function public.request_avenlo_upi_refund(p_request_id uuid,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.avenlo_upi_requests;
begin
  if (select private.current_user_role()) not in ('candidate','founder') or auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and status in ('draft','active')) then raise exception 'eligible account required'; end if;
  select * into r from public.avenlo_upi_requests where id=p_request_id and owner_id=auth.uid() for update;
  if not found or r.status<>'confirmed' or r.mode<>'test' then raise exception 'reconciled test payment required'; end if;
  if p_reason is null or length(btrim(p_reason)) not between 10 and 1000 then raise exception 'refund reason required'; end if;
  if r.refund_status='requested' then return; end if;
  update public.avenlo_upi_requests set refund_status='requested',refund_reason=btrim(p_reason) where id=r.id;
  insert into public.avenlo_upi_events(request_id,actor_id,kind) values(r.id,auth.uid(),'refund_requested');
end $$;
revoke all on function public.request_avenlo_upi_refund(uuid,text) from public,anon;
grant execute on function public.request_avenlo_upi_refund(uuid,text) to authenticated;
