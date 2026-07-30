-- Una compra con tarjeta, en pago unico (installments_count = 1) o en N
-- cuotas. Se crea siempre via la funcion create_card_purchase (ver
-- 20260729140300), que ademas genera las filas de
-- card_purchase_installments en la misma transaccion.
create table public.card_purchases (
  id uuid primary key default gen_random_uuid(),
  credit_card_id uuid not null references public.credit_cards (id) on delete cascade,
  date date not null,
  amount_total numeric not null check (amount_total > 0),
  description text not null,
  installments_count int not null default 1 check (installments_count >= 1),
  created_at timestamptz not null default now()
);

create index card_purchases_card_date_idx on public.card_purchases (credit_card_id, date);

alter table public.card_purchases enable row level security;
