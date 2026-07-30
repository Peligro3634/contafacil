import { supabase } from '@/lib/supabase'
import type {
  FixedExpense,
  FixedExpenseEntry,
  IncomeEntry,
  IncomeEntryInput,
  IncomeSource,
  IncomeSourceType,
  VariableExpense,
} from './types'

export async function fetchIncomeSources(): Promise<IncomeSource[]> {
  const { data, error } = await supabase.from('income_sources').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createIncomeSource(
  ownerId: string,
  input: { type: IncomeSourceType; name: string },
): Promise<IncomeSource> {
  const { data, error } = await supabase
    .from('income_sources')
    .insert({ owner_type: 'user', owner_id: ownerId, type: input.type, name: input.name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchIncomeEntries(monthStart: string, monthEndExclusive: string): Promise<IncomeEntry[]> {
  const { data, error } = await supabase
    .from('income_entries')
    .select('*')
    .gte('date', monthStart)
    .lt('date', monthEndExclusive)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

// Todas las ventas de una fuente de ingreso, sin filtro de mes: hace falta
// para calcular el acumulado historico de un emprendimiento (recuperacion de
// inversion), a diferencia de fetchIncomeEntries que esta acotado al mes del
// dashboard.
export async function fetchIncomeEntriesForSource(incomeSourceId: string): Promise<IncomeEntry[]> {
  const { data, error } = await supabase
    .from('income_entries')
    .select('*')
    .eq('income_source_id', incomeSourceId)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function createIncomeEntry(
  incomeSourceId: string,
  input: IncomeEntryInput,
): Promise<IncomeEntry> {
  const { data, error } = await supabase
    .from('income_entries')
    .insert({ income_source_id: incomeSourceId, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateIncomeEntry(id: string, input: IncomeEntryInput): Promise<IncomeEntry> {
  const { data, error } = await supabase.from('income_entries').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteIncomeEntry(id: string): Promise<void> {
  const { error } = await supabase.from('income_entries').delete().eq('id', id)
  if (error) throw error
}

export async function fetchFixedExpenses(): Promise<FixedExpense[]> {
  const { data, error } = await supabase.from('fixed_expenses').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createFixedExpense(userId: string, name: string): Promise<FixedExpense> {
  const { data, error } = await supabase.from('fixed_expenses').insert({ user_id: userId, name }).select().single()
  if (error) throw error
  return data
}

export async function fetchFixedExpenseEntries(month: string): Promise<FixedExpenseEntry[]> {
  const { data, error } = await supabase.from('fixed_expense_entries').select('*').eq('month', month)
  if (error) throw error
  return data
}

export async function upsertFixedExpenseEntry(
  fixedExpenseId: string,
  month: string,
  amount: number,
): Promise<FixedExpenseEntry> {
  const { data, error } = await supabase
    .from('fixed_expense_entries')
    .upsert({ fixed_expense_id: fixedExpenseId, month, amount }, { onConflict: 'fixed_expense_id,month' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchVariableExpenses(month: string): Promise<VariableExpense[]> {
  const { data, error } = await supabase
    .from('variable_expenses')
    .select('*')
    .eq('month', month)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createVariableExpense(
  userId: string,
  input: { category: string; month: string; amount: number },
): Promise<VariableExpense> {
  const { data, error } = await supabase
    .from('variable_expenses')
    .insert({ user_id: userId, category: input.category, month: input.month, amount: input.amount })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteVariableExpense(id: string): Promise<void> {
  const { error } = await supabase.from('variable_expenses').delete().eq('id', id)
  if (error) throw error
}
