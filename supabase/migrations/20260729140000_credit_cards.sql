create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  closing_day int not null check (closing_day between 1 and 31),
  due_day int not null check (due_day between 1 and 31),
  created_at timestamptz not null default now()
);

create index credit_cards_user_idx on public.credit_cards (user_id);

alter table public.credit_cards enable row level security;
