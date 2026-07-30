-- Cartera de inversiones financieras (distinta de investments de Fase 3,
-- que es capital aportado a un emprendimiento). current_value es un campo
-- unico que se pisa cada vez que el usuario lo actualiza a mano (sin
-- historial de valuaciones): representa el valor TOTAL actual de la
-- posicion, no un precio unitario -- ganancia = current_value - (quantity *
-- purchase_price). Todo en ARS, igual que el resto de la app: si el
-- instrumento cotiza en otra moneda, el usuario carga el equivalente ya
-- convertido. updated_at deja ver que tan reciente es el valor cargado;
-- pensado para que mas adelante current_value se pueda derivar de una API
-- de cotizaciones sin cambiar el resto del modelo.
create table public.investment_portfolio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  instrument_type text not null check (instrument_type in ('accion', 'cedear', 'plazo_fijo', 'fondo', 'cripto', 'otro')),
  name text not null,
  quantity numeric not null check (quantity > 0),
  purchase_price numeric not null check (purchase_price >= 0),
  purchase_date date not null,
  current_value numeric not null default 0 check (current_value >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index investment_portfolio_user_idx on public.investment_portfolio (user_id);

alter table public.investment_portfolio enable row level security;

create policy "investment_portfolio_owner_all"
on public.investment_portfolio for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
