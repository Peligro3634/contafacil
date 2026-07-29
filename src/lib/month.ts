// Un "mes" se representa siempre como el primer dia, formato 'YYYY-MM-01'
// (mismo formato que la columna `month` en fixed_expense_entries /
// variable_expenses), asi sirve tanto de valor de columna como de limite
// inferior para filtrar income_entries por rango de fecha.

export function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

const MONTH_LABELS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

export function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  return `${MONTH_LABELS[month - 1]} ${year}`
}

export function monthRange(monthKey: string): { start: string; end: string } {
  return { start: monthKey, end: shiftMonth(monthKey, 1) }
}
