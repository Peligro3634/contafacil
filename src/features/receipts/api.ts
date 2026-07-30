import { supabase } from '@/lib/supabase'
import type { CreateReceiptInput, ExtractionResult, Receipt } from './types'

// Path por convencion "<user_id>/<archivo>": la RLS de storage.objects
// depende de que el primer segmento del path sea el uid del usuario.
export async function uploadReceiptFile(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('receipts').upload(path, file, {
    contentType: file.type,
  })
  if (error) throw error
  return path
}

export async function createReceipt(userId: string, input: CreateReceiptInput): Promise<Receipt> {
  const { data, error } = await supabase
    .from('receipts')
    .insert({ user_id: userId, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

// Dispara la extraccion por IA (Edge Function extract-receipt) y devuelve el
// resultado; la funcion ya deja los campos extracted_* guardados en la fila.
export async function extractReceipt(receiptId: string): Promise<ExtractionResult> {
  const { data, error } = await supabase.functions.invoke('extract-receipt', {
    body: { receiptId },
  })
  if (error) throw error
  return data as ExtractionResult
}

export async function markReceiptConfirmed(
  id: string,
  status: 'confirmado' | 'editado_manualmente',
  linkedId: { incomeEntryId?: string; expenseId?: string; cardPurchaseId?: string },
): Promise<void> {
  const { error } = await supabase
    .from('receipts')
    .update({
      status,
      created_income_entry_id: linkedId.incomeEntryId ?? null,
      created_expense_id: linkedId.expenseId ?? null,
      created_card_purchase_id: linkedId.cardPurchaseId ?? null,
    })
    .eq('id', id)
  if (error) throw error
}

// Borra el archivo y la fila: usado cuando el usuario descarta un
// comprobante antes de confirmarlo (nunca despues de confirmado).
export async function discardReceipt(receipt: Receipt): Promise<void> {
  await supabase.storage.from('receipts').remove([receipt.file_path])
  const { error } = await supabase.from('receipts').delete().eq('id', receipt.id)
  if (error) throw error
}
