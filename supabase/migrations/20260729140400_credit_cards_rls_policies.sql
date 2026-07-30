-- credit_cards se crea/edita directo desde el cliente (alta y edicion de
-- cierre/vencimiento). card_purchases y card_purchase_installments solo se
-- escriben via las funciones RPC de 20260729140300 (security definer, no
-- necesitan policy de insert/update/delete), pero si necesitan policy de
-- select para que el cliente pueda leerlas.

create policy "credit_cards_owner_all"
on public.credit_cards for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "card_purchases_owner_select"
on public.card_purchases for select
using (
  exists (
    select 1 from public.credit_cards cc
    where cc.id = card_purchases.credit_card_id
      and cc.user_id = auth.uid()
  )
);

create policy "card_purchase_installments_owner_select"
on public.card_purchase_installments for select
using (
  exists (
    select 1 from public.credit_cards cc
    where cc.id = card_purchase_installments.credit_card_id
      and cc.user_id = auth.uid()
  )
);
