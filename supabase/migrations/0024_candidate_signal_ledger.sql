-- Candidate-owned Signal Ledger.
-- Signals keep source, context, date, and uncertainty visible. They remain private
-- to the candidate in this first slice; employer access needs a separate consent design.
create table if not exists public.candidate_signals (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  signal_type text not null check (signal_type in ('skill', 'experience', 'education', 'achievement', 'preference', 'other')),
  statement text not null check (length(btrim(statement)) between 1 and 2000),
  source_type text not null check (source_type in ('candidate', 'resume', 'work_sample', 'education', 'employment', 'other')),
  source_label text not null check (length(btrim(source_label)) between 1 and 200),
  source_date date,
  context text not null check (length(btrim(context)) between 1 and 3000),
  uncertainty_note text not null check (length(btrim(uncertainty_note)) between 1 and 1500),
  verification_status text not null default 'needs_review'
    check (verification_status in ('needs_review', 'candidate_confirmed', 'disputed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists candidate_signals_candidate_created_idx
  on public.candidate_signals (candidate_id, created_at desc);

create table if not exists public.candidate_signal_revisions (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references public.candidate_signals(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  before_data jsonb not null,
  after_data jsonb not null,
  changed_at timestamptz not null default now()
);

create index if not exists candidate_signal_revisions_candidate_changed_idx
  on public.candidate_signal_revisions (candidate_id, changed_at desc);

alter table public.candidate_signals enable row level security;
alter table public.candidate_signal_revisions enable row level security;

grant select, insert, update, delete on public.candidate_signals to authenticated;
revoke all on public.candidate_signal_revisions from anon, authenticated;
grant select on public.candidate_signal_revisions to authenticated;

drop policy if exists "candidates manage own signals" on public.candidate_signals;
create policy "candidates manage own signals"
on public.candidate_signals
for all to authenticated
using (candidate_id = (select auth.uid()))
with check (candidate_id = (select auth.uid()));

drop policy if exists "candidates read own signal revisions" on public.candidate_signal_revisions;
create policy "candidates read own signal revisions"
on public.candidate_signal_revisions
for select to authenticated
using (candidate_id = (select auth.uid()));

create or replace function public.record_candidate_signal_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if row(old.signal_type, old.statement, old.source_type, old.source_label, old.source_date,
         old.context, old.uncertainty_note, old.verification_status)
     is distinct from
     row(new.signal_type, new.statement, new.source_type, new.source_label, new.source_date,
         new.context, new.uncertainty_note, new.verification_status) then
    insert into public.candidate_signal_revisions
      (signal_id, candidate_id, actor_id, before_data, after_data)
    values (
      old.id,
      old.candidate_id,
      (select auth.uid()),
      pg_catalog.to_jsonb(old) - 'id' - 'candidate_id' - 'created_at' - 'updated_at',
      pg_catalog.to_jsonb(new) - 'id' - 'candidate_id' - 'created_at' - 'updated_at'
    );
  end if;
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.record_candidate_signal_revision() from public, anon, authenticated;

drop trigger if exists candidate_signals_record_revision on public.candidate_signals;
create trigger candidate_signals_record_revision
before update on public.candidate_signals
for each row execute function public.record_candidate_signal_revision();
