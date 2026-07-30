import type { IncomeEntry, IncomeSource } from '@/features/personal/types'
import { monthRange } from '@/lib/month'
import type { BusinessExpense, IncomeSourcePartner, Investment } from './types'

export interface BreakdownItem {
  label: string
  amount: number
}

// Estado acumulado (todo-tiempo) de recuperacion de inversion de un
// emprendimiento: capital invertido vs. utilidad neta generada hasta ahora
// (ingresos - costos del negocio). Es un calculo de largo plazo, no se acota
// a un mes — por eso no toma "month" como parametro.
export interface EmprendimientoStatus {
  incomeSource: IncomeSource
  capitalInvertido: number
  ingresosAcumulados: number
  costosAcumulados: number
  utilidadNetaAcumulada: number
  recuperado: number
  pendiente: number
  gananciaPostRecupero: number
  recuperada: boolean
  progresoPct: number
}

export interface MonthlyPnL {
  ingresosDelMes: number
  costoMercaderiaDelMes: number
  gastoOperativoDelMes: number
  margenBruto: number
  utilidadDelMes: number
}

export interface ConsolidatedStatus {
  capitalInvertido: number
  recuperado: number
  pendiente: number
  gananciaPostRecupero: number
}

function sumEntries(entries: IncomeEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.base_amount + entry.extra_amount, 0)
}

export function computeEmprendimientoStatus(
  incomeSource: IncomeSource,
  investments: Investment[],
  entries: IncomeEntry[],
  expenses: BusinessExpense[],
): EmprendimientoStatus {
  const capitalInvertido = investments.reduce((sum, investment) => sum + investment.amount, 0)
  const ingresosAcumulados = sumEntries(entries)
  const costosAcumulados = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const utilidadNetaAcumulada = ingresosAcumulados - costosAcumulados
  const recuperado = Math.min(Math.max(utilidadNetaAcumulada, 0), capitalInvertido)

  return {
    incomeSource,
    capitalInvertido,
    ingresosAcumulados,
    costosAcumulados,
    utilidadNetaAcumulada,
    recuperado,
    pendiente: Math.max(capitalInvertido - utilidadNetaAcumulada, 0),
    gananciaPostRecupero: Math.max(utilidadNetaAcumulada - capitalInvertido, 0),
    recuperada: capitalInvertido > 0 && utilidadNetaAcumulada >= capitalInvertido,
    progresoPct: capitalInvertido > 0 ? Math.min(100, (recuperado / capitalInvertido) * 100) : 0,
  }
}

export function computeMonthlyPnL(entries: IncomeEntry[], expenses: BusinessExpense[], month: string): MonthlyPnL {
  const { start, end } = monthRange(month)
  const entriesDelMes = entries.filter((entry) => entry.date >= start && entry.date < end)
  const expensesDelMes = expenses.filter((expense) => expense.month === month)

  const ingresosDelMes = sumEntries(entriesDelMes)
  const costoMercaderiaDelMes = expensesDelMes
    .filter((expense) => expense.type === 'costo_mercaderia')
    .reduce((sum, expense) => sum + expense.amount, 0)
  const gastoOperativoDelMes = expensesDelMes
    .filter((expense) => expense.type === 'gasto_operativo')
    .reduce((sum, expense) => sum + expense.amount, 0)
  const margenBruto = ingresosDelMes - costoMercaderiaDelMes

  return {
    ingresosDelMes,
    costoMercaderiaDelMes,
    gastoOperativoDelMes,
    margenBruto,
    utilidadDelMes: margenBruto - gastoOperativoDelMes,
  }
}

export function computeConsolidatedStatus(statuses: EmprendimientoStatus[]): ConsolidatedStatus {
  return statuses.reduce(
    (acc, status) => ({
      capitalInvertido: acc.capitalInvertido + status.capitalInvertido,
      recuperado: acc.recuperado + status.recuperado,
      pendiente: acc.pendiente + status.pendiente,
      gananciaPostRecupero: acc.gananciaPostRecupero + status.gananciaPostRecupero,
    }),
    { capitalInvertido: 0, recuperado: 0, pendiente: 0, gananciaPostRecupero: 0 },
  )
}

export interface PartnerShare {
  userId: string
  participacionPct: number
  aporteInicial: number
  recuperado: number
  gananciaPostRecupero: number
}

// Reparte recuperado/gananciaPostRecupero de un emprendimiento de grupo
// entre sus socios segun participacion_pct — ese % es fijo (pactado al
// crear el emprendimiento, ver create_group_income_source) y es lo que
// manda para el reparto; aporte_inicial es solo informativo.
export function computePartnerShares(status: EmprendimientoStatus, partners: IncomeSourcePartner[]): PartnerShare[] {
  return partners.map((partner) => ({
    userId: partner.user_id,
    participacionPct: partner.participacion_pct,
    aporteInicial: partner.aporte_inicial,
    recuperado: (status.recuperado * partner.participacion_pct) / 100,
    gananciaPostRecupero: (status.gananciaPostRecupero * partner.participacion_pct) / 100,
  }))
}

// Costos de negocio de "month" agrupados por emprendimiento: lo que se suma
// al dashboard personal (ver computeDashboardTotals en features/personal).
export function businessExpenseBreakdown(sources: IncomeSource[], expenses: BusinessExpense[]): BreakdownItem[] {
  const nameById = new Map(sources.map((source) => [source.id, source.name]))
  const totals = new Map<string, number>()
  for (const expense of expenses) {
    totals.set(expense.income_source_id, (totals.get(expense.income_source_id) ?? 0) + expense.amount)
  }
  return [...totals.entries()].map(([sourceId, amount]) => ({
    label: nameById.get(sourceId) ?? 'Emprendimiento eliminado',
    amount,
  }))
}
