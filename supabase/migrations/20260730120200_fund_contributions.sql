-- Aportes de los miembros al fondo comun del grupo. No hay una tabla
-- "group_fund" aparte (como sugiere el borrador del plan): el fondo es 1:1
-- con el grupo y no tiene ningun dato propio mas que su saldo, asi que
-- group_id vive directo aca y se evita una tabla intermedia sin uso. El
-- saldo del fondo (ver computeGroupFundBalance) es puramente informativo:
-- aportes - gastos con source='fondo_comun', puede quedar negativo, no hay
-- mecanismo de retiro.
create table public.fund_contributions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  date date not null,
  amount numeric not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

create index fund_contributions_group_idx on public.fund_contributions (group_id);

alter table public.fund_contributions enable row level security;
