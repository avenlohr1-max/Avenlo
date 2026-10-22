-- Run after synthetic RLS fixtures. Direct provider grants must not survive.
begin;
do $assert$
begin
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef
      and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE')))
  then raise exception 'Public SECURITY DEFINER browser access remains'; end if;
  if not has_function_privilege('authenticated','private.candidate_can_read_company(uuid)','EXECUTE')
     or has_function_privilege('anon','private.candidate_can_read_company(uuid)','EXECUTE')
  then raise exception 'Private RLS helper permissions incorrect'; end if;
  if not has_function_privilege('service_role','public.settle_candidate_service_order(uuid,text,text)','EXECUTE')
  then raise exception 'Trusted settlement denied'; end if;
end $assert$;
create function public.avenlo_default_privilege_regression() returns integer
language sql security definer set search_path='' as $$ select 1 $$;
do $assert$
begin
  if has_function_privilege('anon','public.avenlo_default_privilege_regression()','EXECUTE')
    or has_function_privilege('authenticated','public.avenlo_default_privilege_regression()','EXECUTE')
  then raise exception 'New function inherits browser execution'; end if;
end $assert$;
rollback;

begin;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $assert$
begin
  begin
    perform public.activate_candidate_service_order(gen_random_uuid(),'forged','forged');
    raise exception 'Candidate invoked payment activation';
  exception when insufficient_privilege then null; end;
  begin
    perform public.write_audit_log(auth.uid(),'forged','profile',auth.uid(),'{}'::jsonb);
    raise exception 'Candidate forged an audit entry';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.candidate_service_orders(candidate_id,market,price,currency,status,payment_status)
    values(auth.uid(),'india',0,'INR','payment_pending','pending');
    raise exception 'Candidate manufactured a service order';
  exception when insufficient_privilege then null; end;
end $assert$;
rollback;
