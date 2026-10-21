-- Secure candidate-owned activation for Razorpay callback confirmation.
create or replace function public.activate_candidate_service_order(
  p_order_id uuid,
  p_provider text,
  p_provider_payment_id text default null
)
returns public.candidate_service_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.candidate_service_orders;
  v_role text;
begin
  v_role := public.current_user_role();

  select * into v_order
  from public.candidate_service_orders
  where id = p_order_id
    and (candidate_id = auth.uid() or v_role in ('staff','founder'))
  for update;

  if not found then
    raise exception 'service order not found or not authorized';
  end if;

  if v_order.price <= 0 then
    update public.candidate_service_orders
      set status='active',
          payment_status='successful',
          payment_provider=p_provider,
          provider_payment_id=p_provider_payment_id,
          purchased_at=coalesce(purchased_at,now()),
          activated_at=coalesce(activated_at,now()),
          expires_at=coalesce(expires_at,now()+interval '6 months'),
          updated_at=now()
    where id=p_order_id
    returning * into v_order;
  else
    update public.candidate_service_orders
      set status='payment_successful',
          payment_status='successful',
          payment_provider=p_provider,
          provider_payment_id=p_provider_payment_id,
          purchased_at=coalesce(purchased_at,now()),
          updated_at=now()
    where id=p_order_id
    returning * into v_order;
  end if;

  return v_order;
end;
$$;

revoke all on function public.activate_candidate_service_order(uuid,text,text) from public,anon;
grant execute on function public.activate_candidate_service_order(uuid,text,text) to authenticated;
