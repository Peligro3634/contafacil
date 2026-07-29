-- Fuentes de ingreso del usuario (sueldo fijo, monotributo, responsable
-- inscripto). owner_type/owner_id ya dejan lugar para que en Fase 3 un
-- emprendimiento pueda pertenecer a un grupo (owner_type = 'group'), pero
-- por ahora solo se usa 'user' — ver policy en la migracion de RLS.
create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('user', 'group')),
  owner_id uuid not null,
  type text not null check (type in ('empleado_fijo', 'monotributo', 'responsable_inscripto')),
  name text not null,
  product_mode text not null default 'simple' check (product_mode in ('simple', 'detallado')),
  created_at timestamptz not null default now()
);

create index income_sources_owner_idx on public.income_sources (owner_type, owner_id);

alter table public.income_sources enable row level security;
