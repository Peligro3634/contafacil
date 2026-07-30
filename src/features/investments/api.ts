import { supabase } from '@/lib/supabase'
import type { BusinessExpense, BusinessExpenseInput, Investment, InvestmentInput } from './types'

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

// Costos de TODOS los emprendimientos del usuario en un mes dado: lo que
// consume el dashboard personal para sumar al gasto del mes (RLS ya filtra a
// emprendimientos propios).
export async function fetchBusinessExpensesForMonth(month: string): Promise<BusinessExpense[]> {
  const { data, error } = await supabase.from('business_expenses').select('*').eq('month', month)
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
