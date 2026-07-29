-- Un registro por mes por gasto fijo: cambiar el monto de un mes no pisa el
-- historico de meses anteriores, cada mes queda como su propia fila
-- (se actualiza via upsert sobre la clave unica fixed_expense_id + month).
create table public.fixed_expense_entries (
  id uuid primary key default gen_random_uuid(),
  fixed_expense_id uuid not null references public.fixed_expenses (id) on delete cascade,
  month date not null,
  amount numeric not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (fixed_expense_id, month)
);

alter table public.fixed_expense_entries enable row level security;
