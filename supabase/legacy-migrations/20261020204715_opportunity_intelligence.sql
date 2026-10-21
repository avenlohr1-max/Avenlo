-- Human-curated role suggestions. Candidate decisions and evidence remain in
-- separate private tables; curators cannot read those through the Data API.
-- Role pages already use this field, but legacy migrations did not define it.
alter table public.jobs add column if not exists expires_at timestamptz;

create table public.candidate_opportunities (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  curator_id uuid references public.profiles(id) on delete set null,
  basis_field text not null check (basis_field in ('title','skills','industry','location','work_mode','seniority','experience_years')),
  curator_note text not null check (length(btrim(curator_note)) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique (candidate_id, job_id),
  unique (id, candidate_id)
);
create index candidate_opportunities_job_idx on public.candidate_opportunities(job_id);
create index candidate_opportunities_curator_idx on public.candidate_opportunities(curator_id);

create table public.candidate_opportunity_decisions (
  opportunity_id uuid primary key,
  candidate_id uuid not null,
  disposition text not null default 'considering' check (disposition in ('considering','saved','dismissed')),
  private_note text not null default '' check (length(private_note) <= 2000),
  updated_at timestamptz not null default now(),
  foreign key (opportunity_id, candidate_id) references public.candidate_opportunities(id, candidate_id) on delete cascade
);
create index candidate_opportunity_decisions_candidate_idx on public.candidate_opportunity_decisions(candidate_id);

create table public.candidate_opportunity_evidence (
  opportunity_id uuid not null,
  candidate_id uuid not null,
  signal_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (opportunity_id, signal_id),
  foreign key (opportunity_id, candidate_id) references public.candidate_opportunities(id, candidate_id) on delete cascade,
  foreign key (candidate_id, signal_id) references public.candidate_signals(candidate_id, id) on delete cascade
);
create index candidate_opportunity_evidence_candidate_idx on public.candidate_opportunity_evidence(candidate_id);
create index candidate_opportunity_evidence_signal_idx on public.candidate_opportunity_evidence(candidate_id, signal_id);

alter table public.candidate_opportunities enable row level security;
alter table public.candidate_opportunity_decisions enable row level security;
alter table public.candidate_opportunity_evidence enable row level security;
revoke all on public.candidate_opportunities, public.candidate_opportunity_decisions, public.candidate_opportunity_evidence from anon, authenticated;
grant select, insert on public.candidate_opportunities to authenticated;
grant select, insert, update, delete on public.candidate_opportunity_decisions to authenticated;
grant select, insert, delete on public.candidate_opportunity_evidence to authenticated;
grant all on public.candidate_opportunities, public.candidate_opportunity_decisions, public.candidate_opportunity_evidence to service_role;

create policy "candidate or curator reads suggestions" on public.candidate_opportunities
for select to authenticated using (
  candidate_id = (select auth.uid())
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('staff','founder'))
);
create policy "operations curate open roles" on public.candidate_opportunities
for insert to authenticated with check (
  curator_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('staff','founder'))
  and exists (select 1 from public.profiles p where p.id = candidate_id and p.role = 'candidate')
  and exists (select 1 from public.jobs j where j.id = job_id and j.status = 'open' and (j.expires_at is null or j.expires_at > now()))
);
create policy "candidate manages private opportunity decisions" on public.candidate_opportunity_decisions
for all to authenticated
using (candidate_id = (select auth.uid()))
with check (candidate_id = (select auth.uid()));

create policy "candidate reads own opportunity evidence" on public.candidate_opportunity_evidence
for select to authenticated using (candidate_id = (select auth.uid()));
create policy "candidate links confirmed opportunity evidence" on public.candidate_opportunity_evidence
for insert to authenticated with check (
  candidate_id = (select auth.uid())
  and exists (select 1 from public.candidate_signals s where s.id = signal_id and s.candidate_id = (select auth.uid()) and s.verification_status = 'candidate_confirmed')
);
create policy "candidate removes own opportunity evidence" on public.candidate_opportunity_evidence
for delete to authenticated using (candidate_id = (select auth.uid()));
