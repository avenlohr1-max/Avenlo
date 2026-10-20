begin;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
insert into public.decision_rooms(id,candidate_id,company_id,title,purpose)
values ('b0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','Decision room','Discuss reporting expectations');
insert into public.proof_packages(id,candidate_id,room_id,signal_id,title,statement,source_label,context,uncertainty_note,redaction_note,shared)
values ('b1000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000003','Reporting proof','Built reports','Candidate project','Redacted team context','Self reported','Client removed',true);
do $$ begin
  if exists(select 1 from public.proof_packages where shared) then raise exception 'proof insert bypassed private preview'; end if;
  begin
    insert into public.decision_rooms(candidate_id,company_id,title,purpose) values ('10000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000001','Forged','Wrong candidate');
    raise exception 'forged room accepted';
  exception when insufficient_privilege then null; end;
end $$;
insert into public.intelligence_cases(id,candidate_id,service,scope,consent)
values ('b2000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','career_review','Review career options; no ledger access',true);
reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$ declare n int; begin
  if not exists(select 1 from public.decision_rooms) then raise exception 'invited employer cannot enter'; end if;
  if exists(select 1 from public.proof_packages) then raise exception 'private proof leaked'; end if;
  if exists(select 1 from public.candidate_signals) then raise exception 'room granted ledger access'; end if;
  if exists(select 1 from public.intelligence_cases) then raise exception 'employer read service case'; end if;
  update public.decision_rooms set active = false; get diagnostics n = row_count;
  if n <> 0 then raise exception 'employer changed candidate consent'; end if;
end $$;
insert into public.room_messages(room_id,author_id,kind,body,created_at)
values ('b0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','question','Which reporting work can you discuss?','2000-01-01');
do $$ begin
  if exists(select 1 from public.room_messages where author_id <> auth.uid() or created_at < now() - interval '1 minute') then raise exception 'message authorship or time forged'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.decision_rooms) or exists(select 1 from public.room_messages) then raise exception 'other employer entered room'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
update public.proof_packages set shared = true where id = 'b1000000-0000-0000-0000-000000000001';
insert into public.dossier_entries(room_id,kind,body,proof_id) values ('b0000000-0000-0000-0000-000000000001','evidence_reference','Discuss the reporting project','b1000000-0000-0000-0000-000000000001');
insert into public.dossier_entries(room_id,kind,body) values ('b0000000-0000-0000-0000-000000000001','correction','Clarify the project scope before deciding');
do $$ begin
  begin
    update public.intelligence_cases set assigned_staff = auth.uid();
    raise exception 'candidate assigned service staff';
  exception when raise_exception then if sqlerrm = 'candidate assigned service staff' then raise; end if; end;
  begin
    insert into public.collaboration_events(candidate_id,resource_id,resource_type,operation) values (auth.uid(),gen_random_uuid(),'forged','INSERT');
    raise exception 'client forged consent audit';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.proof_packages) <> 1 then raise exception 'approved proof not visible'; end if;
  if (select count(*) from public.dossier_entries) <> 2 then raise exception 'dossier unavailable'; end if;
end $$;
insert into public.dossier_exports(room_id) values ('b0000000-0000-0000-0000-000000000001');
reset role;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.decision_rooms) or exists(select 1 from public.proof_packages) then raise exception 'staff gained room access'; end if;
  if (select count(*) from public.intelligence_cases) <> 1 then raise exception 'consented triage unavailable'; end if;
end $$;
update public.intelligence_cases set assigned_staff = auth.uid(), status = 'in_progress', staff_declaration = 'Scope reviewed', resolution_note = 'Scoped discussion accepted';
do $$ begin
  if not exists(select 1 from public.intelligence_case_notes where kind = 'progress') then raise exception 'case progress not recorded'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
insert into public.intelligence_case_notes(case_id,kind,body) values ('b2000000-0000-0000-0000-000000000001','escalation','Please ask a founder to review this scope');
do $$ begin
  if not exists(select 1 from public.intelligence_cases where status = 'escalated') then raise exception 'candidate escalation did not reach founder queue'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '40000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.intelligence_cases) <> 1 then raise exception 'founder cannot review escalation'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
update public.candidate_signals set statement = 'Corrected reporting scope' where id = '80000000-0000-0000-0000-000000000003';
do $$ begin
  if exists(select 1 from public.proof_packages where shared) then raise exception 'source correction did not withdraw proof'; end if;
  begin
    update public.proof_packages set shared = true;
    raise exception 'stale snapshot reshared';
  exception when raise_exception then if sqlerrm = 'stale snapshot reshared' then raise; end if; end;
  begin
    insert into public.proof_packages(candidate_id,signal_id,source_revision,title,statement,source_label,context,uncertainty_note,redaction_note)
    values(auth.uid(),'80000000-0000-0000-0000-000000000003',1,'Stale form','Old statement','Source','Context','Unknown','None');
    raise exception 'stale proof preparation accepted';
  exception when raise_exception then if sqlerrm = 'stale proof preparation accepted' then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.proof_packages) then raise exception 'corrected proof still visible'; end if;
  if (select count(*) from public.dossier_entries) <> 1 then raise exception 'withdrawn evidence reference remains visible'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
