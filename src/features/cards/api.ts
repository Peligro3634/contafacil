import { supabase } from '@/lib/supabase'
import type { CardPurchase, CardPurchaseInput, CardPurchaseInstallment, CreditCard, CreditCardInput } from './types'

export async function fetchCreditCards(): Promise<CreditCard[]> {
  const { data, error } = await supabase.from('credit_cards').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createCreditCard(userId: string, input: CreditCardInput): Promise<CreditCard> {
  const { data, error } = await supabase
    .from('credit_cards')
    .insert({ user_id: userId, name: input.name, closing_day: input.closing_day, due_day: input.due_day })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCreditCard(id: string, input: CreditCardInput): Promise<CreditCard> {
  const { data, error } = await supabase
    .from('credit_cards')
    .update({ name: input.name, closing_day: input.closing_day, due_day: input.due_day })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchCardPurchasesByIds(ids: string[]): Promise<CardPurchase[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase.from('card_purchases').select('*').in('id', ids)
  if (error) throw error
  return data
}

export async function createCardPurchase(creditCardId: string, input: CardPurchaseInput): Promise<CardPurchase> {
  const { data, error } = await supabase.rpc('create_card_purchase', {
    p_credit_card_id: creditCardId,
    p_date: input.date,
    p_amount_total: input.amount_total,
    p_description: input.description,
    p_installments_count: input.installments_count,
    p_paid_installments_count: input.paid_installments_count ?? 0,
  })
  if (error) throw error
  return data
}

export async function deleteCardPurchase(purchaseId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_card_purchase', { p_purchase_id: purchaseId })
  if (error) throw error
}

// Cuotas cuyo mes de CIERRE/resumen es "month" (no el de vencimiento). RLS ya
// filtra a tarjetas del usuario autenticado.
export async function fetchInstallmentsForPeriod(period: string): Promise<CardPurchaseInstallment[]> {
  const { data, error } = await supabase.from('card_purchase_installments').select('*').eq('month', period)
  if (error) throw error
  return data
}

// Todas las cuotas de TODAS las tarjetas cuyo mes de cierre todavia no paso
// (>= fromPeriod), sin importar el mes seleccionado en el dashboard: hace
// falta para el balance total de Resumen (ver src/lib/balanceOverview.ts),
// que necesita el total de compromisos futuros de tarjeta de una sola vez.
export async function fetchPendingInstallmentsFrom(fromPeriod: string): Promise<CardPurchaseInstallment[]> {
  const { data, error } = await supabase.from('card_purchase_installments').select('*').gte('month', fromPeriod)
  if (error) throw error
  return data
}

// Cuotas de TODAS las tarjetas cuyo mes de cierre ya vencio, entre fromPeriod
// y toPeriod (ambos inclusive): hace falta para el fondo general (ver
// src/lib/cashBalance.ts), que solo debe contar cuotas que ya impactaron el
// disponible de algun mes pasado -- las futuras siguen en
// fetchPendingInstallmentsFrom, no se cuentan dos veces.
export async function fetchInstallmentsBetween(
  fromPeriod: string,
  toPeriod: string,
): Promise<CardPurchaseInstallment[]> {
  const { data, error } = await supabase
    .from('card_purchase_installments')
    .select('*')
    .gte('month', fromPeriod)
    .lte('month', toPeriod)
  if (error) throw error
  return data
}
