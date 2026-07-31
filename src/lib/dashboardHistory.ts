import { loadDashboardTotals } from '@/lib/dashboard'
import { currentMonthKey, monthLabel, shiftMonth } from '@/lib/month'

export interface MonthlyBalancePoint {
  month: string
  label: string
  ingresos: number
  gastos: number
  disponible: number
  disponibleAcumulado: number
}

// Reutiliza loadDashboardTotals (ya trae ingresos/gastos/tarjetas/negocio/
// grupo consolidados por mes) para los ultimos "monthsBack" meses, sin
// duplicar logica de agregacion. disponibleAcumulado es la suma corriente
// del disponible mes a mes, para mostrar la tendencia del balance en el
// tiempo (no un patrimonio total, ver balanceOverview.ts para eso).
export async function loadDashboardHistory(userId: string, monthsBack = 6): Promise<MonthlyBalancePoint[]> {
  const current = currentMonthKey()
  const months = Array.from({ length: monthsBack }, (_, i) => shiftMonth(current, -(monthsBack - 1 - i)))

  const totalsByMonth = await Promise.all(months.map((month) => loadDashboardTotals(month, userId)))

  let acumulado = 0
  return months.map((month, i) => {
    const totals = totalsByMonth[i]
    acumulado += totals.available
    return {
      month,
      label: monthLabel(month),
      ingresos: totals.totalIncome,
      gastos: totals.totalExpenses,
      disponible: totals.available,
      disponibleAcumulado: acumulado,
    }
  })
}
