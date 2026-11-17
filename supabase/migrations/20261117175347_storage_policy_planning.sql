-- Storage upserts also plan SELECT policies for their RETURNING subqueries.
-- Inline profile/application lookups recursively expand those tables' RLS.
-- Keep the same ownership/consent rules using bounded private lookups instead.
-- profiles.role is NOT NULL, so a non-null role also proves a live profile.
alter policy "candidate documents require live account" on storage.objects
using (bucket_id <> 'candidate-documents' or (select private.current_user_role()) is not null)
with check (bucket_id <> 'candidate-documents' or (select private.current_user_role()) is not null);

alter policy "candidates upload own documents" on storage.objects
with check (
  bucket_id = 'candidate-documents'
  and name in (
    (select auth.uid())::text || '/resume.pdf',
    (select auth.uid())::text || '/resume.doc',
    (select auth.uid())::text || '/resume.docx'
  )
  and (select private.current_user_role()) = 'candidate'
);

alter policy "candidates update own documents" on storage.objects
using (
  bucket_id = 'candidate-documents'
  and name in (
    (select auth.uid())::text || '/resume.pdf',
    (select auth.uid())::text || '/resume.doc',
    (select auth.uid())::text || '/resume.docx'
  )
  and (select private.current_user_role()) = 'candidate'
)
with check (
  bucket_id = 'candidate-documents'
  and name in (
    (select auth.uid())::text || '/resume.pdf',
    (select auth.uid())::text || '/resume.doc',
    (select auth.uid())::text || '/resume.docx'
  )
  and (select private.current_user_role()) = 'candidate'
);

alter policy "candidates read own documents" on storage.objects
using (
  bucket_id = 'candidate-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.current_user_role()) in ('staff', 'founder')
  )
);

-- This boolean-only internal lookup deliberately avoids expanding RLS on all
-- four joined tables. It checks the caller, role, company ownership and current
-- candidate consent itself. It is not exposed as a Data API RPC.
create function private.company_can_read_resume(p_name text)
returns boolean language plpgsql stable security definer set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  candidate_folder text := (storage.foldername(p_name))[1];
begin
  if caller_id is null or (select private.current_user_role()) is distinct from 'company' then
    return false;
  end if;
  -- Validate before casting; SQL AND expressions do not guarantee evaluation order.
  if candidate_folder is null or candidate_folder !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return false;
  end if;
  return exists (
    select 1 from public.candidate_profiles cp
    join public.applications a on a.candidate_id = cp.user_id
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where cp.user_id = candidate_folder::uuid
      and cp.share_with_applicant_companies
      and c.owner_id = caller_id
  );
end;
$$;
revoke all on function private.company_can_read_resume(text) from public, anon, authenticated, service_role;
grant execute on function private.company_can_read_resume(text) to authenticated;

alter policy "companies read applicant resumes" on storage.objects
using (bucket_id = 'candidate-documents' and private.company_can_read_resume(name));
