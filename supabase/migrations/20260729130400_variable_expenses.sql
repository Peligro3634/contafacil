-- Gastos variables: alta rapida por categoria + monto + mes, sin pasar por
-- una entidad fija (a diferencia de fixed_expenses/fixed_expense_entries).
create table public.variable_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  month date not null,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create index variable_expenses_user_month_idx on public.variable_expenses (user_id, month);

alter table public.variable_expenses enable row level security;
