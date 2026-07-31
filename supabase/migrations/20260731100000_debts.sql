-- Deudas personales (prestamos, financiaciones fuera de tarjeta, etc.).
-- No se guarda paid_amount/pending_amount/status: se derivan siempre en el
-- cliente a partir de debt_payments (mismo criterio que investment_portfolio
-- / savings_goals), evita que la base y la UI queden desincronizadas.
-- installments_count es solo informativo (para mostrar una "cuota
-- sugerida" = original_amount / installments_count) — los pagos reales se
-- registran libremente en debt_payments, no atados a un cronograma fijo.
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  original_amount numeric not null check (original_amount > 0),
  installments_count int check (installments_count is null or installments_count > 0),
  start_date date not null,
  note text,
  created_at timestamptz not null default now()
);

create index debts_user_idx on public.debts (user_id);

alter table public.debts enable row level security;
