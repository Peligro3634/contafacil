create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  target_amount numeric not null check (target_amount > 0),
  target_date date not null,
  created_at timestamptz not null default now()
);

create index savings_goals_user_idx on public.savings_goals (user_id);

alter table public.savings_goals enable row level security;
