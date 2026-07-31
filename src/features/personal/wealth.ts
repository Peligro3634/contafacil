import type { CardPurchaseInstallment } from '@/features/cards/types'
import type { GoalContribution } from '@/features/goals/types'
import type { PortfolioItem } from '@/features/portfolio/types'

export interface WealthBreakdown {
  // Aportes acumulados a metas de ahorro (todo-tiempo).
  ahorrado: number
  // Valor actual de la cartera de inversiones (no el capital de compra: lo
  // que vale hoy).
  invertido: number
  // Cuotas de tarjeta todavía pendientes (resumen que vence este mes en
  // adelante): lo que falta pagar / "recuperar".
  deudas: number
  // Patrimonio neto = lo que tengo (ahorrado + invertido) menos lo que debo.
  balanceTotal: number
}

// Foto del patrimonio HOY (no acotada a un mes, a diferencia del "disponible
// del mes"): junta lo ahorrado en metas y el valor actual de la cartera, y le
// resta la deuda de tarjeta que todavía no se pagó. Es el número que el
// resumen mensual por sí solo no deja ver.
export function computeWealthBreakdown(
  portfolio: PortfolioItem[],
  goalContributions: GoalContribution[],
  outstandingInstallments: CardPurchaseInstallment[],
): WealthBreakdown {
  const invertido = portfolio.reduce((sum, item) => sum + item.current_value, 0)
  const ahorrado = goalContributions.reduce((sum, contribution) => sum + contribution.amount, 0)
  const deudas = outstandingInstallments.reduce((sum, installment) => sum + installment.amount, 0)

  return {
    ahorrado,
    invertido,
    deudas,
    balanceTotal: ahorrado + invertido - deudas,
  }
}
