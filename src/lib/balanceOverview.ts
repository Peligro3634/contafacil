import { fetchPendingInstallmentsFrom } from '@/features/cards/api'
import { computeDebtStatus } from '@/features/debts/aggregate'
import { fetchAllDebtPayments, fetchDebts } from '@/features/debts/api'
import { computeGoalStatus } from '@/features/goals/aggregate'
import { fetchGoalContributions, fetchSavingsGoals } from '@/features/goals/api'
import { computeConsolidatedStatus, computeEmprendimientoStatus } from '@/features/investments/aggregate'
import { fetchBusinessExpensesForSource, fetchInvestments } from '@/features/investments/api'
import { fetchIncomeEntriesForSource, fetchIncomeSources } from '@/features/personal/api'
import { computePortfolioItemStatus, computePortfolioSummary } from '@/features/portfolio/aggregate'
import { fetchPortfolio } from '@/features/portfolio/api'
import { loadFondoGeneral } from '@/lib/cashBalance'
import { currentMonthKey } from '@/lib/month'

export interface BalanceOverview {
  fondoGeneral: number | null
  ahorrado: number
  invertido: number
  tarjetasPendientes: number
  deudasPendientes: number
  porCobrar: number
  balanceNeto: number
}

// Balance "de hoy" (no acotado al mes seleccionado en Resumen): junta el
// estado presente de cada modulo que ya calcula sus propios totales
// (Fondo general, Metas, Ahorros/cartera, Tarjetas, Deudas, Inversiones de
// negocio) para armar un unico desglose. porCobrar (recuperacion de
// inversion de emprendimientos) queda AFUERA de balanceNeto: es capital ya
// invertido/en riesgo, no un activo liquido, asi que sumarlo sobreestimaria
// el balance — se muestra aparte solo como dato informativo. fondoGeneral es
// `null` si el usuario todavia no configuro su saldo inicial (ver
// src/lib/cashBalance.ts); en ese caso se trata como 0 en balanceNeto y la UI
// aclara que falta configurarlo.
export async function loadBalanceOverview(userId: string): Promise<BalanceOverview> {
  const currentPeriod = currentMonthKey()

  const [goals, portfolioItems, pendingInstallments, debts, debtPayments, incomeSources, fondoGeneral] =
    await Promise.all([
      fetchSavingsGoals(),
      fetchPortfolio(),
      fetchPendingInstallmentsFrom(currentPeriod),
      fetchDebts(),
      fetchAllDebtPayments(),
      fetchIncomeSources(),
      loadFondoGeneral(userId),
    ])

  const goalContributions = await Promise.all(goals.map((goal) => fetchGoalContributions(goal.id)))
  const ahorrado = goals.reduce(
    (sum, goal, i) => sum + computeGoalStatus(goal, goalContributions[i], currentPeriod).ahorrado,
    0,
  )

  const invertido = computePortfolioSummary(portfolioItems.map(computePortfolioItemStatus)).valorActual

  const tarjetasPendientes = pendingInstallments.reduce((sum, installment) => sum + installment.amount, 0)

  const paymentsByDebt = new Map<string, typeof debtPayments>()
  for (const payment of debtPayments) {
    const list = paymentsByDebt.get(payment.debt_id) ?? []
    list.push(payment)
    paymentsByDebt.set(payment.debt_id, list)
  }
  const deudasPendientes = debts.reduce(
    (sum, debt) => sum + computeDebtStatus(debt, paymentsByDebt.get(debt.id) ?? []).pendiente,
    0,
  )

  const emprendimientos = incomeSources.filter((s) => s.type === 'monotributo' || s.type === 'responsable_inscripto')
  const emprendimientoData = await Promise.all(
    emprendimientos.map(async (incomeSource) => {
      const [investments, entries, expenses] = await Promise.all([
        fetchInvestments(incomeSource.id),
        fetchIncomeEntriesForSource(incomeSource.id),
        fetchBusinessExpensesForSource(incomeSource.id),
      ])
      return computeEmprendimientoStatus(incomeSource, investments, entries, expenses)
    }),
  )
  const porCobrar = computeConsolidatedStatus(emprendimientoData).pendiente

  return {
    fondoGeneral,
    ahorrado,
    invertido,
    tarjetasPendientes,
    deudasPendientes,
    porCobrar,
    balanceNeto: (fondoGeneral ?? 0) + ahorrado + invertido - tarjetasPendientes - deudasPendientes,
  }
}