update public.decision_rooms set active = false;
update public.intelligence_cases set consent = false, status = 'closed';
reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.decision_rooms) or exists(select 1 from public.room_messages) or exists(select 1 from public.dossier_entries) or exists(select 1 from public.dossier_exports) then raise exception 'withdrawn room remains accessible'; end if;
  begin
    insert into public.room_messages(room_id,kind,body) values ('b0000000-0000-0000-0000-000000000001','answer','After withdrawal');
    raise exception 'post withdrawal message allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.intelligence_cases) or exists(select 1 from public.intelligence_case_notes) then raise exception 'withdrawn service remains accessible'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '', true);
delete from auth.users where id = '10000000-0000-0000-0000-000000000001';
do $$ begin
  if exists(select 1 from public.decision_rooms) or exists(select 1 from public.proof_packages) or exists(select 1 from public.room_messages) or exists(select 1 from public.dossier_entries) or exists(select 1 from public.intelligence_cases) or exists(select 1 from public.intelligence_case_notes) or exists(select 1 from public.collaboration_events) then raise exception 'candidate erasure left collaboration data'; end if;
  if has_function_privilege('authenticated','private.withdraw_changed_proof()','execute') or has_function_privilege('anon','private.audit_collaboration()','execute') then raise exception 'trigger function publicly callable'; end if;
end $$;
rollback;

begin;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
insert into public.decision_rooms(id,candidate_id,company_id,title,purpose) values('b6000000-0000-0000-0000-000000000001',auth.uid(),'50000000-0000-0000-0000-000000000001','Expiry fixture','Check expiry');
reset role;
select set_config('request.jwt.claim.sub', '', true);
update public.decision_rooms set created_at = now() - interval '31 days', expires_at = now() - interval '1 day' where id = 'b6000000-0000-0000-0000-000000000001';
update public.jobs set expires_at = now() - interval '1 day' where id = '60000000-0000-0000-0000-000000000003';
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.decision_rooms where id = 'b6000000-0000-0000-0000-000000000001') then raise exception 'employer retained expired room'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$ begin
  begin
    insert into public.room_messages(room_id,kind,body) values('b6000000-0000-0000-0000-000000000001','question','After expiry');
    raise exception 'expired room message accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.applications(job_id,candidate_id) values('60000000-0000-0000-0000-000000000003',auth.uid());
    raise exception 'expired application accepted';
  exception when insufficient_privilege then null; end;
end $$;
rollback;

begin;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;
insert into public.employer_role_briefs(id,company_id,created_by,title,summary,outcomes,essential,status)
values ('b3000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',auth.uid(),'Reporting analyst','Maintain reporting','["Reviewed monthly reports"]','[{"requirement":"SQL","evidence":"Redacted query or project discussion","rationale":"Maintains reporting"}]','submitted');
reset role;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
set local role authenticated;
update public.employer_role_briefs set status = 'approved', review_note = 'Scope and expected evidence reviewed' where id = 'b3000000-0000-0000-0000-000000000001';
reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;
insert into public.jobs(id,company_id,created_by,title,description,status,role_brief_id,role_brief_revision,role_definition_snapshot)
values ('b4000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',auth.uid(),'Reporting analyst','Maintain reporting','open','b3000000-0000-0000-0000-000000000001',2,'{"forged":true}');
do $$ begin
  if exists(select 1 from public.jobs where id = 'b4000000-0000-0000-0000-000000000001' and (status <> 'pending_review' or role_brief_revision <> 2 or role_definition_snapshot ? 'forged')) then raise exception 'definition bridge bypassed review or trusted snapshot'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
set local role authenticated;
update public.jobs set status = 'open' where id = 'b4000000-0000-0000-0000-000000000001';
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$ begin
  if not exists(select 1 from public.jobs where id = 'b4000000-0000-0000-0000-000000000001' and role_definition_snapshot->'essential'->0->>'evidence' = 'Redacted query or project discussion') then raise exception 'candidate cannot read reviewed definition'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '', true);
delete from auth.users where id = '30000000-0000-0000-0000-000000000001';
do $$ begin
  if not exists(select 1 from public.employer_role_briefs where id = 'b3000000-0000-0000-0000-000000000001' and reviewed_by is null) then raise exception 'reviewer lifecycle blocked'; end if;
end $$;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
set local role authenticated;
update public.employer_role_briefs set summary = 'Revised reporting scope' where id = 'b3000000-0000-0000-0000-000000000001';
do $$ begin
  if exists(select 1 from public.jobs where id = 'b4000000-0000-0000-0000-000000000001' and status = 'open') then raise exception 'definition correction left job published'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '', true);
insert into auth.users(id,email,raw_user_meta_data) values ('b5000000-0000-0000-0000-000000000001','company-signup@example.test','{"account_type":"company","role":"founder"}');
do $$ begin
  if not exists(select 1 from public.profiles where id = 'b5000000-0000-0000-0000-000000000001' and role = 'company') then raise exception 'company signup regressed or accepted privileged metadata'; end if;
  if has_function_privilege('authenticated','public.current_user_role()','execute') or has_function_privilege('anon','public.handle_new_user()','execute') then raise exception 'public definer privileges regressed'; end if;
end $$;
rollback;
