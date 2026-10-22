-- Bound each private resume to 400 KiB for the owner-selected Free rollout.
-- This changes bucket configuration only; no existing object or record is deleted.
update storage.buckets
set file_size_limit = 409600, public = false
where id = 'candidate-documents';

-- Public Auth signup must never create an employer from user-editable metadata.
-- Verified founders promote invited accounts through the trusted onboarding action.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,email,full_name,role)
  values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''),'candidate'::public.user_role)
  on conflict(id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Owner-approved retention. Dry-run is the default; only the trusted service
-- role can invoke this RPC. Financial/account/source records are never purged.
create or replace function public.run_approved_retention(p_execute boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  cutoff timestamptz := now();
  rooms integer; cases integer; drafts integer; events integer; sharing integer;
  result jsonb;
begin
  if not pg_try_advisory_xact_lock(175014, 9020180) then
    return jsonb_build_object('skipped','another retention run is active');
  end if;
  if not p_execute then
    return jsonb_build_object('dry_run',true,
      'rooms',(select count(*) from public.decision_rooms where expires_at < cutoff - interval '90 days'),
      'cases',(select count(*) from public.intelligence_cases where expires_at < cutoff - interval '90 days'),
      'drafts',(select count(*) from public.proof_packages p where not shared and captured_at < cutoff - interval '90 days' and not exists (select 1 from public.collaboration_events e where e.candidate_id=p.candidate_id and e.resource_id=p.id and e.resource_type='proof_packages' and e.state->>'shared'='true')),
      'collaboration_events',(select count(*) from public.collaboration_events where occurred_at < cutoff - interval '180 days'),
      'sharing_events',(select count(*) from public.candidate_sharing_events where changed_at < cutoff - interval '180 days'));
  end if;
  delete from public.decision_rooms where id in (
    select id from public.decision_rooms where expires_at < cutoff - interval '90 days' order by expires_at limit 500);
  get diagnostics rooms = row_count;
  delete from public.intelligence_cases where id in (
    select id from public.intelligence_cases where expires_at < cutoff - interval '90 days' order by expires_at limit 500);
  get diagnostics cases = row_count;
  delete from public.proof_packages where id in (
    select id from public.proof_packages p where not shared and captured_at < cutoff - interval '90 days' and not exists (select 1 from public.collaboration_events e where e.candidate_id=p.candidate_id and e.resource_id=p.id and e.resource_type='proof_packages' and e.state->>'shared'='true') order by captured_at limit 500);
  get diagnostics drafts = row_count;
  delete from public.collaboration_events where id in (
    select id from public.collaboration_events where occurred_at < cutoff - interval '180 days' order by occurred_at limit 2000);
  get diagnostics events = row_count;
  delete from public.candidate_sharing_events where id in (
    select id from public.candidate_sharing_events where changed_at < cutoff - interval '180 days' order by changed_at limit 2000);
  get diagnostics sharing = row_count;
  result := jsonb_build_object('dry_run',false,'rooms',rooms,'cases',cases,'drafts',drafts,'collaboration_events',events,'sharing_events',sharing);
  insert into public.audit_logs(actor_id,action,entity_type,metadata)
  values(null,'retention.completed','retention',result);
  return result;
end;
$$;
revoke all on function public.run_approved_retention(boolean) from public, anon, authenticated;
grant execute on function public.run_approved_retention(boolean) to service_role;
