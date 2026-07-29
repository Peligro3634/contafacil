create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('familia', 'viaje', 'otro')),
  invite_code text not null unique,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;
