-- Punto de partida del "fondo general" (saldo real acumulado): el usuario
-- carga cuanto tenia en una fecha, y a partir de ahi el fondo general se
-- calcula sumando el disponible de cada mes desde esa fecha (ver
-- src/lib/cashBalance.ts). Un solo registro por usuario (user_id es PK), se
-- actualiza con upsert si el usuario corrige su saldo inicial mas adelante.
create table public.cash_balance_baseline (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  initial_amount numeric not null default 0,
  initial_date date not null,
  updated_at timestamptz not null default now()
);

alter table public.cash_balance_baseline enable row level security;

create policy "cash_balance_baseline_owner_all"
on public.cash_balance_baseline for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
