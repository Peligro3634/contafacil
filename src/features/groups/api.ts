import { supabase } from '@/lib/supabase'
import type {
  FundContribution,
  FundContributionInput,
  Group,
  GroupExpense,
  GroupExpenseInput,
  GroupExpenseShare,
  GroupGoal,
  GroupGoalContribution,
  GroupGoalContributionInput,
  GroupGoalInput,
  GroupMember,
  GroupType,
} from './types'

export async function fetchMyGroups(): Promise<Group[]> {
  // RLS ya filtra a "grupos de los que soy miembro", no hace falta un where extra.
  const { data, error } = await supabase.from('groups').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchGroup(groupId: string): Promise<Group> {
  const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).single()
  if (error) throw error
  return data
}

export async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id, role, joined_at')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })
  if (membersError) throw membersError
  if (members.length === 0) return []

  const userIds = members.map((m) => m.user_id)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('id', userIds)
  if (profilesError) throw profilesError

  const profileById = new Map(profiles.map((p) => [p.id, p]))
  return members.map((m) => ({ ...m, profile: profileById.get(m.user_id) ?? null }))
}

export async function createGroup(name: string, type: GroupType): Promise<Group> {
  const { data, error } = await supabase.rpc('create_group', { p_name: name, p_type: type })
  if (error) throw error
  return data
}

export async function joinGroupByCode(inviteCode: string): Promise<Group> {
  const { data, error } = await supabase.rpc('join_group_by_code', { p_invite_code: inviteCode })
  if (error) throw error
  return data
}

export async function fetchGroupGoals(groupId: string): Promise<GroupGoal[]> {
  const { data, error } = await supabase
    .from('group_goals')
    .select('*')
    .eq('group_id', groupId)
    .order('target_date', { ascending: true })
  if (error) throw error
  return data
}

export async function createGroupGoal(groupId: string, input: GroupGoalInput): Promise<GroupGoal> {
  const { data, error } = await supabase
    .from('group_goals')
    .insert({ group_id: groupId, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateGroupGoal(id: string, input: GroupGoalInput): Promise<GroupGoal> {
  const { data, error } = await supabase.from('group_goals').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteGroupGoal(id: string): Promise<void> {
  const { error } = await supabase.from('group_goals').delete().eq('id', id)
  if (error) throw error
}

export async function fetchGroupGoalContributions(groupGoalId: string): Promise<GroupGoalContribution[]> {
  const { data, error } = await supabase
    .from('group_goal_contributions')
    .select('*')
    .eq('group_goal_id', groupGoalId)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function createGroupGoalContribution(
  groupGoalId: string,
  userId: string,
  input: GroupGoalContributionInput,
): Promise<GroupGoalContribution> {
  const { data, error } = await supabase
    .from('group_goal_contributions')
    .insert({ group_goal_id: groupGoalId, user_id: userId, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteGroupGoalContribution(id: string): Promise<void> {
  const { error } = await supabase.from('group_goal_contributions').delete().eq('id', id)
  if (error) throw error
}

export async function fetchFundContributions(groupId: string): Promise<FundContribution[]> {
  const { data, error } = await supabase
    .from('fund_contributions')
    .select('*')
    .eq('group_id', groupId)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function createFundContribution(
  groupId: string,
  userId: string,
  input: FundContributionInput,
): Promise<FundContribution> {
  const { data, error } = await supabase
    .from('fund_contributions')
    .insert({ group_id: groupId, user_id: userId, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteFundContribution(id: string): Promise<void> {
  const { error } = await supabase.from('fund_contributions').delete().eq('id', id)
  if (error) throw error
}

export async function fetchGroupExpenses(groupId: string): Promise<GroupExpense[]> {
  const { data, error } = await supabase
    .from('group_expenses')
    .select('*')
    .eq('group_id', groupId)
    .order('month', { ascending: false })
  if (error) throw error
  return data
}

// Reparto de un conjunto de gastos (para armar el resumen de deudas del
// grupo, ver computeGroupDebts en aggregate.ts). Solo existen filas para
// gastos con source='personal'.
export async function fetchGroupExpenseShares(groupExpenseIds: string[]): Promise<GroupExpenseShare[]> {
  if (groupExpenseIds.length === 0) return []
  const { data, error } = await supabase
    .from('group_expense_shares')
    .select('*')
    .in('group_expense_id', groupExpenseIds)
  if (error) throw error
  return data
}

export async function createGroupExpense(groupId: string, input: GroupExpenseInput): Promise<GroupExpense> {
  const { data, error } = await supabase.rpc('create_group_expense', {
    p_group_id: groupId,
    p_description: input.description,
    p_amount: input.amount,
    p_month: input.month,
    p_source: input.source,
    p_shares: input.source === 'personal' ? input.shares : null,
  })
  if (error) throw error
  return data
}

export async function deleteGroupExpense(id: string): Promise<void> {
  const { error } = await supabase.from('group_expenses').delete().eq('id', id)
  if (error) throw error
}

// Gastos 'personal' pagados por el usuario autenticado en TODOS sus grupos
// para un mes dado: alimenta el dashboard personal (ver groupExpenseBreakdown
// en aggregate.ts -> computeDashboardTotals). RLS ya filtra a gastos de
// grupos donde el usuario es miembro; el filtro de paid_by_user_id acota a
// los que salieron de SU bolsillo.
export async function fetchMyGroupPersonalExpensesForMonth(userId: string, month: string): Promise<GroupExpense[]> {
  const { data, error } = await supabase
    .from('group_expenses')
    .select('*')
    .eq('paid_by_user_id', userId)
    .eq('source', 'personal')
    .eq('month', month)
  if (error) throw error
  return data
}

// Gastos de grupo pagados de bolsillo propio por este usuario desde
// "fromMonth" (sin limite superior): hace falta para el fondo general (ver
// src/lib/cashBalance.ts).
export async function fetchMyGroupPersonalExpensesFrom(userId: string, fromMonth: string): Promise<GroupExpense[]> {
  const { data, error } = await supabase
    .from('group_expenses')
    .select('*')
    .eq('paid_by_user_id', userId)
    .eq('source', 'personal')
    .gte('month', fromMonth)
  if (error) throw error
  return data
}
