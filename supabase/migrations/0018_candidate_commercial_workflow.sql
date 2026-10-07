-- Avenlo v1 launch operations: candidate commercial workflow.
-- Commercial values mirror the locked Launch Pack. Payment processor/tax mechanics remain configurable
-- until Finance/Legal confirms them; this migration intentionally does not hard-code a processor.

create table if not exists public.candidate_plans (
  id uuid primary key default gen_random_uuid(),
  market text not null check (market in ('india','international')),
  code text not null,
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  currency text not null check (currency in ('INR','USD')),
  term_months integer not null default 6 check (term_months = 6 or price = 0),
  auto_renew boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(market, code)
);

insert into public.candidate_plans (market,code,name,price,currency,term_months,auto_renew)
values
 ('india','basic','Basic',0,'INR',0,false),
 ('india','intelligence','Avenlo Intelligence',1999,'INR',6,false),
 ('india','executive','Executive',7999,'INR',6,false),
 ('international','basic','Basic',0,'USD',0,false),
 ('international','intelligence','Intelligence',100,'USD',6,false),
 ('international','premium','Premium',399,'USD',6,false),
 ('international','executive','Executive',799,'USD',6,false)
on conflict (market,code) do update set name=excluded.name,price=excluded.price,currency=excluded.currency,term_months=excluded.term_months,auto_renew=false,active=true;

create table if not exists public.candidate_legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null check (document_type in ('candidate_terms','privacy_notice','paid_service_terms','refund_policy')),
  version text not null,
  accepted_at timestamptz not null default now(),
  source text not null default 'web',
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists candidate_legal_acceptances_candidate_idx on public.candidate_legal_acceptances(candidate_id,document_type,accepted_at desc);

create table if not exists public.candidate_service_orders (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.candidate_plans(id),
  market text not null check (market in ('india','international')),
  price numeric(12,2) not null check (price >= 0),
  currency text not null check (currency in ('INR','USD')),
  status text not null default 'payment_pending' check (status in ('payment_pending','payment_successful','activation_pending','active','delivery_in_progress','intelligence_complete','match_eligible','expired','cancelled','refunded')),
  payment_status text not null default 'pending' check (payment_status in ('pending','successful','failed','refunded','disputed')),
  payment_provider text,
  provider_order_id text,
  provider_payment_id text,
  purchased_at timestamptz,
  activated_at timestamptz,
  expires_at timestamptz,
  refund_deadline timestamptz,
  legal_version text,
  delivery_owner uuid references public.profiles(id),
  delivery_milestones jsonb not null default '{}'::jsonb,
  owner_id uuid references public.profiles(id),
  next_action text,
  next_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists candidate_service_orders_candidate_idx on public.candidate_service_orders(candidate_id,created_at desc);
create index if not exists candidate_service_orders_status_idx on public.candidate_service_orders(status);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid references public.candidate_service_orders(id) on delete set null,
  provider text not null,
  provider_event_id text,
  event_type text not null,
  status text not null default 'received',
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
create unique index if not exists payment_events_provider_event_uidx on public.payment_events(provider,provider_event_id) where provider_event_id is not null;

create table if not exists public.candidate_verifications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null unique references public.profiles(id) on delete cascade,
  status text not null default 'verification_required' check (status in ('registered','verification_pending','verified','verified_with_conditions','verification_required','rejected','suspended')),
  market text check (market in ('india','international')),
  market_basis text,
  market_confidence text check (market_confidence in ('low','medium','high')),
  verification_method text,
  evidence_reviewed jsonb not null default '[]'::jsonb,
  reviewer_id uuid references public.profiles(id),
  reviewed_at timestamptz,
  issues text,
  owner_id uuid references public.profiles(id),
  next_action text,
  next_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.candidate_plans enable row level security;
alter table public.candidate_legal_acceptances enable row level security;
alter table public.candidate_service_orders enable row level security;
alter table public.payment_events enable row level security;
alter table public.candidate_verifications enable row level security;

drop policy if exists "candidates read candidate plans" on public.candidate_plans;
create policy "candidates read candidate plans" on public.candidate_plans for select to authenticated using (active = true);

drop policy if exists "candidates read own legal acceptances" on public.candidate_legal_acceptances;
create policy "candidates read own legal acceptances" on public.candidate_legal_acceptances for select to authenticated using (candidate_id = auth.uid());
drop policy if exists "candidates insert own legal acceptances" on public.candidate_legal_acceptances;
create policy "candidates insert own legal acceptances" on public.candidate_legal_acceptances for insert to authenticated with check (candidate_id = auth.uid());

drop policy if exists "candidates read own service orders" on public.candidate_service_orders;
create policy "candidates read own service orders" on public.candidate_service_orders for select to authenticated using (candidate_id = auth.uid());

drop policy if exists "candidates create own service orders" on public.candidate_service_orders;
create policy "candidates create own service orders" on public.candidate_service_orders for insert to authenticated with check (candidate_id = auth.uid() and status = 'payment_pending' and payment_status = 'pending');

drop policy if exists "candidates read own verification" on public.candidate_verifications;
create policy "candidates read own verification" on public.candidate_verifications for select to authenticated using (candidate_id = auth.uid());

drop policy if exists "staff manage candidate service orders" on public.candidate_service_orders;
create policy "staff manage candidate service orders" on public.candidate_service_orders for all to authenticated using (public.current_user_role() in ('staff','founder')) with check (public.current_user_role() in ('staff','founder'));
drop policy if exists "staff manage candidate verification" on public.candidate_verifications;
create policy "staff manage candidate verification" on public.candidate_verifications for all to authenticated using (public.current_user_role() in ('staff','founder')) with check (public.current_user_role() in ('staff','founder'));
drop policy if exists "staff read legal acceptances" on public.candidate_legal_acceptances;
create policy "staff read legal acceptances" on public.candidate_legal_acceptances for select to authenticated using (public.current_user_role() in ('staff','founder'));

grant select on public.candidate_plans to authenticated;
grant select,insert on public.candidate_legal_acceptances to authenticated;
grant select,insert on public.candidate_service_orders to authenticated;
grant select on public.candidate_verifications to authenticated;
grant all on public.candidate_service_orders to authenticated;
grant all on public.candidate_verifications to authenticated;
revoke insert,update,delete on public.payment_events from authenticated;

create or replace function public.activate_candidate_service_order(p_order_id uuid, p_provider text, p_provider_payment_id text default null)
returns public.candidate_service_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.candidate_service_orders;
begin
  select * into v_order from public.candidate_service_orders where id = p_order_id for update;
  if not found then raise exception 'service order not found'; end if;
  if v_order.price <= 0 then
    update public.candidate_service_orders
      set status='active', payment_status='successful', payment_provider=p_provider,
          provider_payment_id=p_provider_payment_id, purchased_at=coalesce(purchased_at,now()),
          activated_at=coalesce(activated_at,now()),
          expires_at=coalesce(expires_at,now()+interval '6 months'),
          refund_deadline=coalesce(refund_deadline,now()+interval '7 days'),
          updated_at=now()
    where id=p_order_id returning * into v_order;
  else
    update public.candidate_service_orders
      set status='payment_successful', payment_status='successful', payment_provider=p_provider,
          provider_payment_id=p_provider_payment_id, purchased_at=coalesce(purchased_at,now()),
          updated_at=now()
    where id=p_order_id returning * into v_order;
  end if;
  return v_order;
end;
$$;
revoke all on function public.activate_candidate_service_order(uuid,text,text) from public,anon,authenticated;
