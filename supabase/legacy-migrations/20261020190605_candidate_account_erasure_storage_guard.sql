-- A deleted user's JWT can remain cryptographically valid until expiry.
-- Require an existing application profile on every candidate-document request,
-- even where an older permissive policy only checks the JWT's folder prefix.
drop policy if exists "candidate documents require live account" on storage.objects;
create policy "candidate documents require live account"
on storage.objects as restrictive for all to authenticated
using (
  bucket_id <> 'candidate-documents'
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()))
)
with check (
  bucket_id <> 'candidate-documents'
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()))
);

-- Use exact canonical paths rather than historical regex escaping. Uploads
-- can now use the candidate's authenticated client instead of bypassing RLS.
drop policy if exists "candidates upload own documents" on storage.objects;
create policy "candidates upload own documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'candidate-documents'
  and name in (
    (select auth.uid())::text || '/resume.pdf',
    (select auth.uid())::text || '/resume.doc',
    (select auth.uid())::text || '/resume.docx'
  )
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'candidate')
);

drop policy if exists "candidates update own documents" on storage.objects;
create policy "candidates update own documents"
on storage.objects for update to authenticated
using (
  bucket_id = 'candidate-documents'
  and name in (
    (select auth.uid())::text || '/resume.pdf',
    (select auth.uid())::text || '/resume.doc',
    (select auth.uid())::text || '/resume.docx'
  )
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'candidate')
)
with check (
  bucket_id = 'candidate-documents'
  and name in (
    (select auth.uid())::text || '/resume.pdf',
    (select auth.uid())::text || '/resume.doc',
    (select auth.uid())::text || '/resume.docx'
  )
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'candidate')
);
