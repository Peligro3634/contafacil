-- Carga de ingresos (mensual o diaria) por fuente. En modo "simple" esto es
-- todo lo que se carga: monto base + extra (bonos/ventas) + unidades
-- opcional. El modo "detallado" (Fase 3.1) sumara sale_items sin tocar esta
-- tabla ni su forma de carga.
create table public.income_entries (
  id uuid primary key default gen_random_uuid(),
  income_source_id uuid not null references public.income_sources (id) on delete cascade,
  date date not null,
  base_amount numeric not null default 0 check (base_amount >= 0),
  extra_amount numeric not null default 0 check (extra_amount >= 0),
  units_sold numeric check (units_sold >= 0),
  note text,
  created_at timestamptz not null default now()
);

create index income_entries_source_date_idx on public.income_entries (income_source_id, date);

alter table public.income_entries enable row level security;
