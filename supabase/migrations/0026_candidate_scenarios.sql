-- Candidate-authored career scenarios for Phase 2.
-- Scenario inputs are exploratory and remain private to their owner.
create table if not exists public.candidate_scenarios (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  target_role text not null check (length(btrim(target_role)) between 1 and 140),
  assumptions text[] not null default '{}',
  open_questions text[] not null default '{}',
  next_steps text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists candidate_scenarios_candidate_id_id_unique
  on public.candidate_scenarios (candidate_id, id);
create index if not exists candidate_scenarios_candidate_created_idx
  on public.candidate_scenarios (candidate_id, created_at);

alter table public.candidate_scenarios enable row level security;
grant select, insert, update, delete on public.candidate_scenarios to authenticated;
revoke all on public.candidate_scenarios from anon;

drop policy if exists "candidates manage own career scenarios" on public.candidate_scenarios;
create policy "candidates manage own career scenarios"
on public.candidate_scenarios
for all to authenticated
using (candidate_id = (select auth.uid()))
with check (candidate_id = (select auth.uid()));

create table if not exists public.candidate_scenario_evidence (
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  scenario_id uuid not null,
  signal_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (candidate_id, scenario_id, signal_id),
  foreign key (candidate_id, scenario_id)
    references public.candidate_scenarios (candidate_id, id) on delete cascade,
  foreign key (candidate_id, signal_id)
    references public.candidate_signals (candidate_id, id) on delete cascade
);

create index if not exists candidate_scenario_evidence_candidate_signal_idx
  on public.candidate_scenario_evidence (candidate_id, signal_id);

alter table public.candidate_scenario_evidence enable row level security;
grant select, insert, delete on public.candidate_scenario_evidence to authenticated;
revoke all on public.candidate_scenario_evidence from anon;

drop policy if exists "candidates read own scenario evidence" on public.candidate_scenario_evidence;
create policy "candidates read own scenario evidence"
on public.candidate_scenario_evidence
for select to authenticated
using (candidate_id = (select auth.uid()));

drop policy if exists "candidates link own confirmed scenario evidence" on public.candidate_scenario_evidence;
create policy "candidates link own confirmed scenario evidence"
on public.candidate_scenario_evidence
for insert to authenticated
with check (
  candidate_id = (select auth.uid())
  and exists (
    select 1
    from public.candidate_signals signal
    where signal.id = candidate_scenario_evidence.signal_id
      and signal.candidate_id = (select auth.uid())
      and signal.verification_status = 'candidate_confirmed'
  )
);

drop policy if exists "candidates unlink own scenario evidence" on public.candidate_scenario_evidence;
create policy "candidates unlink own scenario evidence"
on public.candidate_scenario_evidence
for delete to authenticated
using (candidate_id = (select auth.uid()));

create or replace function public.touch_candidate_scenario_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.touch_candidate_scenario_updated_at() from public, anon, authenticated;

drop trigger if exists candidate_scenarios_touch_updated_at on public.candidate_scenarios;
create trigger candidate_scenarios_touch_updated_at
before update on public.candidate_scenarios
for each row execute function public.touch_candidate_scenario_updated_at();
