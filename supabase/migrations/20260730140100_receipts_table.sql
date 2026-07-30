-- Comprobantes (foto/PDF) de venta de emprendimiento o gasto variable,
-- extraidos por IA y confirmados a mano antes de crear el registro final
-- (income_entry o variable_expense). "target_income_source_id" solo aplica
-- cuando related_entity='income_entry' (a que fuente de ingreso propia
-- pertenece la venta/transferencia recibida); un gasto no necesita fuente.
-- confidence/requires_review/review_reason vienen de la extraccion de IA
-- para forzar revision manual en casos dudosos antes de confirmar.
create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  related_entity text not null check (related_entity in ('income_entry', 'expense')),
  target_income_source_id uuid references public.income_sources (id),
  file_path text not null,
  status text not null default 'pendiente_confirmacion'
    check (status in ('pendiente_confirmacion', 'confirmado', 'editado_manualmente')),
  extracted_amount numeric,
  extracted_date date,
  extracted_note text,
  confidence text check (confidence in ('alta', 'media', 'baja')),
  requires_review boolean,
  review_reason text,
  extraction_input_tokens int,
  extraction_output_tokens int,
  created_income_entry_id uuid references public.income_entries (id),
  created_expense_id uuid references public.variable_expenses (id),
  created_at timestamptz not null default now(),
  check (
    (related_entity = 'income_entry' and target_income_source_id is not null)
    or (related_entity = 'expense' and target_income_source_id is null)
  )
);

create index receipts_user_idx on public.receipts (user_id, created_at desc);

alter table public.receipts enable row level security;
