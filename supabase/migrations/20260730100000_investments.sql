-- Ledger de aportes de capital a un emprendimiento (income_source de tipo
-- monotributo/responsable_inscripto). El capital invertido total de un
-- emprendimiento es la suma de todos sus aportes, no un unico monto fijo:
-- esto permite reinversion posterior (ej: comprar mas stock a mitad de año)
-- sin forzar todo a un solo evento inicial.
create table public.investments (
  id uuid primary key default gen_random_uuid(),
  income_source_id uuid not null references public.income_sources (id) on delete cascade,
  date date not null,
  amount numeric not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

create index investments_source_idx on public.investments (income_source_id);

alter table public.investments enable row level security;
