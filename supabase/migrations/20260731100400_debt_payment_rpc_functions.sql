-- Registra un pago (total o parcial) contra una deuda y, en la misma
-- transaccion, un gasto variable equivalente (categoria "Pago de deuda:
-- <nombre>") para que el disponible del mes lo refleje automaticamente sin
-- tocar computeDashboardTotals. Ver diseño en
-- 20260731100200_variable_expenses_debt_payment_link.sql para el borrado en
-- cascada del lado del gasto.
create function public.create_debt_payment(
  p_debt_id uuid,
  p_date date,
  p_amount numeric,
  p_source text,
  p_note text
)
returns public.debt_payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_debt public.debts;
  v_payment public.debt_payments;
begin
  if auth.uid() is null then
    raise exception 'no autenticado';
  end if;

  select * into v_debt
  from public.debts
  where id = p_debt_id and user_id = auth.uid();

  if not found then
    raise exception 'deuda invalida';
  end if;

  if p_amount <= 0 then
    raise exception 'el monto debe ser mayor a 0';
  end if;

  if p_source not in ('efectivo', 'cuenta_bancaria', 'ahorros', 'otro') then
    raise exception 'origen invalido';
  end if;

  insert into public.debt_payments (debt_id, date, amount, source, note)
  values (p_debt_id, p_date, p_amount, p_source, nullif(trim(coalesce(p_note, '')), ''))
  returning * into v_payment;

  insert into public.variable_expenses (user_id, category, month, amount, debt_payment_id)
  values (auth.uid(), 'Pago de deuda: ' || v_debt.name, date_trunc('month', p_date)::date, p_amount, v_payment.id);

  return v_payment;
end;
$$;

-- Borra un pago (verificando ownership via join a debts). El gasto variable
-- asociado se borra solo por el "on delete cascade" de
-- variable_expenses.debt_payment_id.
create function public.delete_debt_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'no autenticado';
  end if;

  delete from public.debt_payments
  where id = p_payment_id
    and debt_id in (select id from public.debts where user_id = auth.uid());
end;
$$;

revoke all on function public.create_debt_payment(uuid, date, numeric, text, text) from public;
revoke all on function public.delete_debt_payment(uuid) from public;
grant execute on function public.create_debt_payment(uuid, date, numeric, text, text) to authenticated;
grant execute on function public.delete_debt_payment(uuid) to authenticated;
