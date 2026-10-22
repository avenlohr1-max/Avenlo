-- Disposable database only. The deliberately orphaned object verifies that a
-- deleted user's unexpired JWT cannot still read or write candidate documents.
begin;
insert into auth.users (id, email, raw_user_meta_data)
values ('10000000-0000-0000-0000-000000000099', 'erasure@example.test', '{"account_type":"candidate"}');
insert into public.candidate_profiles (user_id, share_with_applicant_companies)
values ('10000000-0000-0000-0000-000000000099', true);
insert into public.candidate_skills (user_id, skill)
values ('10000000-0000-0000-0000-000000000099', 'Erasure test');
insert into public.candidate_education (user_id, institution)
values ('10000000-0000-0000-0000-000000000099', 'Synthetic university');
insert into public.candidate_education (user_id, institution)
values ('10000000-0000-0000-0000-000000000001', 'Other candidate university');
insert into public.candidate_signals (id, candidate_id, signal_type, statement, source_type, source_label, context, uncertainty_note)
values ('80000000-0000-0000-0000-000000000099', '10000000-0000-0000-0000-000000000099', 'skill', 'Synthetic evidence', 'candidate', 'Test source', 'Synthetic context', 'Synthetic uncertainty');
insert into public.candidate_capability_evidence (candidate_id, candidate_skill_id, signal_id)
select user_id, id, '80000000-0000-0000-0000-000000000099'::uuid
from public.candidate_skills where user_id = '10000000-0000-0000-0000-000000000099';
insert into public.applications (job_id, candidate_id)
values ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000099');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000099', true);
set local role authenticated;
insert into storage.objects (bucket_id, name, owner)
values ('candidate-documents', '10000000-0000-0000-0000-000000000099/resume.docx', '10000000-0000-0000-0000-000000000099');
update storage.objects set metadata = '{"reviewed":true}'
where name = '10000000-0000-0000-0000-000000000099/resume.docx';
update public.candidate_signals set statement = 'Corrected synthetic evidence'
where id = '80000000-0000-0000-0000-000000000099';
update public.candidate_education set degree = 'Corrected degree'
where user_id = '10000000-0000-0000-0000-000000000099';
do $$
begin
  if not exists (select 1 from public.candidate_education where degree = 'Corrected degree') then
    raise exception 'candidate could not inspect/correct own education';
  end if;
  if exists (select 1 from public.candidate_education where user_id = '10000000-0000-0000-0000-000000000001') then
    raise exception 'candidate read another candidate education';
  end if;
  begin
    update public.candidate_education set user_id = '10000000-0000-0000-0000-000000000001';
    raise exception 'candidate reassigned education ownership';
  exception when insufficient_privilege then null;
  end;
  if not exists (select 1 from storage.objects where name = '10000000-0000-0000-0000-000000000099/resume.docx' and metadata = '{"reviewed":true}'::jsonb) then
    raise exception 'live candidate could not upload/update canonical resume';
  end if;
  if not exists (select 1 from public.candidate_signal_revisions where candidate_id = '10000000-0000-0000-0000-000000000099') then
    raise exception 'erasure fixture has no correction history';
  end if;
  begin
    insert into storage.objects (bucket_id, name)
    values ('candidate-documents', '10000000-0000-0000-0000-000000000001/resume.docx');
    raise exception 'cross-user upload was allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
select set_config('request.jwt.claim.sub', '', true);
delete from auth.users where id = '10000000-0000-0000-0000-000000000099';

do $$
declare
  target_table text;
  target_column text;
  remaining integer;
begin
  foreach target_table in array array['profiles', 'candidate_profiles', 'candidate_skills', 'candidate_education', 'applications', 'candidate_signals', 'candidate_signal_revisions', 'candidate_capability_evidence', 'candidate_sharing_events'] loop
    target_column := case when target_table = 'profiles' then 'id'
      when target_table in ('candidate_profiles', 'candidate_skills', 'candidate_education') then 'user_id'
      else 'candidate_id' end;
    execute format('select count(*) from public.%I where %I = $1', target_table, target_column)
      into remaining using '10000000-0000-0000-0000-000000000099'::uuid;
    if remaining <> 0 then raise exception 'candidate data survived cascade in %', target_table; end if;
  end loop;
end;
$$;

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000099', true);
set local role authenticated;
do $$
declare affected integer;
begin
  if exists (select 1 from storage.objects where name = '10000000-0000-0000-0000-000000000099/resume.docx') then
    raise exception 'deleted user could read leftover document';
  end if;
  begin
    insert into storage.objects (bucket_id, name)
    values ('candidate-documents', '10000000-0000-0000-0000-000000000099/resume.pdf');
    raise exception 'deleted user could upload a document';
  exception when insufficient_privilege then null;
  end;
  update storage.objects set metadata = '{}' where name = '10000000-0000-0000-0000-000000000099/resume.docx';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'deleted user could update a document'; end if;
  delete from storage.objects where name = '10000000-0000-0000-0000-000000000099/resume.docx';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'deleted user could delete a document'; end if;
end;
$$;
rollback;
