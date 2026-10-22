create or replace function public.settle_candidate_service_order(
  p_order_id uuid,
  p_provider text,
  p_provider_payment_id text
)
returns public.candidate_service_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.candidate_service_orders;
begin
  select * into v_order
  from public.candidate_service_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'service order not found';
  end if;

  update public.candidate_service_orders
    set status = case when price <= 0 then 'active' else 'payment_successful' end,
        payment_status = 'successful',
        payment_provider = p_provider,
        provider_payment_id = p_provider_payment_id,
        purchased_at = coalesce(purchased_at, now()),
        activated_at = case when price <= 0 then coalesce(activated_at, now()) else activated_at end,
        expires_at = case when price <= 0 then coalesce(expires_at, now() + interval '6 months') else expires_at end,
        next_action = case when price <= 0 then 'Begin service delivery' else 'Avenlo activation and delivery review' end,
        updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.settle_candidate_service_order(uuid,text,text) from public,anon,authenticated;
grant execute on function public.settle_candidate_service_order(uuid,text,text) to service_role;
