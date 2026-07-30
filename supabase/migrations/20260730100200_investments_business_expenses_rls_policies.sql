-- Mismo patron que income_entries_owner_all (20260729130500): el ownership
-- de investments/business_expenses se resuelve a traves de income_sources,
-- que ya restringe a owner_type = 'user' (emprendimientos de grupo quedan
-- para cuando exista la vista de grupo correspondiente).

create policy "investments_owner_all"
on public.investments for all
using (
  exists (
    select 1 from public.income_sources s
    where s.id = investments.income_source_id
      and s.owner_type = 'user'
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.income_sources s
    where s.id = investments.income_source_id
      and s.owner_type = 'user'
      and s.owner_id = auth.uid()
  )
);

create policy "business_expenses_owner_all"
on public.business_expenses for all
using (
  exists (
    select 1 from public.income_sources s
    where s.id = business_expenses.income_source_id
      and s.owner_type = 'user'
      and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.income_sources s
    where s.id = business_expenses.income_source_id
      and s.owner_type = 'user'
      and s.owner_id = auth.uid()
  )
);
