-- Crea una compra y sus cuotas en una sola transaccion (evita que una compra
-- en N cuotas quede con cuotas faltantes si algo falla a mitad de camino).
-- La logica de a que mes de resumen cae cada cuota vive aca (ver comentario
-- de diseño en 20260729140200_card_purchase_installments.sql).
create function public.create_card_purchase(
  p_credit_card_id uuid,
  p_date date,
  p_amount_total numeric,
  p_description text,
  p_installments_count int
)
returns public.card_purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card public.credit_cards;
  v_purchase public.card_purchases;
  v_period date;
  v_installment_amount numeric;
  v_remaining numeric;
  v_i int;
begin
  if auth.uid() is null then
    raise exception 'no autenticado';
  end if;

  select * into v_card
  from public.credit_cards
  where id = p_credit_card_id and user_id = auth.uid();

  if not found then
    raise exception 'tarjeta invalida';
  end if;

  if p_installments_count < 1 then
    raise exception 'la cantidad de cuotas debe ser al menos 1';
  end if;

  if p_amount_total <= 0 then
    raise exception 'el monto debe ser mayor a 0';
  end if;

  if p_description is null or length(trim(p_description)) = 0 then
    raise exception 'la descripcion es obligatoria';
  end if;

  insert into public.card_purchases (credit_card_id, date, amount_total, description, installments_count)
  values (p_credit_card_id, p_date, p_amount_total, trim(p_description), p_installments_count)
  returning * into v_purchase;

  if extract(day from p_date) > v_card.closing_day then
    v_period := (date_trunc('month', p_date) + interval '1 month')::date;
  else
    v_period := date_trunc('month', p_date)::date;
  end if;

  v_installment_amount := trunc(p_amount_total / p_installments_count, 2);
  v_remaining := p_amount_total;

  for v_i in 1..p_installments_count loop
    insert into public.card_purchase_installments (card_purchase_id, credit_card_id, installment_number, month, amount)
    values (
      v_purchase.id,
      p_credit_card_id,
      v_i,
      (v_period + make_interval(months => v_i - 1))::date,
      case when v_i = p_installments_count then v_remaining else v_installment_amount end
    );
    v_remaining := v_remaining - v_installment_amount;
  end loop;

  return v_purchase;
end;
$$;

-- Borra una compra (y en cascada sus cuotas). Solo si la tarjeta es del
-- usuario autenticado.
create function public.delete_card_purchase(p_purchase_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'no autenticado';
  end if;

  delete from public.card_purchases
  where id = p_purchase_id
    and credit_card_id in (select id from public.credit_cards where user_id = auth.uid());
end;
$$;

revoke all on function public.create_card_purchase(uuid, date, numeric, text, int) from public;
revoke all on function public.delete_card_purchase(uuid) from public;
grant execute on function public.create_card_purchase(uuid, date, numeric, text, int) to authenticated;
grant execute on function public.delete_card_purchase(uuid) to authenticated;
