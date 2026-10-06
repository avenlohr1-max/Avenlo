-- Ensure the private candidate resume bucket exists in every environment.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-documents',
  'candidate-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = excluded.allowed_mime_types;

-- Re-assert the candidate-only storage policies so production and local
-- environments behave consistently. Resume objects are always stored as
-- <auth.uid()>/resume.<extension>.
drop policy if exists "candidates upload own documents" on storage.objects;
create policy "candidates upload own documents"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'candidate-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and storage.filename(name) ~ '^resume\\.(pdf|doc|docx)$'
);

drop policy if exists "candidates read own documents" on storage.objects;
create policy "candidates read own documents"
on storage.objects
for select to authenticated
using (
  bucket_id = 'candidate-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or public.current_user_role() in ('staff', 'founder')
  )
);

drop policy if exists "candidates update own documents" on storage.objects;
create policy "candidates update own documents"
on storage.objects
for update to authenticated
using (
  bucket_id = 'candidate-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and storage.filename(name) ~ '^resume\\.(pdf|doc|docx)$'
)
with check (
  bucket_id = 'candidate-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and storage.filename(name) ~ '^resume\\.(pdf|doc|docx)$'
);

drop policy if exists "candidates delete own documents" on storage.objects;
create policy "candidates delete own documents"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'candidate-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
