-- Crea un group_expense y (si source='personal') sus shares en una sola
-- transaccion — evita que un gasto quede sin reparto si algo falla a mitad
-- de camino (mismo motivo que create_card_purchase en Fase 2). p_shares es
-- un jsonb array [{"user_id": "...", "amount": ...}, ...]: obligatorio y se
-- valida contra el monto total cuando source='personal' (cada user_id debe
-- ser miembro del grupo, sin duplicados, suma == p_amount); debe venir
-- vacio/null cuando source='fondo_comun', que no genera deuda entre
-- miembros.
create function public.create_group_expense(
  p_group_id uuid,
  p_description text,
  p_amount numeric,
  p_month date,
  p_source text,
  p_shares jsonb default null
)
returns public.group_expenses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expense public.group_expenses;
  v_share jsonb;
  v_shares_total numeric := 0;
  v_share_user uuid;
  v_share_amount numeric;
begin
  if auth.uid() is null then
    raise exception 'no autenticado';
  end if;

  if not public.is_group_member(p_group_id) then
    raise exception 'no pertenecés a este grupo';
  end if;

  if p_source not in ('fondo_comun', 'personal') then
    raise exception 'origen de gasto invalido: %', p_source;
  end if;

  if p_amount <= 0 then
    raise exception 'el monto debe ser mayor a 0';
  end if;

  if p_description is null or length(trim(p_description)) = 0 then
    raise exception 'la descripcion es obligatoria';
  end if;

  if p_source = 'personal' then
    if p_shares is null or jsonb_array_length(p_shares) = 0 then
      raise exception 'un gasto personal necesita al menos un participante';
    end if;
  elsif p_shares is not null and jsonb_array_length(p_shares) > 0 then
    raise exception 'un gasto de fondo comun no lleva reparto entre miembros';
  end if;

  insert into public.group_expenses (group_id, paid_by_user_id, description, amount, month, source)
  values (p_group_id, auth.uid(), trim(p_description), p_amount, p_month, p_source)
  returning * into v_expense;

  if p_source = 'personal' then
    for v_share in select * from jsonb_array_elements(p_shares)
    loop
      v_share_user := (v_share ->> 'user_id')::uuid;
      v_share_amount := (v_share ->> 'amount')::numeric;

      if v_share_amount <= 0 then
        raise exception 'el monto de cada participante debe ser mayor a 0';
      end if;

      if not exists (
        select 1 from public.group_members
        where group_id = p_group_id and user_id = v_share_user
      ) then
        raise exception 'un participante no pertenece al grupo';
      end if;

      v_shares_total := v_shares_total + v_share_amount;

      insert into public.group_expense_shares (group_expense_id, user_id, amount)
      values (v_expense.id, v_share_user, v_share_amount);
    end loop;

    if round(v_shares_total, 2) <> round(p_amount, 2) then
      raise exception 'la suma de los participantes (%) no coincide con el monto total (%)', v_shares_total, p_amount;
    end if;
  end if;

  return v_expense;
end;
$$;

revoke all on function public.create_group_expense(uuid, text, numeric, date, text, jsonb) from public;
grant execute on function public.create_group_expense(uuid, text, numeric, date, text, jsonb) to authenticated;
