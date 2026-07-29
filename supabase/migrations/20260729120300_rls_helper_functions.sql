-- Funciones auxiliares SECURITY DEFINER para las policies de RLS.
-- Se usan en vez de hacer un subquery directo a group_members dentro de la
-- policy de group_members: una policy que consulta su propia tabla sin pasar
-- por una funcion definer puede generar evaluacion recursiva. Al envolverlo
-- en una funcion STABLE + SECURITY DEFINER, Postgres la trata como una
-- caja negra y evalua una sola vez por fila.

create function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = auth.uid()
  );
$$;

create function public.is_group_admin(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_group_member(uuid) from public;
revoke all on function public.is_group_admin(uuid) from public;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_admin(uuid) to authenticated;
