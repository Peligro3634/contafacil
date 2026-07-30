import type { Database } from '@/lib/database.types'

export type Receipt = Database['public']['Tables']['receipts']['Row']
export type ReceiptRelatedEntity = Receipt['related_entity']
export type ReceiptConfidence = NonNullable<Receipt['confidence']>

export interface ExtractionResult {
  amount: number | null
  date: string | null
  note: string | null
  confidence: ReceiptConfidence
  requires_review: boolean
  review_reason: string | null
  usage: { input_tokens: number; output_tokens: number }
}

export interface CreateReceiptInput {
  related_entity: ReceiptRelatedEntity
  target_income_source_id: string | null
  target_credit_card_id: string | null
  file_path: string
}
