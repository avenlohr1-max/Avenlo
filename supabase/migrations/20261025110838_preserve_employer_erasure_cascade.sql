-- A profile deletion can queue both SET NULL attribution and company/brief
-- cascading deletes. Do not recreate revision history after its parent is gone.
create or replace function private.record_role_brief_revision()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and not exists (
    select 1 from public.employer_role_briefs b where b.id = new.id
  ) then return new; end if;
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
