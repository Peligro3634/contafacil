-- Metas compartidas de un grupo: mismo patron que savings_goals (Fase 4)
-- pero a nivel de grupo. El reparto de la cuota mensual sugerida entre
-- miembros se calcula en vivo en partes iguales (ver computeGroupGoalStatus
-- en features/groups/aggregate.ts) — no se guarda ningun reparto en la
-- base, asi que si cambia la cantidad de miembros del grupo el reparto se
-- recalcula solo (sin tener que migrar datos historicos).
create table public.group_goals (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  name text not null,
  target_amount numeric not null check (target_amount > 0),
  target_date date not null,
  created_at timestamptz not null default now()
);

create index group_goals_group_idx on public.group_goals (group_id);

alter table public.group_goals enable row level security;
