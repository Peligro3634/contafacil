import type { IncomeSourceType, ProductMode } from '@/features/personal/types'
import type { Database } from '@/lib/database.types'

export type Investment = Database['public']['Tables']['investments']['Row']
export type BusinessExpense = Database['public']['Tables']['business_expenses']['Row']
export type BusinessExpenseType = BusinessExpense['type']
export type IncomeSourcePartner = Database['public']['Tables']['income_source_partners']['Row']

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

export interface IncomeSourcePartnerInput {
  user_id: string
  participacion_pct: number
  aporte_inicial: number
}

// type acotado a emprendimientos (un grupo no puede tener "sueldo fijo").
export interface GroupIncomeSourceInput {
  type: Extract<IncomeSourceType, 'monotributo' | 'responsable_inscripto'>
  name: string
  product_mode: ProductMode
  partners: IncomeSourcePartnerInput[]
}
