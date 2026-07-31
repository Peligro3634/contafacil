import { fetchInstallmentsBetween } from '@/features/cards/api'
import { fetchBusinessExpensesFrom } from '@/features/investments/api'
import { fetchMyGroupPersonalExpensesFrom } from '@/features/groups/api'
import { fetchFixedExpenseEntriesFrom, fetchIncomeEntries, fetchVariableExpensesFrom } from '@/features/personal/api'
import { supabase } from '@/lib/supabase'
import { closingPeriodForDueMonth } from '@/features/cards/aggregate'
import { currentMonthKey, monthKeyFromDate, shiftMonth } from '@/lib/month'
import type { Database } from './database.types'

export type CashBalanceBaseline = Database['public']['Tables']['cash_balance_baseline']['Row']

export interface CashBalanceBaselineInput {
  initial_amount: number
  initial_date: string
}

export async function fetchCashBalanceBaseline(): Promise<CashBalanceBaseline | null> {
  const { data, error } = await supabase.from('cash_balance_baseline').select('*').maybeSingle()
  if (error) throw error
  return data
}

export async function upsertCashBalanceBaseline(
  userId: string,
  input: CashBalanceBaselineInput,
): Promise<CashBalanceBaseline> {
  const { data, error } = await supabase
    .from('cash_balance_baseline')
    .upsert({ user_id: userId, ...input, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

// Fondo general = saldo inicial + (ingresos - gastos) de TODO el rango desde
// el mes del saldo inicial hasta hoy, calculado de una sola pasada (no mes a
// mes como loadDashboardHistory) porque acá no hace falta el desglose por
// mes, solo el total. Las cuotas de tarjeta se acotan hasta el periodo de
// cierre actual (closingPeriodForDueMonth) para no contar cuotas futuras que
// todavia no vencieron -- esas ya estan en "Tarjetas pendientes" del balance
// (ver balanceOverview.ts), contarlas aca tambien seria duplicar el gasto.
export async function loadFondoGeneral(userId: string): Promise<number | null> {
  const baseline = await fetchCashBalanceBaseline()
  if (!baseline) return null

  const fromMonth = monthKeyFromDate(baseline.initial_date)
  const currentMonth = currentMonthKey()
  const currentClosingPeriod = closingPeriodForDueMonth(currentMonth)

  const [incomeEntries, fixedEntries, variableExpenses, businessExpenses, groupExpenses, installments] =
    await Promise.all([
      fetchIncomeEntries(baseline.initial_date, shiftMonth(currentMonth, 1)),
      fetchFixedExpenseEntriesFrom(fromMonth),
      fetchVariableExpensesFrom(fromMonth),
      fetchBusinessExpensesFrom(fromMonth),
      fetchMyGroupPersonalExpensesFrom(userId, fromMonth),
      fetchInstallmentsBetween(fromMonth, currentClosingPeriod),
    ])

  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.base_amount + entry.extra_amount, 0)
  const totalExpenses =
    fixedEntries.reduce((sum, entry) => sum + entry.amount, 0) +
    variableExpenses.reduce((sum, expense) => sum + expense.amount, 0) +
    businessExpenses.reduce((sum, expense) => sum + expense.amount, 0) +
    groupExpenses.reduce((sum, expense) => sum + expense.amount, 0) +
    installments.reduce((sum, installment) => sum + installment.amount, 0)

  return baseline.initial_amount + totalIncome - totalExpenses
}
