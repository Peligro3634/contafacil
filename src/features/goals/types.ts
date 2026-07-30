import type { Database } from '@/lib/database.types'

export type SavingsGoal = Database['public']['Tables']['savings_goals']['Row']
export type GoalContribution = Database['public']['Tables']['goal_contributions']['Row']

export interface SavingsGoalInput {
  name: string
  target_amount: number
  target_date: string
}

export interface GoalContributionInput {
  date: string
  amount: number
  note: string | null
}
