-- Disposable synthetic records only. No bank connection, receiving account or money.
begin;
set local role service_role;
select set_config('avenlo.qa.sandbox', (public.create_avenlo_upi_request('10000000-0000-0000-0000-000000000001','sandbox',null,'Synthetic sandbox')).id::text,true);
select set_config('avenlo.qa.realtest', (public.create_avenlo_upi_request('40000000-0000-0000-0000-000000000001','test','synthetic@qa','Synthetic Receiver')).id::text,true);
do $$ begin
  if (public.create_avenlo_upi_request('10000000-0000-0000-0000-000000000001','sandbox',null,'Synthetic sandbox')).id::text <> current_setting('avenlo.qa.sandbox') then raise exception 'pending checkout not reused'; end if;
  begin
    perform public.create_avenlo_upi_request('10000000-0000-0000-0000-000000000001','test','synthetic@qa','Synthetic Receiver');
    raise exception 'candidate received real personal test';
  exception when raise_exception then if sqlerrm='candidate received real personal test' then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.avenlo_upi_requests)<>1 then raise exception 'candidate read foreign requests'; end if;
  begin
    update public.avenlo_upi_requests set status='confirmed';
    raise exception 'candidate directly confirmed payment';
  exception when insufficient_privilege then null; end;
  begin
    perform public.create_avenlo_upi_request(auth.uid(),'test','attacker@qa','Forged receiver');
    raise exception 'candidate called trusted create function';
  exception when insufficient_privilege then null; end;
  begin
    perform public.report_avenlo_upi_payment(current_setting('avenlo.qa.realtest')::uuid,'CLAIM123456');
    raise exception 'candidate reported another owner payment';
  exception when raise_exception then if sqlerrm='candidate reported another owner payment' then raise; end if; end;
  perform public.report_avenlo_upi_payment(current_setting('avenlo.qa.sandbox')::uuid,'SIMULATED123');
  perform public.report_avenlo_upi_payment(current_setting('avenlo.qa.sandbox')::uuid,'SIMULATED123');
  if (select count(*) from public.avenlo_upi_events)<>2 then raise exception 'duplicate report added events'; end if;
  if exists(select 1 from public.avenlo_upi_requests where status='confirmed') then raise exception 'report auto confirmed payment'; end if;
  begin
    perform public.review_avenlo_upi_payment(current_setting('avenlo.qa.sandbox')::uuid,'confirmed',null,null,null,null,false,'Forged candidate review');
    raise exception 'candidate called founder reconciliation';
  exception when raise_exception then if sqlerrm='candidate called founder reconciliation' then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.avenlo_upi_requests) or exists(select 1 from public.avenlo_upi_events) then raise exception 'staff accessed payment ledger'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','40000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select public.review_avenlo_upi_payment(current_setting('avenlo.qa.sandbox')::uuid,'confirmed',null,null,null,null,false,'Synthetic simulation review only');
select public.report_avenlo_upi_payment(current_setting('avenlo.qa.realtest')::uuid,'PAYER123456');
do $$ begin
  begin
    perform public.review_avenlo_upi_payment(current_setting('avenlo.qa.realtest')::uuid,'confirmed','BANK123456',200,'synthetic@qa',now(),true,'Synthetic mismatched amount');
    raise exception 'wrong amount reconciled';
  exception when raise_exception then if sqlerrm='wrong amount reconciled' then raise; end if; end;
  begin
    perform public.review_avenlo_upi_payment(current_setting('avenlo.qa.realtest')::uuid,'confirmed','BANK123456',100,'different@qa',now(),true,'Synthetic wrong receiver');
    raise exception 'wrong receiver reconciled';
  exception when raise_exception then if sqlerrm='wrong receiver reconciled' then raise; end if; end;
  begin
    perform public.review_avenlo_upi_payment(current_setting('avenlo.qa.realtest')::uuid,'confirmed','BANK123456',100,'synthetic@qa',now(),false,'Synthetic unchecked receipt');
    raise exception 'unchecked bank receipt accepted';
  exception when raise_exception then if sqlerrm='unchecked bank receipt accepted' then raise; end if; end;
end $$;
select public.review_avenlo_upi_payment(current_setting('avenlo.qa.realtest')::uuid,'confirmed','BANK123456',100,'synthetic@qa',now(),true,'Synthetic official-bank reconciliation exercise');
select public.request_avenlo_upi_refund(current_setting('avenlo.qa.realtest')::uuid,'Synthetic refund workflow exercise');
select public.request_avenlo_upi_refund(current_setting('avenlo.qa.realtest')::uuid,'Synthetic repeated request');
reset role;
set local role service_role;
select set_config('avenlo.qa.second', (public.create_avenlo_upi_request('40000000-0000-0000-0000-000000000001','test','synthetic@qa','Synthetic Receiver')).id::text,true);
reset role;
set local role authenticated;
select public.report_avenlo_upi_payment(current_setting('avenlo.qa.second')::uuid,'SECOND123456');
do $$ begin
  begin
    perform public.review_avenlo_upi_payment(current_setting('avenlo.qa.second')::uuid,'confirmed','BANK123456',100,'synthetic@qa',now(),true,'Synthetic duplicate bank credit');
    raise exception 'one bank credit confirmed twice';
  exception when unique_violation then null; end;
end $$;
reset role;
do $$ begin
  if exists(select 1 from public.candidate_service_orders where payment_provider='avenlo_upi') then raise exception 'test activated service order'; end if;
  if (select count(*) from public.avenlo_upi_events where kind='refund_requested')<>1 then raise exception 'refund request not idempotent'; end if;
  if has_function_privilege('anon','public.report_avenlo_upi_payment(uuid,text)','execute') or has_table_privilege('anon','public.avenlo_upi_requests','select') then raise exception 'anonymous payment access'; end if;
  update public.profiles set status='archived' where id='40000000-0000-0000-0000-000000000001';
end $$;
set local role authenticated;
do $$ begin
  if exists(select 1 from public.avenlo_upi_requests) then raise exception 'archived founder reads payments'; end if;
  begin
    perform public.review_avenlo_upi_payment(current_setting('avenlo.qa.second')::uuid,'rejected',null,null,null,null,false,'Archived review must fail');
    raise exception 'archived founder reviewed payment';
  exception when raise_exception then if sqlerrm='archived founder reviewed payment' then raise; end if; end;
end $$;
rollback;
