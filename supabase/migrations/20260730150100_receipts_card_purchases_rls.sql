-- Reemplaza receipts_owner_insert/update (Fase 6) para validar tambien que
-- target_credit_card_id, cuando viene cargado, sea una tarjeta propia.
drop policy "receipts_owner_insert" on public.receipts;
drop policy "receipts_owner_update" on public.receipts;

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
  and (
    target_credit_card_id is null
    or exists (
      select 1 from public.credit_cards cc
      where cc.id = target_credit_card_id
        and cc.user_id = auth.uid()
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
  and (
    target_credit_card_id is null
    or exists (
      select 1 from public.credit_cards cc
      where cc.id = target_credit_card_id
        and cc.user_id = auth.uid()
    )
  )
);
