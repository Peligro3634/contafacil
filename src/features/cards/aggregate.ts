import { shiftMonth } from '@/lib/month'
import type { CardPurchase, CardPurchaseInstallment, CreditCard } from './types'

export interface BreakdownItem {
  label: string
  amount: number
}

export interface CardStatementLine {
  purchaseId: string
  description: string
  date: string
  installmentNumber: number
  installmentsCount: number
  amount: number
}

export interface CardStatement {
  card: CreditCard
  total: number
  lines: CardStatementLine[]
}

// due_month de una cuota = mes de cierre ("month") + 1: convencion estandar
// de tarjeta (el resumen que cierra en M vence en M+1). No se guarda en la
// base, se deriva aca para no duplicar el dato.
export function closingPeriodForDueMonth(dueMonth: string): string {
  return shiftMonth(dueMonth, -1)
}

// Arma, por tarjeta, el total y detalle de compras/cuotas que vencen en el
// mes seleccionado (installments cuyo mes de cierre ya se resolvio afuera
// con closingPeriodForDueMonth).
export function computeCardStatements(
  cards: CreditCard[],
  installments: CardPurchaseInstallment[],
  purchases: CardPurchase[],
): CardStatement[] {
  const purchaseById = new Map(purchases.map((p) => [p.id, p]))
  const linesByCard = new Map<string, CardStatementLine[]>()

  for (const inst of installments) {
    const purchase = purchaseById.get(inst.card_purchase_id)
    if (!purchase) continue
    const line: CardStatementLine = {
      purchaseId: purchase.id,
      description: purchase.description,
      date: purchase.date,
      installmentNumber: inst.installment_number,
      installmentsCount: purchase.installments_count,
      amount: inst.amount,
    }
    const list = linesByCard.get(inst.credit_card_id) ?? []
    list.push(line)
    linesByCard.set(inst.credit_card_id, list)
  }

  return cards.map((card) => {
    const lines = (linesByCard.get(card.id) ?? []).sort((a, b) => a.date.localeCompare(b.date))
    return { card, total: lines.reduce((sum, line) => sum + line.amount, 0), lines }
  })
}

export function cardExpenseBreakdown(cards: CreditCard[], installments: CardPurchaseInstallment[]): BreakdownItem[] {
  const nameById = new Map(cards.map((c) => [c.id, c.name]))
  const totals = new Map<string, number>()
  for (const inst of installments) {
    totals.set(inst.credit_card_id, (totals.get(inst.credit_card_id) ?? 0) + inst.amount)
  }
  return [...totals.entries()].map(([cardId, amount]) => ({
    label: nameById.get(cardId) ?? 'Tarjeta eliminada',
    amount,
  }))
}
