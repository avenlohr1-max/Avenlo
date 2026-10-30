-- Invoice issuance is part of trusted payment settlement, never a browser action.
alter table public.candidate_service_orders add column checkout_snapshot jsonb;

create table private.avenlo_invoice_counters (
  financial_year integer primary key,
  last_number bigint not null check(last_number between 1 and 99999999)
);
revoke all on private.avenlo_invoice_counters from public,anon,authenticated;

create table public.avenlo_invoices (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid not null unique references public.candidate_service_orders(id) on delete restrict,
  candidate_id uuid not null references public.profiles(id) on delete restrict,
  invoice_number text not null unique check(length(invoice_number)<=16),
  financial_year integer not null,
  amount_paise bigint not null check(amount_paise>0),
  currency text not null check(currency in ('INR','USD')),
  provider text not null check(provider='razorpay'),
  provider_payment_id text not null,
  snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),
  issued_at timestamptz not null default now(),
  unique(provider,provider_payment_id)
);
create index avenlo_invoices_candidate_issued_idx on public.avenlo_invoices(candidate_id,issued_at desc);
alter table public.avenlo_invoices enable row level security;
revoke all on public.avenlo_invoices from public,anon,authenticated;
grant select on public.avenlo_invoices to authenticated;
grant select,insert on public.avenlo_invoices to service_role;
create policy "candidate or founder reads invoice" on public.avenlo_invoices for select to authenticated using (
  exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.status in ('draft','active'))
  and ((candidate_id=(select auth.uid()) and (select private.current_user_role())='candidate')
    or (select private.current_user_role())='founder')
);

create function private.avenlo_invoice_immutable() returns trigger
language plpgsql set search_path='' as $$
begin raise exception 'Issued invoices are immutable; use a separate adjustment record'; end $$;
revoke all on function private.avenlo_invoice_immutable() from public,anon,authenticated;
create trigger avenlo_invoice_immutable before update or delete on public.avenlo_invoices
for each row execute function private.avenlo_invoice_immutable();

-- Operators may manage delivery, but cannot forge orders, prices, consent or payment state.
create function private.guard_avenlo_order_financials() returns trigger
language plpgsql set search_path='' as $$
begin
  if current_user in ('postgres','service_role','supabase_admin') then return new; end if;
  if tg_op='INSERT' then raise exception 'Orders are created by trusted checkout only' using errcode='42501'; end if;
  if row(new.candidate_id,new.plan_id,new.market,new.price,new.currency,new.payment_status,new.payment_provider,
    new.provider_order_id,new.provider_payment_id,new.purchased_at,new.checkout_snapshot)
    is distinct from row(old.candidate_id,old.plan_id,old.market,old.price,old.currency,old.payment_status,old.payment_provider,
    old.provider_order_id,old.provider_payment_id,old.purchased_at,old.checkout_snapshot)
  then raise exception 'Trusted payment verification required' using errcode='42501'; end if;
  if new.price>0 and old.payment_status<>'successful' and new.status not in ('payment_pending','cancelled')
  then raise exception 'Payment must be verified before service delivery' using errcode='42501'; end if;
  return new;
end $$;
revoke all on function private.guard_avenlo_order_financials() from public,anon,authenticated;
create trigger guard_avenlo_order_financials before insert or update on public.candidate_service_orders
for each row execute function private.guard_avenlo_order_financials();

create or replace function public.settle_candidate_service_order(p_order_id uuid,p_provider text,p_provider_payment_id text)
returns public.candidate_service_orders language plpgsql security definer set search_path='' as $$
declare o public.candidate_service_orders; existing public.avenlo_invoices; s jsonb; fy integer; n bigint;
begin
  select * into o from public.candidate_service_orders where id=p_order_id for update;
  if not found then raise exception 'service order not found'; end if;
  if p_provider is distinct from 'razorpay' or p_provider_payment_id is null or length(btrim(p_provider_payment_id)) not between 3 and 255
    or o.payment_provider is distinct from 'razorpay' or o.provider_order_id is null then raise exception 'verified provider identifiers required'; end if;
  select * into existing from public.avenlo_invoices where service_order_id=o.id;
  if found then
    if existing.provider_payment_id is distinct from p_provider_payment_id then raise exception 'order already settled with another payment'; end if;
    return o;
  end if;
  s:=o.checkout_snapshot;
  if o.payment_status<>'pending' or o.status<>'payment_pending' or o.price<=0 then raise exception 'order is not awaiting a paid settlement'; end if;
  if s is null or s->>'policyVersion' is null or s->>'acceptedAt' is null
    or s->'issuer'->>'gstRegistered' is distinct from 'false' or coalesce((s->>'accepted')::boolean,false) is not true
    or jsonb_typeof(s->'documents') is distinct from 'array' or jsonb_array_length(s->'documents')<>4
    or coalesce(length(s->'issuer'->>'name'),0)<2 or coalesce(length(s->'issuer'->>'address'),0)<8
    or coalesce(length(s->'billing'->>'name'),0)<2 or coalesce(length(s->'billing'->>'address'),0)<8
    or jsonb_typeof(s->'items') is distinct from 'array' or jsonb_array_length(s->'items')<1
    or (s->>'amountPaise')::bigint is distinct from round(o.price*100)::bigint
    or s->>'currency' is distinct from o.currency
  then raise exception 'complete pre-payment consent and invoice snapshot required'; end if;
  fy:=extract(year from (now() at time zone 'Asia/Kolkata')-interval '3 months')::integer;
  insert into private.avenlo_invoice_counters(financial_year,last_number) values(fy,1)
    on conflict(financial_year) do update set last_number=private.avenlo_invoice_counters.last_number+1
    returning last_number into n;
  insert into public.avenlo_invoices(service_order_id,candidate_id,invoice_number,financial_year,amount_paise,currency,provider,provider_payment_id,snapshot)
  values(o.id,o.candidate_id,'AV'||right(fy::text,2)||'-'||lpad(n::text,8,'0'),fy,round(o.price*100)::bigint,o.currency,p_provider,p_provider_payment_id,s);
  update public.candidate_service_orders set status='payment_successful',payment_status='successful',provider_payment_id=p_provider_payment_id,
    purchased_at=coalesce(purchased_at,now()),next_action='Avenlo activation and delivery review',updated_at=now()
    where id=o.id returning * into o;
  return o;
end $$;
revoke all on function public.settle_candidate_service_order(uuid,text,text) from public,anon,authenticated;
grant execute on function public.settle_candidate_service_order(uuid,text,text) to service_role;

alter table private.avenlo_invoice_counters enable row level security;
create unique index avenlo_one_open_checkout_idx on public.candidate_service_orders(candidate_id,plan_id)
where payment_status='pending' and status='payment_pending';
