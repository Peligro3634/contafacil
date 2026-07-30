-- group_goals: una meta de grupo es una decision colectiva, no tiene un
-- "dueño" individual como savings_goals — cualquier miembro del grupo puede
-- darla de alta, editarla o borrarla.
create policy "group_goals_member_all"
on public.group_goals for all
using (public.is_group_member(group_id))
with check (public.is_group_member(group_id));

-- group_goal_contributions: cualquier miembro del grupo puede VER todos los
-- aportes (hace falta para saber cuanto llevan puesto entre todos), pero
-- cada uno carga/borra solo los suyos (igual que fund_contributions).
create policy "group_goal_contributions_member_select"
on public.group_goal_contributions for select
using (
  exists (
    select 1 from public.group_goals gg
    where gg.id = group_goal_contributions.group_goal_id
      and public.is_group_member(gg.group_id)
  )
);

create policy "group_goal_contributions_own_insert"
on public.group_goal_contributions for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.group_goals gg
    where gg.id = group_goal_contributions.group_goal_id
      and public.is_group_member(gg.group_id)
  )
);

create policy "group_goal_contributions_own_delete"
on public.group_goal_contributions for delete
using (user_id = auth.uid());

-- fund_contributions: mismo esquema que group_goal_contributions.
create policy "fund_contributions_member_select"
on public.fund_contributions for select
using (public.is_group_member(group_id));

create policy "fund_contributions_own_insert"
on public.fund_contributions for insert
with check (user_id = auth.uid() and public.is_group_member(group_id));

create policy "fund_contributions_own_delete"
on public.fund_contributions for delete
using (user_id = auth.uid());

-- group_expenses: visibles para cualquier miembro del grupo. Se crean solo
-- via create_group_expense() (RPC, SECURITY DEFINER) para poder insertar el
-- gasto y sus shares atomicamente — no hace falta policy de insert. Solo
-- quien pago puede borrar su propio gasto (el on delete cascade se encarga
-- de las shares).
create policy "group_expenses_member_select"
on public.group_expenses for select
using (public.is_group_member(group_id));

create policy "group_expenses_payer_delete"
on public.group_expenses for delete
using (paid_by_user_id = auth.uid());

-- group_expense_shares: visibles para cualquier miembro del grupo del gasto
-- al que pertenecen. Sin policy de insert/update/delete: se cargan solo
-- desde create_group_expense() y se borran en cascada junto al gasto.
create policy "group_expense_shares_member_select"
on public.group_expense_shares for select
using (
  exists (
    select 1 from public.group_expenses ge
    where ge.id = group_expense_shares.group_expense_id
      and public.is_group_member(ge.group_id)
  )
);
