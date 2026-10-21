-- Talent Record and resume import already use this table. Version its schema
-- and candidate-only access so clean databases match the application contract.
create table if not exists public.candidate_education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  institution text not null check (length(btrim(institution)) between 1 and 500),
  degree text,
  field_of_study text,
  start_year integer check (start_year between 1800 and 2200),
  end_year integer check (end_year between 1800 and 2200),
  currently_studying boolean not null default false,
  created_at timestamptz not null default now(),
  check (start_year is null or end_year is null or end_year >= start_year)
);
create index if not exists candidate_education_user_id_idx on public.candidate_education(user_id);
alter table public.candidate_education enable row level security;
revoke all on public.candidate_education from anon, authenticated;
grant select, insert, update, delete on public.candidate_education to authenticated;
grant select, insert, update, delete on public.candidate_education to service_role;

drop policy if exists "candidates manage own education" on public.candidate_education;
create policy "candidates manage own education"
on public.candidate_education for all to authenticated
using (
  user_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'candidate')
)
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'candidate')
);
