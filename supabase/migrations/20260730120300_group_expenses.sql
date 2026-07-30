-- Gastos compartidos del grupo. "source" define de donde sale la plata:
--   - fondo_comun: descuenta del saldo del fondo comun (ver
--     computeGroupFundBalance), no genera deuda entre miembros.
--   - personal: paid_by_user_id lo pago de su bolsillo; group_expense_shares
--     (siguiente migracion) define como se reparte entre los participantes
--     elegidos al cargarlo, y de ahi se calculan las deudas entre miembros
--     (ver computeGroupDebts). Ademas resta del disponible personal de
--     paid_by_user_id en su propio dashboard (ver computeDashboardTotals).
-- Se crea siempre via create_group_expense() (RPC, ver
-- 20260730120500_group_expense_rpc_functions.sql), que inserta el gasto y
-- sus shares en una sola transaccion.
create table public.group_expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  paid_by_user_id uuid not null references public.profiles (id),
  description text not null,
  amount numeric not null check (amount > 0),
  month date not null,
  source text not null check (source in ('fondo_comun', 'personal')),
  created_at timestamptz not null default now()
);

create index group_expenses_group_month_idx on public.group_expenses (group_id, month);
create index group_expenses_paid_by_month_idx on public.group_expenses (paid_by_user_id, month);

alter table public.group_expenses enable row level security;
