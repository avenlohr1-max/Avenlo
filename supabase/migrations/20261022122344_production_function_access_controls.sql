-- Provider defaults explicitly grant anon/authenticated EXECUTE in public.
-- Removing only PUBLIC does not remove those direct grants.
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;

-- Trigger execution does not require client EXECUTE. Keep the trigger bindings,
-- owners and bodies intact while closing direct RPC access.
do $permissions$
declare helper record;
begin
  for helper in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','private') and p.prorettype='pg_catalog.trigger'::regtype
  loop
    execute format('revoke all on function %s from public, anon, authenticated', helper.signature);
  end loop;
end $permissions$;

revoke all on function public.write_audit_log(uuid,text,text,uuid,jsonb) from public, anon, authenticated;
-- Candidates cannot forge payment success through a legacy activation RPC or
-- insert their own price/provider identifiers. Server checkout creates orders.
revoke all on function public.activate_candidate_service_order(uuid,text,text) from public, anon, authenticated;
revoke all on function public.settle_candidate_service_order(uuid,text,text) from public, anon, authenticated;
grant execute on function public.settle_candidate_service_order(uuid,text,text) to service_role;
drop policy if exists "candidates create own service orders" on public.candidate_service_orders;

-- RLS needs this lookup, but it is not a public API endpoint. Retain the old
-- function with no client grant for compatibility with trusted legacy callers.
create or replace function private.candidate_can_read_company(p_company_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select (select auth.uid()) is not null
    and (select private.current_user_role())='candidate'
    and exists(select 1 from public.jobs j where j.company_id=p_company_id and j.status='open');
$$;
revoke all on function private.candidate_can_read_company(uuid) from public, anon;
grant execute on function private.candidate_can_read_company(uuid) to authenticated, service_role;
revoke all on function public.candidate_can_read_company(uuid) from public, anon, authenticated;
drop policy if exists "candidates read open-job companies" on public.companies;
create policy "candidates read open-job companies" on public.companies for select to authenticated
using((select private.current_user_role())='candidate' and private.candidate_can_read_company(id));

-- Fail the transaction if a public SECURITY DEFINER endpoint remains callable
-- by a browser role, including grants inherited from provider defaults.
do $verify$
begin
  if exists(
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef
      and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE'))
  ) then raise exception 'Browser role can execute a public SECURITY DEFINER function'; end if;
end $verify$;
