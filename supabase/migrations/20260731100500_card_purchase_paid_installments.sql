-- Permite cargar una compra en cuotas que ya se venia pagando (alta de una
-- deuda de tarjeta preexistente, para que un usuario nuevo no arranque en
-- cero): p_paid_installments_count indica cuantas cuotas de la compra ORIGINAL
-- ya se abonaron antes de usar la app, y solo se generan filas de
-- card_purchase_installments para las cuotas restantes (installment_number >
-- p_paid_installments_count). La matematica de fechas es la misma que ya
-- existia (se deriva de p_date + closing_day de la tarjeta): no hace falta
-- ningun dato adicional, sigue siendo correcta sin importar cuantas cuotas ya
-- pasaron. Compatible con las llamadas existentes: el parametro nuevo tiene
-- default 0 (compra nueva, ninguna cuota pagada todavia).
-- Agregar un parametro cambia la lista de tipos de argumentos, asi que
-- "create or replace" crearia una funcion DISTINTA en paralelo a la vieja en
-- vez de reemplazarla, y con el nuevo parametro con default quedarian ambas
-- firmas invocables con los mismos 5 args (llamada ambigua) -- por eso se
-- dropea la version vieja explicitamente primero.
drop function if exists public.create_card_purchase(uuid, date, numeric, text, int);

create function public.create_card_purchase(
  p_credit_card_id uuid,
  p_date date,
  p_amount_total numeric,
  p_description text,
  p_installments_count int,
  p_paid_installments_count int default 0
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

  if p_paid_installments_count < 0 or p_paid_installments_count > p_installments_count then
    raise exception 'la cantidad de cuotas ya pagadas es invalida';
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
    if v_i > p_paid_installments_count then
      insert into public.card_purchase_installments (card_purchase_id, credit_card_id, installment_number, month, amount)
      values (
        v_purchase.id,
        p_credit_card_id,
        v_i,
        (v_period + make_interval(months => v_i - 1))::date,
        case when v_i = p_installments_count then v_remaining else v_installment_amount end
      );
    end if;
    v_remaining := v_remaining - v_installment_amount;
  end loop;

  return v_purchase;
end;
$$;

revoke all on function public.create_card_purchase(uuid, date, numeric, text, int, int) from public;
grant execute on function public.create_card_purchase(uuid, date, numeric, text, int, int) to authenticated;
