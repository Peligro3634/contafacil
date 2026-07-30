-- Ownership simple por user_id, mas una validacion extra en insert/update:
-- si related_entity='income_entry', target_income_source_id tiene que ser
-- una fuente propia (owner_type='user'), igual patron que
-- income_entries_owner_all.
create policy "receipts_owner_select"
on public.receipts for select
using (user_id = auth.uid());

create policy "receipts_owner_insert"
on public.receipts for insert
with check (
  user_id = auth.uid()
  and (
    target_income_source_id is null
    or exists (
      select 1 from public.income_sources s
      where s.id = target_income_source_id
        and s.owner_type = 'user'
        and s.owner_id = auth.uid()
    )
  )
);

create policy "receipts_owner_update"
on public.receipts for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (
    target_income_source_id is null
    or exists (
      select 1 from public.income_sources s
      where s.id = target_income_source_id
        and s.owner_type = 'user'
        and s.owner_id = auth.uid()
    )
  )
);

create policy "receipts_owner_delete"
on public.receipts for delete
using (user_id = auth.uid());
