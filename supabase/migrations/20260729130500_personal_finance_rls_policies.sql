-- Fase 1: todo el modelo de finanzas personales es propiedad individual.
-- income_sources ya modela owner_type/owner_id pensando en Fase 3 (un
-- emprendimiento de grupo), pero por ahora solo existe policy para
-- owner_type = 'user' — insertar con owner_type = 'group' queda bloqueado
-- por RLS hasta que esa fase agregue su propia policy.

create policy "income_sources_owner_all"
on public.income_sources for all
using (owner_type = 'user' and owner_id = auth.uid())
with check (owner_type = 'user' and owner_id = auth.uid());

create policy "income_entries_owner_all"
on public.income_entries for all
using (
  exists (
    select 1 from public.income_sources s
    where s.id = income_entries.income_source_id
      and s.owner_type = 'user'
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.income_sources s
    where s.id = income_entries.income_source_id
      and s.owner_type = 'user'
      and s.owner_id = auth.uid()
  )
);

create policy "fixed_expenses_owner_all"
on public.fixed_expenses for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "fixed_expense_entries_owner_all"
on public.fixed_expense_entries for all
using (
  exists (
    select 1 from public.fixed_expenses fe
    where fe.id = fixed_expense_entries.fixed_expense_id
      and fe.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.fixed_expenses fe
    where fe.id = fixed_expense_entries.fixed_expense_id
      and fe.user_id = auth.uid()
  )
);

create policy "variable_expenses_owner_all"
on public.variable_expenses for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
