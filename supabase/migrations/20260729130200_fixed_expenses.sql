create table public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index fixed_expenses_user_idx on public.fixed_expenses (user_id);

alter table public.fixed_expenses enable row level security;
