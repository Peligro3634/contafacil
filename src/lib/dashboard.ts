import { cardExpenseBreakdown, closingPeriodForDueMonth } from '@/features/cards/aggregate'
import { fetchCreditCards, fetchInstallmentsForPeriod, fetchOutstandingInstallments } from '@/features/cards/api'
import { fetchAllGoalContributions } from '@/features/goals/api'
import { groupExpenseBreakdown } from '@/features/groups/aggregate'
import { fetchMyGroupPersonalExpensesForMonth, fetchMyGroups } from '@/features/groups/api'
import { businessExpenseBreakdown } from '@/features/investments/aggregate'
import { fetchBusinessExpensesForMonth } from '@/features/investments/api'
import { computeDashboardTotals, type DashboardTotals } from '@/features/personal/aggregate'
import {
  fetchFixedExpenseEntries,
  fetchFixedExpenses,
  fetchIncomeEntries,
  fetchIncomeSources,
  fetchVariableExpenses,
} from '@/features/personal/api'
import { computeWealthBreakdown, type WealthBreakdown } from '@/features/personal/wealth'
import { fetchPortfolio } from '@/features/portfolio/api'
import { currentMonthKey, monthRange, shiftMonth } from '@/lib/month'

// Compone el dashboard personal completo (ingresos + gastos fijos/variables
// + tarjetas + emprendimientos + gastos de grupo pagados de bolsillo propio)
// para un mes dado. Centralizado aca porque mas de una pantalla necesita el
// mismo "disponible del mes" (dashboard personal y la comparacion de cuota
// sugerida en la pantalla de Metas).
export async function loadDashboardTotals(month: string, userId: string): Promise<DashboardTotals> {
  const { start, end } = monthRange(month)

  const [
    sources,
    entries,
    fixedExpenses,
    fixedEntries,
    variableExpenses,
    cards,
    installments,
    businessExpenses,
    myGroups,
    groupPersonalExpenses,
  ] = await Promise.all([
    fetchIncomeSources(),
    fetchIncomeEntries(start, end),
    fetchFixedExpenses(),
    fetchFixedExpenseEntries(month),
    fetchVariableExpenses(month),
    fetchCreditCards(),
    fetchInstallmentsForPeriod(closingPeriodForDueMonth(month)),
    fetchBusinessExpensesForMonth(month),
    fetchMyGroups(),
    fetchMyGroupPersonalExpensesForMonth(userId, month),
  ])

  return computeDashboardTotals(
    sources,
    entries,
    fixedExpenses,
    fixedEntries,
    variableExpenses,
    cardExpenseBreakdown(cards, installments),
    businessExpenseBreakdown(sources, businessExpenses),
    groupExpenseBreakdown(myGroups, groupPersonalExpenses),
  )
}

// Foto del patrimonio actual (ahorrado + invertido − deudas), independiente
// del mes seleccionado: es un estado presente, no un registro mensual. La
// deuda pendiente arranca en el resumen que vence este mes (cierre = mes
// actual − 1) hacia adelante.
export async function loadWealthBreakdown(): Promise<WealthBreakdown> {
  const fromPeriod = closingPeriodForDueMonth(currentMonthKey())

  const [portfolio, goalContributions, installments] = await Promise.all([
    fetchPortfolio(),
    fetchAllGoalContributions(),
    fetchOutstandingInstallments(fromPeriod),
  ])

  return computeWealthBreakdown(portfolio, goalContributions, installments)
}

export interface BalancePoint {
  month: string
  available: number
}

// Serie de "disponible del mes" (ingresos − gastos) de los últimos
// `monthsBack` meses hasta `endMonth` inclusive, para graficar el
// comportamiento histórico. Reusa loadDashboardTotals por mes (mismo cálculo
// que el resumen) y corre los meses en paralelo.
export async function loadBalanceHistory(
  endMonth: string,
  userId: string,
  monthsBack = 6,
): Promise<BalancePoint[]> {
  const months: string[] = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    months.push(shiftMonth(endMonth, -i))
  }

  const totals = await Promise.all(months.map((month) => loadDashboardTotals(month, userId)))

  return months.map((month, index) => ({ month, available: totals[index].available }))
}
