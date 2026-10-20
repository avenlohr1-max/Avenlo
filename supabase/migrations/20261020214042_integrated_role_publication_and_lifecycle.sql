-- Trusted backend writes also compile trigger expressions that reference this
-- non-API helper. BYPASSRLS does not supply schema/function privileges.
grant usage on schema private to service_role;
grant execute on function private.current_user_role() to service_role;

alter table public.jobs add column role_brief_id uuid references public.employer_role_briefs(id) on delete set null;
alter table public.jobs add column role_brief_revision integer;
alter table public.jobs add column role_definition_snapshot jsonb;
create index jobs_role_brief_idx on public.jobs(role_brief_id);

create function private.link_reviewed_role_definition() returns trigger language plpgsql security invoker set search_path = '' as $$
declare brief public.employer_role_briefs;
begin
  if new.role_brief_id is not null then
    select * into brief from public.employer_role_briefs where id = new.role_brief_id and company_id = new.company_id and status = 'approved';
    if brief.id is null then raise exception 'an approved definition owned by this company is required'; end if;
    new.role_brief_revision := brief.revision;
    new.role_definition_snapshot := jsonb_build_object('title',brief.title,'summary',brief.summary,'outcomes',brief.outcomes,'essential',brief.essential,'preferred',brief.preferred,'location',brief.location,'work_mode',brief.work_mode);
  else
    new.role_brief_revision := null; new.role_definition_snapshot := null;
  end if;
  if tg_op = 'UPDATE' and (select private.current_user_role()) = 'company' and old.status = 'open' and
    (to_jsonb(new) - array['status','updated_at']) is distinct from (to_jsonb(old) - array['status','updated_at']) then
    new.status := 'pending_review';
  end if;
  return new;
end $$;
revoke all on function private.link_reviewed_role_definition() from public, anon, authenticated;
create trigger jobs_link_reviewed_definition before insert or update on public.jobs for each row execute function private.link_reviewed_role_definition();

-- A role-brief correction immediately removes linked jobs from public discovery.
-- Republishing requires an approved definition and the existing human job review.
create function private.pause_changed_role_jobs() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status <> 'approved' then
    update public.jobs set status = 'paused', role_brief_id = null
    where role_brief_id = old.id and status = 'open';
  end if;
  return new;
end $$;
revoke all on function private.pause_changed_role_jobs() from public, anon, authenticated;
create trigger pause_changed_role_jobs after update on public.employer_role_briefs for each row execute function private.pause_changed_role_jobs();

-- Audit export requests with server-assigned identity and time.
create function private.stamp_dossier_export() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.actor_id := auth.uid(); new.exported_at := now(); return new; end $$;
revoke all on function private.stamp_dossier_export() from public, anon, authenticated;
create trigger stamp_dossier_export before insert on public.dossier_exports for each row execute function private.stamp_dossier_export();
create or replace function private.guard_role_brief()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  caller_role text;
  item jsonb;
  group_name text;
  requires_review boolean;
  seen text[] := '{}';
  label text;
