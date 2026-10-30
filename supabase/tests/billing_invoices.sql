-- Synthetic invoices only. Entire suite rolls back; no provider or money involved.
begin;
create function pg_temp.expect_blocked(statement text) returns void language plpgsql as $$
begin
  begin execute statement; exception when others then return; end;
  raise exception 'Expected blocked operation: %',statement;
end $$;
grant execute on function pg_temp.expect_blocked(text) to anon,authenticated,service_role;
insert into public.candidate_service_orders(id,candidate_id,plan_id,market,price,currency,payment_provider,provider_order_id,checkout_snapshot)
select 'ab000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',id,'india',1999,'INR','razorpay','order_synthetic_invoice',
'{"issuer":{"name":"Synthetic Avenlo","address":"123 Synthetic Street","email":"billing@example.test","gstRegistered":false},"billing":{"name":"Synthetic Candidate","address":"123 Example Street","city":"Hyderabad","state":"Telangana","postalCode":"500008","country":"India","email":"candidate@example.test"},"plan":"Synthetic Intelligence","items":["Synthetic profile review"],"termMonths":6,"amountPaise":199900,"currency":"INR","accepted":true,"policyVersion":"synthetic-test","acceptedAt":"2026-10-29T00:00:00Z","documents":[{},{},{},{}]}'::jsonb
from public.candidate_plans where market='india' and code='intelligence';
-- No snapshot: must not mark paid or consume an invoice number.
insert into public.candidate_service_orders(id,candidate_id,plan_id,market,price,currency,payment_provider,provider_order_id)
select 'ab000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',id,'india',1999,'INR','razorpay','order_synthetic_invalid'
from public.candidate_plans where market='india' and code='intelligence';
set local role service_role;
select pg_temp.expect_blocked($q$select public.settle_candidate_service_order('ab000000-0000-0000-0000-000000000002','razorpay','pay_invalid')$q$);
select public.settle_candidate_service_order('ab000000-0000-0000-0000-000000000001','razorpay','pay_synthetic_invoice');
-- Browser callback and webhook may both confirm; same capture creates exactly one invoice.
select public.settle_candidate_service_order('ab000000-0000-0000-0000-000000000001','razorpay','pay_synthetic_invoice');
select pg_temp.expect_blocked($q$select public.settle_candidate_service_order('ab000000-0000-0000-0000-000000000001','razorpay','pay_other_capture')$q$);
reset role;
do $$ begin
  if (select count(*) from public.avenlo_invoices where service_order_id='ab000000-0000-0000-0000-000000000001')<>1 then raise exception 'Replay created duplicate invoices'; end if;
  if (select payment_status from public.candidate_service_orders where id='ab000000-0000-0000-0000-000000000002')<>'pending' then raise exception 'Invalid invoice snapshot settled'; end if;
  if (select amount_paise from public.avenlo_invoices where service_order_id='ab000000-0000-0000-0000-000000000001')<>199900 then raise exception 'Invoice amount mismatch'; end if;
end $$;
select pg_temp.expect_blocked($q$update public.avenlo_invoices set amount_paise=1$q$);
select pg_temp.expect_blocked($q$delete from public.avenlo_invoices$q$);
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.avenlo_invoices)<>1 then raise exception 'Purchaser cannot read own invoice'; end if;
end $$;
select pg_temp.expect_blocked($q$select public.settle_candidate_service_order('ab000000-0000-0000-0000-000000000002','razorpay','pay_forged')$q$);
select pg_temp.expect_blocked($q$update public.avenlo_invoices set amount_paise=1$q$);
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.avenlo_invoices) then raise exception 'Another candidate read private invoice'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.avenlo_invoices) then raise exception 'Delivery staff read private invoice'; end if;
end $$;
select pg_temp.expect_blocked($q$update public.candidate_service_orders set payment_status='successful' where id='ab000000-0000-0000-0000-000000000002'$q$);
select pg_temp.expect_blocked($q$update public.candidate_service_orders set status='active' where id='ab000000-0000-0000-0000-000000000002'$q$);
reset role;
select set_config('request.jwt.claim.sub','40000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.avenlo_invoices)<>1 then raise exception 'Founder cannot review invoice'; end if;
end $$;
reset role;
update public.profiles set status='suspended' where id='10000000-0000-0000-0000-000000000001';
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.avenlo_invoices) then raise exception 'Suspended account read invoice'; end if;
end $$;
reset role;
set local role anon;
select pg_temp.expect_blocked($q$select * from public.avenlo_invoices$q$);
reset role;
rollback;
