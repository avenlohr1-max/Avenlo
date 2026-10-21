-- Repair the applicant-resume policy on databases where migration 0016 was
-- already applied before its correlated storage.objects.name reference was fixed.
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
    from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where a.candidate_id = ((storage.foldername(storage.objects.name))[1])::uuid
      and c.owner_id = auth.uid()
  )
);
