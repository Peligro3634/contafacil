import type { FixedExpense, FixedExpenseEntry, IncomeEntry, IncomeSource, VariableExpense } from './types'

export interface BreakdownItem {
  label: string
  amount: number
}

export interface DashboardTotals {
  totalIncome: number
  incomeBySource: BreakdownItem[]
  totalFixed: number
  totalVariable: number
  totalCards: number
  totalExpenses: number
  available: number
  expenseBreakdown: BreakdownItem[]
}

export function computeDashboardTotals(
  sources: IncomeSource[],
  entries: IncomeEntry[],
  fixedExpenses: FixedExpense[],
  fixedEntries: FixedExpenseEntry[],
  variableExpenses: VariableExpense[],
  // Gastos de tarjetas de credito que VENCEN en el mes del dashboard (ya
  // resueltos por cardExpenseBreakdown a partir del mes de cierre
  // correspondiente): se suman a totalExpenses/available igual que cualquier
  // otro gasto, sin un calculo paralelo.
  cardExpenses: BreakdownItem[] = [],
): DashboardTotals {
  const sourceNameById = new Map(sources.map((source) => [source.id, source.name]))
  const incomeBySourceMap = new Map<string, number>()
  let totalIncome = 0
  for (const entry of entries) {
    const amount = entry.base_amount + entry.extra_amount
    totalIncome += amount
    incomeBySourceMap.set(entry.income_source_id, (incomeBySourceMap.get(entry.income_source_id) ?? 0) + amount)
  }
  const incomeBySource = [...incomeBySourceMap.entries()]
    .map(([id, amount]) => ({ label: sourceNameById.get(id) ?? 'Fuente eliminada', amount }))
    .sort((a, b) => b.amount - a.amount)

  const fixedNameById = new Map(fixedExpenses.map((expense) => [expense.id, expense.name]))
  let totalFixed = 0
  const fixedBreakdown: BreakdownItem[] = []
  for (const entry of fixedEntries) {
    totalFixed += entry.amount
    fixedBreakdown.push({ label: fixedNameById.get(entry.fixed_expense_id) ?? 'Gasto fijo', amount: entry.amount })
  }

  const variableByCategoryMap = new Map<string, number>()
  let totalVariable = 0
  for (const expense of variableExpenses) {
    totalVariable += expense.amount
    variableByCategoryMap.set(expense.category, (variableByCategoryMap.get(expense.category) ?? 0) + expense.amount)
  }
  const variableBreakdown = [...variableByCategoryMap.entries()].map(([label, amount]) => ({ label, amount }))

  const totalCards = cardExpenses.reduce((sum, item) => sum + item.amount, 0)
  const expenseBreakdown = [...fixedBreakdown, ...variableBreakdown, ...cardExpenses].sort(
    (a, b) => b.amount - a.amount,
  )
  const totalExpenses = totalFixed + totalVariable + totalCards

  return {
    totalIncome,
    incomeBySource,
    totalFixed,
    totalVariable,
    totalCards,
    totalExpenses,
    available: totalIncome - totalExpenses,
    expenseBreakdown,
  }
}
