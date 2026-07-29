-- profiles: cada usuario ve y edita su propio perfil; ademas puede ver el
-- nombre/email de otros usuarios con los que comparte al menos un grupo
-- (necesario para pintar la lista de miembros de un grupo).
create policy "profiles_select_self_or_group_peers"
on public.profiles for select
using (
  id = auth.uid()
  or exists (
    select 1
    from public.group_members gm_self
    join public.group_members gm_peer on gm_peer.group_id = gm_self.group_id
    where gm_self.user_id = auth.uid()
      and gm_peer.user_id = profiles.id
  )
);

create policy "profiles_update_self"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- No hay policy de insert/delete para profiles: la fila se crea sola via
-- trigger (handle_new_user) cuando se registra el usuario en auth.users.

-- groups: solo visibles para sus miembros; solo el admin puede editarlos.
create policy "groups_select_members"
on public.groups for select
using (public.is_group_member(id));

create policy "groups_update_admins"
on public.groups for update
using (public.is_group_admin(id))
with check (public.is_group_admin(id));

-- No hay policy de insert para groups: se crean via RPC create_group()
-- (SECURITY DEFINER), que ademas da de alta al creador como admin en la
-- misma transaccion. Esto evita el estado invalido de "grupo sin admin".

-- group_members: un usuario ve la lista de miembros de los grupos a los que
-- pertenece (incluida su propia fila).
create policy "group_members_select_fellow_members"
on public.group_members for select
using (public.is_group_member(group_id));

-- No hay policy de insert/update/delete para group_members: las altas pasan
-- por create_group() / join_group_by_code() (SECURITY DEFINER).
