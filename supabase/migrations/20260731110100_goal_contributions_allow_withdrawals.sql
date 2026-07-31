-- Permite retiros de una meta de ahorro (gasto con origen "Ahorro", ver
-- src/features/goals/api.ts createGoalWithdrawal): un retiro es una fila mas
-- en goal_contributions con monto NEGATIVO, en vez de una tabla nueva.
-- computeGoalStatus ya suma amount tal cual, asi que un retiro resta del
-- ahorrado sin cambios en el calculo -- solo hacia falta permitir el signo.
alter table public.goal_contributions
  drop constraint goal_contributions_amount_check,
  add constraint goal_contributions_amount_check check (amount <> 0);
