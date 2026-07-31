import type { Database, DebtPaymentSource } from '@/lib/database.types'

export type Debt = Database['public']['Tables']['debts']['Row']
export type DebtPayment = Database['public']['Tables']['debt_payments']['Row']
export type { DebtPaymentSource }

export interface DebtInput {
  name: string
  original_amount: number
  installments_count: number | null
  start_date: string
  note: string | null
}

export interface DebtPaymentInput {
  date: string
  amount: number
  source: DebtPaymentSource
  note: string | null
}
