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
  // Cuotas ya abonadas ANTES de cargar la compra (alta de una deuda de
  // tarjeta preexistente, para que un usuario nuevo no arranque en cero).
  // 0 = compra nueva, ninguna cuota pagada todavia.
  paid_installments_count?: number
}
