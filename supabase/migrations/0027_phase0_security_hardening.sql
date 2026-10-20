-- Move role lookup behind a non-API schema and remove direct public execution
-- of SECURITY DEFINER helpers. Keep the helper available to authenticated RLS
-- policies, but inaccessible to anon and not exposed through PostgREST.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.id = (select auth.uid());
$$;

revoke all on function private.current_user_role() from public, anon;
grant execute on function private.current_user_role() to authenticated;

-- Replace every application policy that used the public SECURITY DEFINER helper.
drop policy if exists "company owners read company" on public.companies;
create policy "company owners read company"
on public.companies
for select to authenticated
using (
  owner_id = (select auth.uid())
  or (select private.current_user_role()) = any (array['staff'::public.user_role, 'founder'::public.user_role])
);

drop policy if exists "candidates see open jobs" on public.jobs;
create policy "candidates see open jobs"
on public.jobs
for select to authenticated
using (
  status = 'open'::public.job_status
  or (select private.current_user_role()) = any (array['staff'::public.user_role, 'founder'::public.user_role])
);

drop policy if exists "company owners manage jobs" on public.jobs;
create policy "company owners manage jobs"
on public.jobs
for all to authenticated
using (
  exists (
    select 1 from public.companies as c
    where c.id = jobs.company_id and c.owner_id = (select auth.uid())
  )
  or (select private.current_user_role()) = any (array['staff'::public.user_role, 'founder'::public.user_role])
)
with check (
  exists (
    select 1 from public.companies as c
    where c.id = jobs.company_id and c.owner_id = (select auth.uid())
  )
  or (select private.current_user_role()) = any (array['staff'::public.user_role, 'founder'::public.user_role])
);

drop policy if exists "company staff read applications" on public.applications;
create policy "company staff read applications"
on public.applications
for select to authenticated
using (
  (select private.current_user_role()) = any (array['staff'::public.user_role, 'founder'::public.user_role])
  or exists (
    select 1
    from public.jobs as j
    join public.companies as c on c.id = j.company_id
    where j.id = applications.job_id and c.owner_id = (select auth.uid())
  )
);

drop policy if exists "staff read audit" on public.audit_logs;
create policy "staff read audit"
on public.audit_logs
for select to authenticated
using (
  (select private.current_user_role()) = any (array['staff'::public.user_role, 'founder'::public.user_role])
);

-- Applicant access policies added in migration 0016 also use the private helper.
create index if not exists applications_candidate_job_idx
on public.applications(candidate_id, job_id);

drop policy if exists "companies read applicant profiles" on public.profiles;
create policy "companies read applicant profiles"
on public.profiles
for select to authenticated
using (
  (select private.current_user_role()) = 'company'::public.user_role
  and exists (
    select 1
    from public.applications as a
    join public.jobs as j on j.id = a.job_id
    join public.companies as c on c.id = j.company_id
    where a.candidate_id = profiles.id and c.owner_id = (select auth.uid())
  )
);

drop policy if exists "companies read applicant candidate profiles" on public.candidate_profiles;
create policy "companies read applicant candidate profiles"
on public.candidate_profiles
for select to authenticated
using (
  (select private.current_user_role()) = 'company'::public.user_role
  and exists (
    select 1
    from public.applications as a
    join public.jobs as j on j.id = a.job_id
    join public.companies as c on c.id = j.company_id
    where a.candidate_id = candidate_profiles.user_id and c.owner_id = (select auth.uid())
  )
);

drop policy if exists "companies read applicant skills" on public.candidate_skills;
create policy "companies read applicant skills"
on public.candidate_skills
for select to authenticated
using (
  (select private.current_user_role()) = 'company'::public.user_role
  and exists (
    select 1
    from public.applications as a
    join public.jobs as j on j.id = a.job_id
    join public.companies as c on c.id = j.company_id
    where a.candidate_id = candidate_skills.user_id and c.owner_id = (select auth.uid())
  )
);

drop policy if exists "companies read applicant resumes" on storage.objects;
create policy "companies read applicant resumes"
on storage.objects
for select to authenticated
using (
  bucket_id = 'candidate-documents'
  and (select private.current_user_role()) = 'company'::public.user_role
  and (storage.foldername(storage.objects.name))[1] ~ '^[0-9a-fA-F-]{36}$'
  and exists (
    select 1
    from public.applications as a
    join public.jobs as j on j.id = a.job_id
    join public.companies as c on c.id = j.company_id
    where a.candidate_id = ((storage.foldername(storage.objects.name))[1])::uuid
      and c.owner_id = (select auth.uid())
  )
);

drop policy if exists "companies update own applicant status" on public.applications;
create policy "companies update own applicant status"
on public.applications
for update to authenticated
using (
  (select private.current_user_role()) = 'company'::public.user_role
  and exists (
    select 1
    from public.jobs as j
    join public.companies as c on c.id = j.company_id
    where j.id = applications.job_id and c.owner_id = (select auth.uid())
  )
)
with check (
  (select private.current_user_role()) = 'company'::public.user_role
  and exists (
    select 1
    from public.jobs as j
    join public.companies as c on c.id = j.company_id
    where j.id = applications.job_id and c.owner_id = (select auth.uid())
  )
);

-- The trigger still needs a privileged role check; keep it hardened and callable
-- only as a trigger, not as an RPC.
create or replace function public.protect_company_application_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.current_user_role() = 'company'::public.user_role then
    new.candidate_id := old.candidate_id;
    new.job_id := old.job_id;
    new.match_score := old.match_score;
    new.match_explanation := old.match_explanation;
    new.updated_at := pg_catalog.now();
  end if;
  return new;
end;
$$;
revoke all on function public.protect_company_application_review() from public, anon, authenticated;
drop trigger if exists applications_protect_company_review on public.applications;
create trigger applications_protect_company_review
before update on public.applications
for each row execute function public.protect_company_application_review();

-- This helper is now used through the private schema from policies only.
revoke all on function public.current_user_role() from public, anon, authenticated;

-- Profile creation remains an auth.users trigger, never a public RPC.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
