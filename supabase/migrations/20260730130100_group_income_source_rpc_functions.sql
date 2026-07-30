-- Crea un emprendimiento de grupo (income_sources con owner_type='group') y
-- sus socios (income_source_partners) en una sola transaccion — evita que
-- quede un emprendimiento sin socios, o con un reparto que no suma 100%, si
-- algo falla a mitad de camino (mismo motivo que create_group_expense).
-- p_partners es un jsonb array [{"user_id": "...", "participacion_pct": ...,
-- "aporte_inicial": ...}, ...]: cada user_id debe ser miembro del grupo, sin
-- duplicados (unique en income_source_partners), y la suma de
-- participacion_pct debe dar exactamente 100.
create function public.create_group_income_source(
  p_group_id uuid,
  p_type text,
  p_name text,
  p_product_mode text,
  p_partners jsonb
)
returns public.income_sources
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source public.income_sources;
  v_partner jsonb;
  v_partner_user uuid;
  v_partner_pct numeric;
  v_partner_aporte numeric;
  v_pct_total numeric := 0;
begin
  if auth.uid() is null then
    raise exception 'no autenticado';
  end if;

  if not public.is_group_member(p_group_id) then
    raise exception 'no pertenecés a este grupo';
  end if;

  if p_type not in ('monotributo', 'responsable_inscripto') then
    raise exception 'tipo de emprendimiento invalido: %', p_type;
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'el nombre es obligatorio';
  end if;

  if p_product_mode not in ('simple', 'detallado') then
    raise exception 'modo de producto invalido: %', p_product_mode;
  end if;

  if p_partners is null or jsonb_array_length(p_partners) = 0 then
    raise exception 'un emprendimiento de grupo necesita al menos un socio';
  end if;

  insert into public.income_sources (owner_type, owner_id, type, name, product_mode)
  values ('group', p_group_id, p_type, trim(p_name), p_product_mode)
  returning * into v_source;

  for v_partner in select * from jsonb_array_elements(p_partners)
  loop
    v_partner_user := (v_partner ->> 'user_id')::uuid;
    v_partner_pct := (v_partner ->> 'participacion_pct')::numeric;
    v_partner_aporte := coalesce((v_partner ->> 'aporte_inicial')::numeric, 0);

    if v_partner_pct <= 0 then
      raise exception 'la participación de cada socio debe ser mayor a 0';
    end if;

    if not exists (
      select 1 from public.group_members
      where group_id = p_group_id and user_id = v_partner_user
    ) then
      raise exception 'un socio no pertenece al grupo';
    end if;

    v_pct_total := v_pct_total + v_partner_pct;

    insert into public.income_source_partners (income_source_id, user_id, aporte_inicial, participacion_pct)
    values (v_source.id, v_partner_user, v_partner_aporte, v_partner_pct);
  end loop;

  if round(v_pct_total, 2) <> 100 then
    raise exception 'la suma de participaciones (%) debe ser 100', v_pct_total;
  end if;

  return v_source;
end;
$$;

revoke all on function public.create_group_income_source(uuid, text, text, text, jsonb) from public;
grant execute on function public.create_group_income_source(uuid, text, text, text, jsonb) to authenticated;
