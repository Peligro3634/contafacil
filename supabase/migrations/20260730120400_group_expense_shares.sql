-- Como se reparte un group_expense con source='personal' entre los
-- participantes elegidos al cargarlo (no necesariamente todos los miembros
-- del grupo). Cada fila es lo que ESE participante debe del gasto; el
-- pagador (paid_by_user_id en group_expenses) puede tener su propia fila
-- (su parte del consumo) sin que eso genere una deuda consigo mismo. Solo
-- tiene sentido para source='personal' — un gasto de fondo_comun no lleva
-- shares. Se inserta unicamente desde create_group_expense() (RPC), que
-- valida que la suma de shares coincida con el monto total del gasto.
create table public.group_expense_shares (
  id uuid primary key default gen_random_uuid(),
  group_expense_id uuid not null references public.group_expenses (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  amount numeric not null check (amount > 0),
  unique (group_expense_id, user_id)
);

create index group_expense_shares_expense_idx on public.group_expense_shares (group_expense_id);

alter table public.group_expense_shares enable row level security;
