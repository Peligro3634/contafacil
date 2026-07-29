-- Crea un grupo y da de alta al creador como admin, en una sola transaccion
-- (evita que quede un grupo sin ningun miembro admin si algo falla a mitad
-- de camino). Genera un invite_code corto y unico.
create function public.create_group(p_name text, p_type text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_group public.groups;
begin
  if auth.uid() is null then
    raise exception 'no autenticado';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'el nombre del grupo es obligatorio';
  end if;

  if p_type not in ('familia', 'viaje', 'otro') then
    raise exception 'tipo de grupo invalido: %', p_type;
  end if;

  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.groups where invite_code = v_code);
  end loop;

  insert into public.groups (name, type, invite_code, created_by)
  values (trim(p_name), p_type, v_code, auth.uid())
  returning * into v_group;

  insert into public.group_members (group_id, user_id, role)
  values (v_group.id, auth.uid(), 'admin');

  return v_group;
end;
$$;

-- Suma al usuario autenticado como miembro del grupo dueño de p_invite_code.
-- SECURITY DEFINER porque un usuario sin membresia todavia no puede hacer
-- select directo sobre groups (RLS se lo impide) para resolver el codigo.
create function public.join_group_by_code(p_invite_code text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.groups;
begin
  if auth.uid() is null then
    raise exception 'no autenticado';
  end if;

  select * into v_group
  from public.groups
  where invite_code = upper(trim(p_invite_code));

  if not found then
    raise exception 'codigo de invitacion invalido';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_group.id, auth.uid(), 'miembro')
  on conflict (group_id, user_id) do nothing;

  return v_group;
end;
$$;

revoke all on function public.create_group(text, text) from public;
revoke all on function public.join_group_by_code(text) from public;
grant execute on function public.create_group(text, text) to authenticated;
grant execute on function public.join_group_by_code(text) to authenticated;
