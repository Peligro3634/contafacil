-- Helper SECURITY DEFINER (mismo motivo que is_group_member/is_group_admin
-- en 20260729120300): evita evaluacion recursiva al consultar
-- income_source_partners desde sus propias policies.
create function public.is_income_source_partner(p_income_source_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.income_source_partners
    where income_source_id = p_income_source_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_income_source_partner(uuid) from public;
grant execute on function public.is_income_source_partner(uuid) to authenticated;

-- income_sources: los emprendimientos de GRUPO son visibles para todo el
-- grupo (transparencia: el plan pide que recuperacion/ganancia se vean "en
-- la vista del grupo"), pero solo se crean via create_group_income_source()
-- (RPC) — no hace falta policy de insert/update/delete. Esta policy se suma
-- a income_sources_owner_all (Fase 1, owner_type='user') sin reemplazarla:
-- RLS es permisivo, cualquier policy que matchee alcanza.
create policy "income_sources_group_member_select"
on public.income_sources for select
using (owner_type = 'group' and public.is_group_member(owner_id));

-- income_source_partners: visible para todo el grupo (mismo motivo de
-- transparencia). Sin policy de insert/update/delete: se cargan solo desde
-- create_group_income_source() y se borran en cascada junto al
-- emprendimiento.
create policy "income_source_partners_group_member_select"
on public.income_source_partners for select
using (
  exists (
    select 1 from public.income_sources s
    where s.id = income_source_partners.income_source_id
      and s.owner_type = 'group'
      and public.is_group_member(s.owner_id)
  )
);

-- income_entries / investments / business_expenses de un emprendimiento de
-- GRUPO: select abierto a todo el grupo (para que se pueda ver el estado de
-- recuperacion/ganancia sin ser socio), pero cargar/editar/borrar solo para
-- los socios de ESE emprendimiento en particular (no todo miembro del grupo
-- es necesariamente socio de cada negocio). Se suman a las policies
-- *_owner_all de Fases 1/3 (owner_type='user') sin reemplazarlas.

create policy "income_entries_group_member_select"
on public.income_entries for select
using (
  exists (
    select 1 from public.income_sources s
    where s.id = income_entries.income_source_id
      and s.owner_type = 'group'
      and public.is_group_member(s.owner_id)
  )
);

create policy "income_entries_group_partner_insert"
on public.income_entries for insert
with check (
  exists (
    select 1 from public.income_sources s
    where s.id = income_entries.income_source_id
      and s.owner_type = 'group'
      and public.is_income_source_partner(s.id)
  )
);

create policy "income_entries_group_partner_update"
on public.income_entries for update
using (
  exists (
    select 1 from public.income_sources s
    where s.id = income_entries.income_source_id
      and s.owner_type = 'group'
      and public.is_income_source_partner(s.id)
  )
)
with check (
  exists (
    select 1 from public.income_sources s
    where s.id = income_entries.income_source_id
      and s.owner_type = 'group'
      and public.is_income_source_partner(s.id)
  )
);

create policy "income_entries_group_partner_delete"
on public.income_entries for delete
using (
  exists (
    select 1 from public.income_sources s
    where s.id = income_entries.income_source_id
      and s.owner_type = 'group'
      and public.is_income_source_partner(s.id)
  )
);

create policy "investments_group_member_select"
on public.investments for select
using (
  exists (
    select 1 from public.income_sources s
    where s.id = investments.income_source_id
      and s.owner_type = 'group'
      and public.is_group_member(s.owner_id)
  )
);

create policy "investments_group_partner_insert"
on public.investments for insert
with check (
  exists (
    select 1 from public.income_sources s
    where s.id = investments.income_source_id
      and s.owner_type = 'group'
      and public.is_income_source_partner(s.id)
  )
);

create policy "investments_group_partner_delete"
on public.investments for delete
using (
  exists (
    select 1 from public.income_sources s
    where s.id = investments.income_source_id
      and s.owner_type = 'group'
      and public.is_income_source_partner(s.id)
  )
);

create policy "business_expenses_group_member_select"
on public.business_expenses for select
using (
  exists (
    select 1 from public.income_sources s
    where s.id = business_expenses.income_source_id
      and s.owner_type = 'group'
      and public.is_group_member(s.owner_id)
  )
);

create policy "business_expenses_group_partner_insert"
on public.business_expenses for insert
with check (
  exists (
    select 1 from public.income_sources s
    where s.id = business_expenses.income_source_id
      and s.owner_type = 'group'
      and public.is_income_source_partner(s.id)
  )
);

create policy "business_expenses_group_partner_delete"
on public.business_expenses for delete
using (
  exists (
    select 1 from public.income_sources s
    where s.id = business_expenses.income_source_id
      and s.owner_type = 'group'
      and public.is_income_source_partner(s.id)
  )
);
