-- Ledger de aportes hacia una meta de grupo (mismo patron que
-- goal_contributions de Fase 4): "ahorrado" = suma de esta tabla. Se guarda
-- user_id para poder mostrar quien aporto que en la vista de grupo, aunque
-- el progreso de la meta es del grupo entero, no por persona (no hay
-- reparto de "cuanto le toca a cada uno de lo ya ahorrado", solo del
-- pendiente hacia adelante).
create table public.group_goal_contributions (
  id uuid primary key default gen_random_uuid(),
  group_goal_id uuid not null references public.group_goals (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  date date not null,
  amount numeric not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

create index group_goal_contributions_goal_idx on public.group_goal_contributions (group_goal_id);

alter table public.group_goal_contributions enable row level security;
