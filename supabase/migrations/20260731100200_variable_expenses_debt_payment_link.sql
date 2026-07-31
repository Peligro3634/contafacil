-- Vincula un gasto variable con el pago de deuda que lo genero (ver
-- create_debt_payment). on delete cascade: borrar un debt_payment borra
-- automaticamente el gasto variable asociado, sin necesitar un RPC de
-- borrado aparte para eso.
alter table public.variable_expenses
  add column debt_payment_id uuid references public.debt_payments (id) on delete cascade;

create index variable_expenses_debt_payment_idx on public.variable_expenses (debt_payment_id);
