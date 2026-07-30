import { monthKeyFromDate, monthsBetween } from '@/lib/month'
import type { FundContribution, Group, GroupExpense, GroupExpenseShare, GroupGoal, GroupGoalContribution } from './types'

export interface BreakdownItem {
  label: string
  amount: number
}

export interface GroupGoalStatus {
  goal: GroupGoal
  ahorrado: number
  pendiente: number
  mesesRestantes: number
  cuotaMensualSugerida: number
  cuotaPorMiembro: number
  progresoPct: number
  cumplida: boolean
  vencida: boolean
}

// Mismo calculo que computeGoalStatus (features/goals/aggregate.ts) para el
// total de la meta, mas cuotaPorMiembro: la cuota mensual sugerida repartida
// en partes iguales entre los miembros ACTUALES del grupo, calculada en vivo
// (no se guarda ningun reparto — si entra/sale gente del grupo, el reparto
// del mes actual en adelante se recalcula solo).
export function computeGroupGoalStatus(
  goal: GroupGoal,
  contributions: GroupGoalContribution[],
  memberCount: number,
  currentMonth: string,
): GroupGoalStatus {
  const ahorrado = contributions.reduce((sum, c) => sum + c.amount, 0)
  const pendiente = Math.max(goal.target_amount - ahorrado, 0)
  const cumplida = pendiente === 0

  const targetMonth = monthKeyFromDate(goal.target_date)
  const monthsRaw = monthsBetween(currentMonth, targetMonth)
  const vencida = !cumplida && monthsRaw <= 0
  const mesesRestantes = Math.max(monthsRaw, 1)
  const cuotaMensualSugerida = cumplida ? 0 : pendiente / mesesRestantes

  return {
    goal,
    ahorrado,
    pendiente,
    mesesRestantes,
    cuotaMensualSugerida,
    cuotaPorMiembro: memberCount > 0 ? cuotaMensualSugerida / memberCount : 0,
    progresoPct: goal.target_amount > 0 ? Math.min(100, (ahorrado / goal.target_amount) * 100) : 0,
    cumplida,
    vencida,
  }
}

// Saldo del fondo comun: puramente informativo (aportes - gastos con
// source='fondo_comun'), puede quedar negativo, no hay mecanismo de retiro
// ni bloqueo de gasto.
export function computeGroupFundBalance(contributions: FundContribution[], expenses: GroupExpense[]): number {
  const aportado = contributions.reduce((sum, c) => sum + c.amount, 0)
  const gastado = expenses
    .filter((expense) => expense.source === 'fondo_comun')
    .reduce((sum, expense) => sum + expense.amount, 0)
  return aportado - gastado
}

export interface DebtBalance {
  fromUserId: string
  toUserId: string
  amount: number
}

// Deudas entre miembros a partir de los gastos 'personal' y su reparto
// (group_expense_shares). Por cada share que no sea del propio pagador, el
// participante le debe esa parte al pagador; se neta por par de personas
// (si A le debe a B por un gasto y B le debe a A por otro, se muestra un
// unico saldo neto entre los dos) pero NO se resuelve deuda triangular entre
// mas de dos personas (ej. A->B->C no se simplifica a A->C) — alcance
// acotado a "informativo", sin registrar pagos/liquidaciones.
export function computeGroupDebts(
  expenses: GroupExpense[],
  sharesByExpenseId: Map<string, GroupExpenseShare[]>,
): DebtBalance[] {
  const owed = new Map<string, number>()

  for (const expense of expenses) {
    if (expense.source !== 'personal') continue
    const shares = sharesByExpenseId.get(expense.id) ?? []
    for (const share of shares) {
      if (share.user_id === expense.paid_by_user_id) continue
      const key = `${share.user_id}::${expense.paid_by_user_id}`
      owed.set(key, (owed.get(key) ?? 0) + share.amount)
    }
  }

  const seenPairs = new Set<string>()
  const balances: DebtBalance[] = []

  for (const key of owed.keys()) {
    const [a, b] = key.split('::')
    const pairKey = [a, b].sort().join('::')
    if (seenPairs.has(pairKey)) continue
    seenPairs.add(pairKey)

    const aOwesB = owed.get(`${a}::${b}`) ?? 0
    const bOwesA = owed.get(`${b}::${a}`) ?? 0
    const net = Math.round((aOwesB - bOwesA) * 100) / 100

    if (net > 0) balances.push({ fromUserId: a, toUserId: b, amount: net })
    else if (net < 0) balances.push({ fromUserId: b, toUserId: a, amount: -net })
  }

  return balances
}

// Gastos 'personal' de grupo pagados por un usuario, agrupados por grupo:
// lo que consume el dashboard personal para restar del disponible (ver
// computeDashboardTotals en features/personal/aggregate.ts).
export function groupExpenseBreakdown(groups: Group[], expenses: GroupExpense[]): BreakdownItem[] {
  const nameById = new Map(groups.map((group) => [group.id, group.name]))
  const totals = new Map<string, number>()
  for (const expense of expenses) {
    totals.set(expense.group_id, (totals.get(expense.group_id) ?? 0) + expense.amount)
  }
  return [...totals.entries()].map(([groupId, amount]) => ({
    label: nameById.get(groupId) ?? 'Grupo eliminado',
    amount,
  }))
}
