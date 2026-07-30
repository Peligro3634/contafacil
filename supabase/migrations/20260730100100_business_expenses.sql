-- Costos de UN emprendimiento (reposicion de stock, insumos, envios,
-- comisiones), DISTINTOS de fixed_expenses/variable_expenses que son gastos
-- personales del usuario. Ambos salen del mismo bolsillo, pero se separan
-- para poder analizar el emprendimiento de forma aislada (ver investments +
-- computeEmprendimientoStatus) y a la vez sumarse como un gasto mas del
-- dashboard personal (ver businessExpenseBreakdown -> computeDashboardTotals).
--
-- "type" separa costo de mercaderia de gasto operativo para poder mostrar un
-- margen bruto real (ingresos - costo_mercaderia) sin necesitar el modo
-- detallado por producto (eso es Fase 3.1):
--   - costo_mercaderia: costo de lo que se vendio (reposicion de stock, etc)
--   - gasto_operativo: gastos de operar el negocio que no son mercaderia
create table public.business_expenses (
  id uuid primary key default gen_random_uuid(),
  income_source_id uuid not null references public.income_sources (id) on delete cascade,
  type text not null check (type in ('costo_mercaderia', 'gasto_operativo')),
  category text not null,
  month date not null,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create index business_expenses_source_month_idx on public.business_expenses (income_source_id, month);

alter table public.business_expenses enable row level security;