begin
  if tg_op = 'UPDATE' and pg_trigger_depth() > 1
    and (to_jsonb(new) - array['created_by','reviewed_by']) = (to_jsonb(old) - array['created_by','reviewed_by'])
    and (new.created_by is null or new.created_by = old.created_by)
    and (new.reviewed_by is null or new.reviewed_by = old.reviewed_by) then
    new.revision := old.revision + 1; new.updated_at := now(); return new;
  end if;
  select role::text into caller_role from public.profiles where id = (select auth.uid());
  if caller_role is null then raise exception 'authenticated role required'; end if;
  if tg_op = 'INSERT' then
    if caller_role <> 'company' or new.status not in ('draft','submitted') then raise exception 'employer draft or submission required'; end if;
    new.created_by := auth.uid(); new.revision := 1; new.created_at := now();
    new.reviewed_by := null; new.reviewed_at := null; new.review_note := null;
  else
    if new.id is distinct from old.id or new.company_id is distinct from old.company_id or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then raise exception 'role brief identity is immutable'; end if;
    new.revision := old.revision + 1;
    if caller_role = 'company' then
      if new.status = 'approved' and old.status = 'approved' then new.status := 'draft'; end if;
      if new.status not in ('draft','submitted') then raise exception 'employer cannot approve role brief'; end if;
      new.reviewed_by := null; new.reviewed_at := null; new.review_note := null;
    elsif caller_role in ('staff','founder') then
      if (to_jsonb(new) - array['status','revision','reviewed_by','reviewed_at','review_note','updated_at']) is distinct from (to_jsonb(old) - array['status','revision','reviewed_by','reviewed_at','review_note','updated_at']) then raise exception 'reviewers cannot rewrite employer criteria'; end if;
      if not ((old.status = 'submitted' and new.status in ('approved','changes_requested')) or (old.status = 'approved' and new.status = 'changes_requested')) then raise exception 'invalid review transition'; end if;
      if new.review_note is null or length(btrim(new.review_note)) = 0 then raise exception 'review note required'; end if;
      new.reviewed_by := auth.uid(); new.reviewed_at := now();
    else raise exception 'role cannot edit briefs';
    end if;
  end if;
  requires_review := new.status in ('submitted','approved');
  if jsonb_typeof(new.outcomes) is distinct from 'array' or jsonb_typeof(new.essential) is distinct from 'array' or jsonb_typeof(new.preferred) is distinct from 'array' then raise exception 'role criteria must be arrays'; end if;
  if jsonb_array_length(new.outcomes) > 12 or jsonb_array_length(new.essential) > 12 or jsonb_array_length(new.preferred) > 12 then raise exception 'too many role criteria'; end if;
  for item in select value from jsonb_array_elements(new.outcomes) loop
    if jsonb_typeof(item) <> 'string' or length(btrim(item #>> '{}')) not between 1 and 500 then raise exception 'invalid role outcome'; end if;
  end loop;
  foreach group_name in array array['essential','preferred'] loop
    for item in select value from jsonb_array_elements(case when group_name = 'essential' then new.essential else new.preferred end) loop
      if jsonb_typeof(item) <> 'object' or jsonb_typeof(item->'requirement') is distinct from 'string' or jsonb_typeof(item->'evidence') is distinct from 'string' or jsonb_typeof(item->'rationale') is distinct from 'string' or (item - array['requirement','evidence','rationale']) <> '{}'::jsonb then raise exception 'invalid criterion structure'; end if;
      if length(item->>'requirement') > 500 or length(item->>'evidence') > 1000 or length(item->>'rationale') > 1000 then raise exception 'criterion too long'; end if;
      label := regexp_replace(lower(btrim(item->>'requirement')), '[[:space:]]+', ' ', 'g');
      if label <> '' and label = any(seen) then raise exception 'duplicate requirement across role criteria'; end if;
      if label <> '' then seen := array_append(seen, label); end if;
      if requires_review and (label = '' or length(btrim(item->>'evidence')) = 0 or (group_name = 'essential' and length(btrim(item->>'rationale')) = 0)) then raise exception 'requirement, evidence and essential rationale required'; end if;
    end loop;
  end loop;
  if requires_review and (length(btrim(new.summary)) = 0 or jsonb_array_length(new.outcomes) = 0 or jsonb_array_length(new.essential) = 0) then raise exception 'complete role definition required for review'; end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.guard_role_brief() from public, anon, authenticated;

create or replace function private.record_role_brief_revision()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null and not (
    tg_op = 'UPDATE'
    and (to_jsonb(new) - array['created_by','reviewed_by','revision','updated_at']) = (to_jsonb(old) - array['created_by','reviewed_by','revision','updated_at'])
    and (new.created_by is null or new.created_by = old.created_by)
    and (new.reviewed_by is null or new.reviewed_by = old.reviewed_by)
    and ((old.created_by is not null and new.created_by is null and not exists(select 1 from public.profiles p where p.id = old.created_by))
      or (old.reviewed_by is not null and new.reviewed_by is null and not exists(select 1 from public.profiles p where p.id = old.reviewed_by)))
  ) then raise exception 'role history requires an authenticated actor or verified account removal'; end if;
  insert into public.employer_role_brief_history(brief_id, revision, actor_id, before_data, after_data)
  values (new.id, new.revision, case when exists (select 1 from public.profiles p where p.id = auth.uid()) then auth.uid() else null end, case when tg_op = 'UPDATE' then to_jsonb(old) else null end, to_jsonb(new));
  return new;
end;
$$;
revoke all on function private.record_role_brief_revision() from public, anon, authenticated;

