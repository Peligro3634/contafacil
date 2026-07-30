import type { IncomeSource } from '@/features/personal/types'
import { supabase } from '@/lib/supabase'
import type {
  BusinessExpense,
  BusinessExpenseInput,
  GroupIncomeSourceInput,
  IncomeSourcePartner,
  Investment,
  InvestmentInput,
} from './types'

export async function fetchInvestments(incomeSourceId: string): Promise<Investment[]> {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('income_source_id', incomeSourceId)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function createInvestment(incomeSourceId: string, input: InvestmentInput): Promise<Investment> {
  const { data, error } = await supabase
    .from('investments')
    .insert({ income_source_id: incomeSourceId, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteInvestment(id: string): Promise<void> {
  const { error } = await supabase.from('investments').delete().eq('id', id)
  if (error) throw error
}

// Todos los costos historicos de UN emprendimiento (sin filtro de mes): hace
// falta para el acumulado de recuperacion de inversion.
export async function fetchBusinessExpensesForSource(incomeSourceId: string): Promise<BusinessExpense[]> {
  const { data, error } = await supabase
    .from('business_expenses')
    .select('*')
    .eq('income_source_id', incomeSourceId)
    .order('month', { ascending: true })
  if (error) throw error
  return data
}

// Costos de TODOS los emprendimientos PERSONALES del usuario en un mes dado:
// lo que consume el dashboard personal para sumar al gasto del mes. Acotado
// a owner_type='user' a mano: desde Fase 5.1, RLS tambien deja ver
// business_expenses de emprendimientos de GRUPO de los que el usuario es
// miembro, y esos nunca deben mezclarse con el dashboard personal.
export async function fetchBusinessExpensesForMonth(month: string): Promise<BusinessExpense[]> {
  const { data: sources, error: sourcesError } = await supabase
    .from('income_sources')
    .select('id')
    .eq('owner_type', 'user')
  if (sourcesError) throw sourcesError
  const sourceIds = sources.map((source) => source.id)
  if (sourceIds.length === 0) return []

  const { data, error } = await supabase
    .from('business_expenses')
    .select('*')
    .in('income_source_id', sourceIds)
    .eq('month', month)
  if (error) throw error
  return data
}

export async function createBusinessExpense(
  incomeSourceId: string,
  month: string,
  input: BusinessExpenseInput,
): Promise<BusinessExpense> {
  const { data, error } = await supabase
    .from('business_expenses')
    .insert({ income_source_id: incomeSourceId, month, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBusinessExpense(id: string): Promise<void> {
  const { error } = await supabase.from('business_expenses').delete().eq('id', id)
  if (error) throw error
}

// Emprendimientos de GRUPO (owner_type='group') de un grupo dado. Separado
// de fetchIncomeSources (Fase 1, acotado a owner_type='user') para no
// mezclar la vista personal con la de grupo.
export async function fetchGroupIncomeSources(groupId: string): Promise<IncomeSource[]> {
  const { data, error } = await supabase
    .from('income_sources')
    .select('*')
    .eq('owner_type', 'group')
    .eq('owner_id', groupId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchIncomeSourcePartners(incomeSourceId: string): Promise<IncomeSourcePartner[]> {
  const { data, error } = await supabase
    .from('income_source_partners')
    .select('*')
    .eq('income_source_id', incomeSourceId)
  if (error) throw error
  return data
}

export async function createGroupIncomeSource(
  groupId: string,
  input: GroupIncomeSourceInput,
): Promise<IncomeSource> {
  const { data, error } = await supabase.rpc('create_group_income_source', {
    p_group_id: groupId,
    p_type: input.type,
    p_name: input.name,
    p_product_mode: input.product_mode,
    p_partners: input.partners,
  })
  if (error) throw error
  return data
}
