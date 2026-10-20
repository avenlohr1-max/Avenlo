-- Disposable CI database only; fixtures from rls_attack_suite.sql are required.
begin;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
set local role authenticated;
insert into public.candidate_opportunities (id, candidate_id, job_id, curator_id, basis_field, curator_note) values
 ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'title', 'Explore the published role description.'),
 ('90000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'title', 'A second candidate suggestion.'),
 ('90000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'title', 'Private by default candidate.');
do $$
begin
  begin
    insert into public.candidate_opportunities (candidate_id, job_id, curator_id, basis_field, curator_note)
    values ('10000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'title', 'Draft role must be rejected.');
    raise exception 'operations suggested a draft role';
  exception when insufficient_privilege then null;
  end;
  update public.jobs set expires_at = now() - interval '1 day' where id = '60000000-0000-0000-0000-000000000001';
  begin
    insert into public.candidate_opportunities (candidate_id, job_id, curator_id, basis_field, curator_note)
    values ('10000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'title', 'Expired role must be rejected.');
    raise exception 'operations suggested an expired role';
  exception when insufficient_privilege then null;
  end;
  update public.jobs set expires_at = null where id = '60000000-0000-0000-0000-000000000001';
  begin
    insert into public.candidate_opportunities (candidate_id, job_id, curator_id, basis_field, curator_note)
    values ('10000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'title', 'Forged curator.');
    raise exception 'operations forged the curator identity';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$
declare n integer;
begin
  select count(*) into n from public.candidate_opportunities;
  if n <> 1 then raise exception 'candidate did not receive exactly their own suggestion'; end if;
  begin
    insert into public.candidate_opportunities (candidate_id, job_id, curator_id, basis_field, curator_note)
    values ('10000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'title', 'Candidate cannot impersonate operations.');
    raise exception 'candidate created a curated suggestion';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.candidate_opportunity_decisions (opportunity_id, candidate_id, private_note)
    values ('90000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Foreign suggestion');
    raise exception 'candidate attached a decision to another candidate suggestion';
  exception when foreign_key_violation or insufficient_privilege then null;
  end;
  begin
    insert into public.candidate_opportunity_evidence (opportunity_id, candidate_id, signal_id)
    values ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001');
    raise exception 'candidate linked unreviewed evidence';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.candidate_opportunity_evidence (opportunity_id, candidate_id, signal_id)
    values ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000002');
    raise exception 'candidate linked another candidate signal';
  exception when insufficient_privilege or foreign_key_violation then null;
  end;
end;
$$;
update public.candidate_signals set verification_status = 'candidate_confirmed' where id = '80000000-0000-0000-0000-000000000001';
insert into public.candidate_opportunity_evidence (opportunity_id, candidate_id, signal_id)
values ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001');
insert into public.candidate_opportunity_decisions (opportunity_id, candidate_id, disposition, private_note)
values ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'dismissed', 'My private concern');
update public.candidate_opportunity_decisions set disposition = 'saved', private_note = 'Corrected private question';
do $$
begin
  if not exists (select 1 from public.candidate_opportunity_decisions where disposition = 'saved' and private_note = 'Corrected private question') then raise exception 'candidate could not restore/correct own decision'; end if;
  if exists (select 1 from public.applications where job_id = '60000000-0000-0000-0000-000000000003') then raise exception 'saving a suggestion auto-created an application'; end if;
end;
$$;
reset role;

select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$
begin
  if exists (select 1 from public.candidate_opportunity_decisions) then raise exception 'operations read private candidate decisions'; end if;
  if exists (select 1 from public.candidate_opportunity_evidence) then raise exception 'operations read private candidate evidence links'; end if;
end;
$$;
reset role;

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$
begin
  if exists (select 1 from public.candidate_opportunities) then raise exception 'company read candidate suggestions'; end if;
  if exists (select 1 from public.candidate_opportunity_decisions) then raise exception 'company read private decisions'; end if;
  if exists (select 1 from public.candidate_opportunity_evidence) then raise exception 'company read private evidence'; end if;
end;
$$;
reset role;
select set_config('request.jwt.claim.sub', '', true);
do $$
begin
  if (select share_with_applicant_companies from public.candidate_profiles where user_id = '10000000-0000-0000-0000-000000000003') then raise exception 'curation changed candidate sharing consent'; end if;
end;
$$;
delete from public.jobs where id = '60000000-0000-0000-0000-000000000003';
do $$
begin
  if not exists (select 1 from public.candidate_opportunities where id = '90000000-0000-0000-0000-000000000001' and job_id is null) then raise exception 'role deletion removed the candidate suggestion history'; end if;
  if not exists (select 1 from public.candidate_opportunity_decisions where opportunity_id = '90000000-0000-0000-0000-000000000001' and private_note = 'Corrected private question') then raise exception 'role deletion erased private candidate notes'; end if;
end;
$$;
delete from auth.users where id = '10000000-0000-0000-0000-000000000001';
do $$
begin
  if exists (select 1 from public.candidate_opportunities where candidate_id = '10000000-0000-0000-0000-000000000001') then raise exception 'suggestions survived account deletion'; end if;
  if exists (select 1 from public.candidate_opportunity_decisions where candidate_id = '10000000-0000-0000-0000-000000000001') then raise exception 'decisions survived account deletion'; end if;
  if exists (select 1 from public.candidate_opportunity_evidence where candidate_id = '10000000-0000-0000-0000-000000000001') then raise exception 'evidence links survived account deletion'; end if;
  if not exists (select 1 from public.candidate_opportunities where candidate_id = '10000000-0000-0000-0000-000000000002') then raise exception 'another candidate lost their suggestion'; end if;
end;
$$;
rollback;
