import type { Database } from '@/lib/database.types'

export type CreditCard = Database['public']['Tables']['credit_cards']['Row']
export type CardPurchase = Database['public']['Tables']['card_purchases']['Row']
export type CardPurchaseInstallment = Database['public']['Tables']['card_purchase_installments']['Row']

export interface CreditCardInput {
  name: string
  closing_day: number
  due_day: number
}

export interface CardPurchaseInput {
  date: string
  amount_total: number
  description: string
  installments_count: number
}
