begin;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.profiles where id = auth.uid()) <> 1 then raise exception 'restored candidate cannot read own profile'; end if;
  if exists(select 1 from public.candidate_signals where candidate_id <> auth.uid()) then raise exception 'restore lost ledger isolation'; end if;
  if exists(select 1 from storage.objects where name = '10000000-0000-0000-0000-000000000002/resume.pdf') then raise exception 'restore lost Storage privacy'; end if;
  if has_table_privilege('authenticated','public.collaboration_events','INSERT') then raise exception 'restore lost audit write restriction'; end if;
  if has_function_privilege('anon','private.audit_collaboration()','EXECUTE') or has_function_privilege('authenticated','public.current_user_role()','EXECUTE') then raise exception 'restore lost function privilege hardening'; end if;
end $$;
rollback;
