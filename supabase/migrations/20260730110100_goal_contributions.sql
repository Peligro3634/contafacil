-- Ledger de aportes hacia una meta (mismo patron que investments de Fase 3):
-- "ahorrado" es simplemente la suma de esta tabla, sin recalcular nada mas.
-- A diferencia de business_expenses, un aporte a una meta NO es un gasto: es
-- la misma plata del usuario reordenada hacia un objetivo, asi que no resta
-- del "disponible" del dashboard personal (eso solo pasa con gastos reales).
create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  savings_goal_id uuid not null references public.savings_goals (id) on delete cascade,
  date date not null,
  amount numeric not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

create index goal_contributions_goal_idx on public.goal_contributions (savings_goal_id);

alter table public.goal_contributions enable row level security;
