create policy "savings_goals_owner_all"
on public.savings_goals for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "goal_contributions_owner_all"
on public.goal_contributions for all
using (
  exists (
    select 1 from public.savings_goals g
    where g.id = goal_contributions.savings_goal_id
      and g.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.savings_goals g
    where g.id = goal_contributions.savings_goal_id
      and g.user_id = auth.uid()
  )
);
