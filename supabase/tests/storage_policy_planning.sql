-- Disposable synthetic database only; run after rls_attack_suite.sql fixtures.
begin;
do $$
begin
  if has_function_privilege('anon', 'private.company_can_read_resume(text)', 'execute')
    or has_function_privilege('service_role', 'private.company_can_read_resume(text)', 'execute')
    or not has_function_privilege('authenticated', 'private.company_can_read_resume(text)', 'execute') then
    raise exception 'Unexpected resume lookup grants';
  end if;
end $$;

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$
begin
  if not private.company_can_read_resume('10000000-0000-0000-0000-000000000001/resume.pdf') then
    raise exception 'Applicant resume lookup denied to owning company';
  end if;
  if private.company_can_read_resume('10000000-0000-0000-0000-000000000003/resume.pdf')
    or private.company_can_read_resume('------------------------------------/resume.pdf')
    or private.company_can_read_resume('not-a-uuid/resume.pdf')
    or private.company_can_read_resume('resume.pdf')
    or private.company_can_read_resume(null) then
    raise exception 'Resume lookup allowed missing consent or malformed prefix';
  end if;
end $$;

reset role;
update public.candidate_profiles set share_with_applicant_companies = false
where user_id = '10000000-0000-0000-0000-000000000001';
set local role authenticated;
do $$
begin
  if private.company_can_read_resume('10000000-0000-0000-0000-000000000001/resume.pdf')
    or exists (select 1 from storage.objects where name = '10000000-0000-0000-0000-000000000001/resume.pdf') then
    raise exception 'Company retained resume access after consent withdrawal';
  end if;
end $$;
reset role;
update public.candidate_profiles set share_with_applicant_companies = true
where user_id = '10000000-0000-0000-0000-000000000001';
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
set local role authenticated;
do $$
begin
  if private.company_can_read_resume('10000000-0000-0000-0000-000000000001/resume.pdf') then
    raise exception 'Unrelated company learned applicant resume access';
  end if;
end $$;

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
insert into storage.objects (bucket_id, name, owner, metadata)
values ('candidate-documents', '10000000-0000-0000-0000-000000000001/resume.pdf',
  '10000000-0000-0000-0000-000000000001', '{"revision":2}')
on conflict (bucket_id, name) do update set metadata = excluded.metadata
returning id;
do $$
begin
  if not exists (select 1 from storage.objects
    where name = '10000000-0000-0000-0000-000000000001/resume.pdf' and metadata = '{"revision":2}'::jsonb) then
    raise exception 'Candidate authenticated replacement failed';
  end if;
  if private.company_can_read_resume('10000000-0000-0000-0000-000000000001/resume.pdf') then
    raise exception 'Non-company caller used company lookup';
  end if;
  begin
    insert into storage.objects (bucket_id, name, owner)
    values ('candidate-documents', '10000000-0000-0000-0000-000000000002/resume.docx', auth.uid());
    raise exception 'Candidate wrote another candidate resume';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects (bucket_id, name, owner)
    values ('candidate-documents', '10000000-0000-0000-0000-000000000001/unapproved.txt', auth.uid());
    raise exception 'Candidate wrote noncanonical path';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
-- A signed-in role without a live profile must not read old orphaned objects.
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000098', true);
insert into storage.objects(bucket_id, name, owner)
values ('candidate-documents', '10000000-0000-0000-0000-000000000098/resume.pdf',
  '10000000-0000-0000-0000-000000000098');
set local role authenticated;
do $$
begin
  if exists (select 1 from storage.objects where name = '10000000-0000-0000-0000-000000000098/resume.pdf') then
    raise exception 'Missing-profile JWT read an orphaned resume';
  end if;
end $$;
rollback;
