begin;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;
insert into public.employer_role_briefs (id, company_id, created_by, title)
values ('a0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Draft analyst');
do $$
begin
  begin
    insert into public.employer_role_briefs (company_id, created_by, title)
    values ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Foreign company');
    raise exception 'cross-company brief creation allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.employer_role_briefs set status = 'submitted' where id = 'a0000000-0000-0000-0000-000000000001';
    raise exception 'incomplete role submitted';
  exception when raise_exception then if sqlerrm = 'incomplete role submitted' then raise; end if;
  end;
  begin
    update public.employer_role_briefs set status = 'approved', review_note = 'Self-approved' where id = 'a0000000-0000-0000-0000-000000000001';
    raise exception 'company self-approved';
  exception when raise_exception then if sqlerrm = 'company self-approved' then raise; end if;
  end;
end;
$$;
update public.employer_role_briefs set summary = 'Build reporting.', outcomes = '["Deliver monthly reporting."]',
  essential = '[{"requirement":"SQL","evidence":"Redacted reporting query or discussion","rationale":"Maintains the reporting pipeline"}]',
  preferred = '[{"requirement":"Dashboards","evidence":"Example or discussion","rationale":"Useful collaboration context"}]', status = 'submitted'
where id = 'a0000000-0000-0000-0000-000000000001';
do $$
begin
  begin
    update public.employer_role_briefs set preferred = '[{"requirement":" sql ","evidence":"Example","rationale":"Optional"}]' where id = 'a0000000-0000-0000-0000-000000000001';
    raise exception 'duplicate essential/preferred criterion accepted';
  exception when raise_exception then if sqlerrm = 'duplicate essential/preferred criterion accepted' then raise; end if;
  end;
  begin
    insert into public.employer_role_brief_history (brief_id, revision, after_data) values ('a0000000-0000-0000-0000-000000000001', 99, '{}');
    raise exception 'company forged revision history';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$
begin
  begin
    update public.employer_role_briefs set title = 'Rewritten by reviewer', status = 'approved', review_note = 'Changed employer definition' where id = 'a0000000-0000-0000-0000-000000000001';
    raise exception 'reviewer rewrote employer criteria';
  exception when raise_exception then if sqlerrm = 'reviewer rewrote employer criteria' then raise; end if;
  end;
end;
$$;
update public.employer_role_briefs set status = 'approved', review_note = 'Outcomes, essential rationale and expected evidence reviewed.' where id = 'a0000000-0000-0000-0000-000000000001' and revision = 2;
do $$
begin
  if not exists (select 1 from public.employer_role_briefs where revision = 3 and status = 'approved' and reviewed_by = '30000000-0000-0000-0000-000000000001' and reviewed_at is not null) then raise exception 'review was not attributed to actual reviewer'; end if;
end;
$$;
reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;
update public.employer_role_briefs set title = 'Corrected analyst' where id = 'a0000000-0000-0000-0000-000000000001' and revision = 3;
do $$
declare n integer;
begin
  if not exists (select 1 from public.employer_role_briefs where revision = 4 and status = 'draft' and reviewed_by is null and review_note is null) then raise exception 'company edit preserved stale approval'; end if;
  select count(*) into n from public.employer_role_brief_history where brief_id = 'a0000000-0000-0000-0000-000000000001';
  if n <> 4 then raise exception 'missing role revision history'; end if;
  if not exists (select 1 from public.employer_role_brief_history where revision = 3 and after_data->>'status' = 'approved' and after_data->>'review_note' is not null) then raise exception 'prior approval feedback was lost'; end if;
  update public.employer_role_briefs set title = 'Stale writer' where id = 'a0000000-0000-0000-0000-000000000001' and revision = 3;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'stale revision overwrote current brief'; end if;
end;
$$;
update public.employer_role_briefs set status = 'submitted' where id = 'a0000000-0000-0000-0000-000000000001';
reset role;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
set local role authenticated;
update public.employer_role_briefs set status = 'changes_requested', review_note = 'Clarify the reporting outcome.' where id = 'a0000000-0000-0000-0000-000000000001' and revision = 5;
reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
set local role authenticated;
do $$
declare n integer;
begin
  if exists (select 1 from public.employer_role_briefs) then raise exception 'company read another employer brief'; end if;
  if exists (select 1 from public.employer_role_brief_history) then raise exception 'company read another employer history'; end if;
  update public.employer_role_briefs set title = 'Foreign edit' where id = 'a0000000-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'company edited another employer brief'; end if;
end;
$$;
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$
begin
  if exists (select 1 from public.employer_role_briefs) then raise exception 'candidate read private employer brief'; end if;
  if exists (select 1 from public.employer_role_brief_history) then raise exception 'candidate read private role review history'; end if;
end;
$$;
reset role;
select set_config('request.jwt.claim.sub', '', true);
do $$
begin
  if (select count(*) from public.jobs) <> 3 then raise exception 'role brief workflow unexpectedly created/published jobs'; end if;
  if has_function_privilege('authenticated', 'private.record_role_brief_revision()', 'EXECUTE') or has_function_privilege('anon', 'private.record_role_brief_revision()', 'EXECUTE') then raise exception 'role audit writer callable by client'; end if;
end;
$$;
-- Employer account removal queues attribution SET NULL and parent cascades.
-- A queued revision writer must not insert history for the deleted brief.
delete from public.jobs where company_id = '50000000-0000-0000-0000-000000000001';
delete from public.profiles where id = '20000000-0000-0000-0000-000000000001';
set constraints all immediate;
do $$
begin
  if exists(select 1 from public.companies where id = '50000000-0000-0000-0000-000000000001')
    or exists(select 1 from public.employer_role_briefs where id = 'a0000000-0000-0000-0000-000000000001')
    or exists(select 1 from public.employer_role_brief_history where brief_id = 'a0000000-0000-0000-0000-000000000001')
  then raise exception 'employer account removal left company or role history'; end if;
end;
$$;
rollback;
