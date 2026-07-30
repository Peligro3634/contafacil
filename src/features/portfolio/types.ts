import type { Database } from '@/lib/database.types'

export type PortfolioItem = Database['public']['Tables']['investment_portfolio']['Row']
export type PortfolioInstrumentType = PortfolioItem['instrument_type']

export interface PortfolioItemInput {
  instrument_type: PortfolioInstrumentType
  name: string
  quantity: number
  purchase_price: number
  purchase_date: string
  current_value: number
  note: string | null
}
