import type { Database } from '@/lib/database.types'

export type IncomeSourceType = Database['public']['Tables']['income_sources']['Row']['type']
export type ProductMode = Database['public']['Tables']['income_sources']['Row']['product_mode']

export type IncomeSource = Database['public']['Tables']['income_sources']['Row']
export type IncomeEntry = Database['public']['Tables']['income_entries']['Row']
export type FixedExpense = Database['public']['Tables']['fixed_expenses']['Row']
export type FixedExpenseEntry = Database['public']['Tables']['fixed_expense_entries']['Row']
export type VariableExpense = Database['public']['Tables']['variable_expenses']['Row']

export interface IncomeEntryInput {
  date: string
  base_amount: number
  extra_amount: number
  units_sold: number | null
  note: string | null
}
