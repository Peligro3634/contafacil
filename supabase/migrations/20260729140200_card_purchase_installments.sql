-- Cuotas materializadas por compra, generadas atomicamente al insertar la
-- compra (create_card_purchase). Guardar esto ya calculado evita recalcular
-- fechas de cuotas en cada lectura: el resumen mensual de una tarjeta es
-- simplemente "sum(amount) where credit_card_id = X and month = Y".
--
-- Regla de derivacion compra -> mes de resumen ("month"):
--   - Si el dia de la compra es posterior al closing_day de la tarjeta,
--     la primera cuota cae en el resumen del mes SIGUIENTE al de la compra.
--   - Si no, cae en el resumen del mismo mes de la compra.
--   - Cada cuota subsiguiente (installment_number 2..N) cae en el mes de
--     resumen inmediatamente consecutivo al de la cuota anterior.
--   - El monto de cada cuota es amount_total / installments_count, con el
--     redondeo residual absorbido por la ultima cuota para que la suma de
--     todas las cuotas sea exactamente amount_total.
--
-- "month" es el mes de CIERRE/resumen, no el de vencimiento: el mes de
-- vencimiento (due_month) se deriva en la app como month + 1 (convencion
-- estandar de tarjetas: el resumen que cierra en el mes M vence en M+1),
-- sin necesidad de guardarlo aparte.
create table public.card_purchase_installments (
  id uuid primary key default gen_random_uuid(),
  card_purchase_id uuid not null references public.card_purchases (id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards (id) on delete cascade,
  installment_number int not null check (installment_number >= 1),
  month date not null,
  amount numeric not null check (amount >= 0),
  unique (card_purchase_id, installment_number)
);

create index card_purchase_installments_card_month_idx on public.card_purchase_installments (credit_card_id, month);

alter table public.card_purchase_installments enable row level security;
