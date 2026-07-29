-- Perfil extendido sobre auth.users. Un registro por usuario, mismo id que auth.users.id.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
