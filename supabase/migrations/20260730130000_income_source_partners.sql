-- Socios de un emprendimiento de grupo (owner_type='group' en
-- income_sources). Define como se reparte la recuperacion de inversion y la
-- ganancia entre socios (ver computePartnerShares en
-- features/investments/aggregate.ts): participacion_pct es lo que manda
-- para el reparto (debe sumar 100% entre todos los socios de un mismo
-- emprendimiento); aporte_inicial es solo informativo, no define el reparto
-- ni se recalcula del ledger de investments. Se fija una unica vez al crear
-- el emprendimiento via create_group_income_source() (RPC) — no hay edicion
-- posterior de socios/porcentajes en esta fase.
create table public.income_source_partners (
  id uuid primary key default gen_random_uuid(),
  income_source_id uuid not null references public.income_sources (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  aporte_inicial numeric not null default 0 check (aporte_inicial >= 0),
  participacion_pct numeric not null check (participacion_pct > 0 and participacion_pct <= 100),
  unique (income_source_id, user_id)
);

create index income_source_partners_source_idx on public.income_source_partners (income_source_id);

alter table public.income_source_partners enable row level security;
