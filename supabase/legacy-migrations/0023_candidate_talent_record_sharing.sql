-- Candidate-controlled sharing for the Talent Record.
-- Existing candidates default to private; consent is required before companies
-- with an application from that candidate can read profile details or resumes.

alter table public.candidate_profiles
  add column if not exists share_with_applicant_companies boolean not null default false;

drop policy if exists "companies read applicant profiles" on public.profiles;
create policy "companies read applicant profiles"
on public.profiles
for select to authenticated
using (
  public.current_user_role() = 'company'
  and exists (
    select 1
    from public.candidate_profiles cp
    join public.applications a on a.candidate_id = cp.user_id
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where cp.user_id = profiles.id
      and cp.share_with_applicant_companies
      and c.owner_id = auth.uid()
  )
);

drop policy if exists "companies read applicant candidate profiles" on public.candidate_profiles;
create policy "companies read applicant candidate profiles"
on public.candidate_profiles
for select to authenticated
using (
  public.current_user_role() = 'company'
  and share_with_applicant_companies
  and exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where a.candidate_id = candidate_profiles.user_id
      and c.owner_id = auth.uid()
  )
);

drop policy if exists "companies read applicant skills" on public.candidate_skills;
create policy "companies read applicant skills"
on public.candidate_skills
for select to authenticated
using (
  public.current_user_role() = 'company'
  and exists (
    select 1
    from public.candidate_profiles cp
    join public.applications a on a.candidate_id = cp.user_id
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where cp.user_id = candidate_skills.user_id
      and cp.share_with_applicant_companies
      and c.owner_id = auth.uid()
  )
);

drop policy if exists "companies read applicant resumes" on storage.objects;
create policy "companies read applicant resumes"
on storage.objects
for select to authenticated
using (
  bucket_id = 'candidate-documents'
  and public.current_user_role() = 'company'
  and (storage.foldername(storage.objects.name))[1] ~ '^[0-9a-fA-F-]{36}$'
  and exists (
    select 1
    from public.candidate_profiles cp
    join public.applications a on a.candidate_id = cp.user_id
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where cp.user_id = ((storage.foldername(storage.objects.name))[1])::uuid
      and cp.share_with_applicant_companies
      and c.owner_id = auth.uid()
  )
);
