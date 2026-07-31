import { supabase } from '@/lib/supabase'
import type { GoalContribution, GoalContributionInput, SavingsGoal, SavingsGoalInput } from './types'

export async function fetchSavingsGoals(): Promise<SavingsGoal[]> {
  const { data, error } = await supabase.from('savings_goals').select('*').order('target_date', { ascending: true })
  if (error) throw error
  return data
}

export async function createSavingsGoal(userId: string, input: SavingsGoalInput): Promise<SavingsGoal> {
  const { data, error } = await supabase
    .from('savings_goals')
    .insert({ user_id: userId, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSavingsGoal(id: string, input: SavingsGoalInput): Promise<SavingsGoal> {
  const { data, error } = await supabase.from('savings_goals').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const { error } = await supabase.from('savings_goals').delete().eq('id', id)
  if (error) throw error
}

export async function fetchGoalContributions(savingsGoalId: string): Promise<GoalContribution[]> {
  const { data, error } = await supabase
    .from('goal_contributions')
    .select('*')
    .eq('savings_goal_id', savingsGoalId)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

// Todos los aportes del usuario (RLS los acota a metas propias vía
// savings_goals). Sirve para el total ahorrado del resumen de patrimonio,
// sin tener que pedir aporte por aporte meta a meta.
export async function fetchAllGoalContributions(): Promise<GoalContribution[]> {
  const { data, error } = await supabase.from('goal_contributions').select('*')
  if (error) throw error
  return data
}

export async function createGoalContribution(
  savingsGoalId: string,
  input: GoalContributionInput,
): Promise<GoalContribution> {
  const { data, error } = await supabase
    .from('goal_contributions')
    .insert({ savings_goal_id: savingsGoalId, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteGoalContribution(id: string): Promise<void> {
  const { error } = await supabase.from('goal_contributions').delete().eq('id', id)
  if (error) throw error
}
