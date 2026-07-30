-- Fase 6.1: extiende receipts para cubrir compras de tarjeta. Reusa el
-- mismo flujo (subir -> extraer -> confirmar) que ventas/gastos; la
-- cantidad de cuotas nunca se auto-extrae (es una decision del usuario, no
-- un dato que figure siempre en el comprobante), se completa a mano en la
-- confirmacion.
alter table public.receipts
  add column target_credit_card_id uuid references public.credit_cards (id),
  add column created_card_purchase_id uuid references public.card_purchases (id);

alter table public.receipts drop constraint receipts_related_entity_check;
alter table public.receipts add constraint receipts_related_entity_check
  check (related_entity in ('income_entry', 'expense', 'card_purchase'));

alter table public.receipts drop constraint receipts_check;
alter table public.receipts add constraint receipts_check
  check (
    (related_entity = 'income_entry' and target_income_source_id is not null and target_credit_card_id is null)
    or (related_entity = 'expense' and target_income_source_id is null and target_credit_card_id is null)
    or (related_entity = 'card_purchase' and target_income_source_id is null and target_credit_card_id is not null)
  );
