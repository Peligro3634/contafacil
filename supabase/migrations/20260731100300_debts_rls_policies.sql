-- debts se crea/edita/borra directo desde el cliente (alta/edicion/borrado
-- de deuda). debt_payments solo se escribe via las funciones RPC de
-- 20260731100400 (security definer, no necesita policy de insert/update),
-- pero si necesita policy de select para que el cliente pueda leerlas, y de
-- delete para poder borrar un pago (create_debt_payment/delete_debt_payment
-- corren como el usuario dueno via security definer + chequeo de auth.uid()).

create policy "debts_owner_all"
on public.debts for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "debt_payments_owner_select"
on public.debt_payments for select
using (
  exists (
    select 1 from public.debts d
    where d.id = debt_payments.debt_id
      and d.user_id = auth.uid()
  )
);
