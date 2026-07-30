import { cardExpenseBreakdown, closingPeriodForDueMonth } from '@/features/cards/aggregate'
import { fetchCreditCards, fetchInstallmentsForPeriod } from '@/features/cards/api'
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
import { monthRange } from '@/lib/month'

// Compone el dashboard personal completo (ingresos + gastos fijos/variables
// + tarjetas + emprendimientos) para un mes dado. Centralizado aca porque
// mas de una pantalla necesita el mismo "disponible del mes" (dashboard
// personal y la comparacion de cuota sugerida en la pantalla de Metas).
export async function loadDashboardTotals(month: string): Promise<DashboardTotals> {
  const { start, end } = monthRange(month)

  const [sources, entries, fixedExpenses, fixedEntries, variableExpenses, cards, installments, businessExpenses] =
    await Promise.all([
      fetchIncomeSources(),
      fetchIncomeEntries(start, end),
      fetchFixedExpenses(),
      fetchFixedExpenseEntries(month),
      fetchVariableExpenses(month),
      fetchCreditCards(),
      fetchInstallmentsForPeriod(closingPeriodForDueMonth(month)),
      fetchBusinessExpensesForMonth(month),
    ])

  return computeDashboardTotals(
    sources,
    entries,
    fixedExpenses,
    fixedEntries,
    variableExpenses,
    cardExpenseBreakdown(cards, installments),
    businessExpenseBreakdown(sources, businessExpenses),
  )
}
