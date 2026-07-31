import { supabase } from '@/lib/supabase'
import type { Debt, DebtInput, DebtPayment, DebtPaymentInput } from './types'

export async function fetchDebts(): Promise<Debt[]> {
  const { data, error } = await supabase.from('debts').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createDebt(userId: string, input: DebtInput): Promise<Debt> {
  const { data, error } = await supabase
    .from('debts')
    .insert({ user_id: userId, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateDebt(id: string, input: DebtInput): Promise<Debt> {
  const { data, error } = await supabase
    .from('debts')
    .update({
      name: input.name,
      original_amount: input.original_amount,
      installments_count: input.installments_count,
      start_date: input.start_date,
      note: input.note,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDebt(id: string): Promise<void> {
  const { error } = await supabase.from('debts').delete().eq('id', id)
  if (error) throw error
}

export async function fetchDebtPayments(debtId: string): Promise<DebtPayment[]> {
  const { data, error } = await supabase
    .from('debt_payments')
    .select('*')
    .eq('debt_id', debtId)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

// Todos los pagos de TODAS las deudas del usuario, sin filtro por deuda:
// hace falta para el balance total de Resumen (ver src/lib/balanceOverview.ts),
// que necesita el pendiente agregado de todas las deudas de una sola vez.
export async function fetchAllDebtPayments(): Promise<DebtPayment[]> {
  const { data, error } = await supabase
    .from('debt_payments')
    .select('*')
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function createDebtPayment(debtId: string, input: DebtPaymentInput): Promise<DebtPayment> {
  const { data, error } = await supabase.rpc('create_debt_payment', {
    p_debt_id: debtId,
    p_date: input.date,
    p_amount: input.amount,
    p_source: input.source,
    p_note: input.note,
  })
  if (error) throw error
  return data
}

export async function deleteDebtPayment(paymentId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_debt_payment', { p_payment_id: paymentId })
  if (error) throw error
}
