-- Pagos (totales o parciales) contra una deuda. Se escriben solo via la
-- funcion create_debt_payment (security definer, ver
-- 20260731100400_debt_payment_rpc_functions.sql), que en la misma
-- transaccion genera el gasto variable correspondiente (ver columna
-- debt_payment_id agregada a variable_expenses en la migracion siguiente) —
-- asi el pago impacta el disponible del mes igual que cualquier otro gasto,
-- sin duplicar logica de agregacion en el dashboard.
-- "source" es una etiqueta descriptiva de donde salio el dinero (no hay
-- modulo de cuentas/billeteras con saldo en la app).
create table public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts (id) on delete cascade,
  date date not null,
  amount numeric not null check (amount > 0),
  source text not null check (source in ('efectivo', 'cuenta_bancaria', 'ahorros', 'otro')),
  note text,
  created_at timestamptz not null default now()
);

create index debt_payments_debt_idx on public.debt_payments (debt_id);

alter table public.debt_payments enable row level security;
