import type { Database } from '@/lib/database.types'

export type Investment = Database['public']['Tables']['investments']['Row']
export type BusinessExpense = Database['public']['Tables']['business_expenses']['Row']
export type BusinessExpenseType = BusinessExpense['type']

export interface InvestmentInput {
  date: string
  amount: number
  note: string | null
}

export interface BusinessExpenseInput {
  type: BusinessExpenseType
  category: string
  amount: number
}
