import type { Database } from '@/lib/database.types'

export type Group = Database['public']['Tables']['groups']['Row']
export type GroupType = Database['public']['Tables']['groups']['Row']['type']
export type GroupRole = Database['public']['Tables']['group_members']['Row']['role']

export interface GroupMember {
  user_id: string
  role: GroupRole
  joined_at: string
  profile: {
    id: string
    name: string
    email: string
  } | null
}

export type GroupGoal = Database['public']['Tables']['group_goals']['Row']
export type GroupGoalContribution = Database['public']['Tables']['group_goal_contributions']['Row']
export type FundContribution = Database['public']['Tables']['fund_contributions']['Row']
export type GroupExpense = Database['public']['Tables']['group_expenses']['Row']
export type GroupExpenseShare = Database['public']['Tables']['group_expense_shares']['Row']
export type GroupExpenseSource = GroupExpense['source']

export interface GroupGoalInput {
  name: string
  target_amount: number
  target_date: string
}

export interface GroupGoalContributionInput {
  date: string
  amount: number
  note: string | null
}

export interface FundContributionInput {
  date: string
  amount: number
  note: string | null
}

export interface GroupExpenseShareInput {
  user_id: string
  amount: number
}

export interface GroupExpenseInput {
  description: string
  amount: number
  month: string
  source: GroupExpenseSource
  // Vacio cuando source = 'fondo_comun': ese gasto no genera deuda entre
  // miembros, solo descuenta del saldo del fondo comun.
  shares: GroupExpenseShareInput[]
}
