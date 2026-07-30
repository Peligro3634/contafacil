import { monthKeyFromDate, monthsBetween } from '@/lib/month'
import type { GoalContribution, SavingsGoal } from './types'

export interface GoalStatus {
  goal: SavingsGoal
  ahorrado: number
  pendiente: number
  mesesRestantes: number
  cuotaMensualSugerida: number
  progresoPct: number
  cumplida: boolean
  vencida: boolean
}

// cuota_mensual_sugerida = (target_amount - ahorrado) / meses_restantes,
// recalculado en vivo a partir del ledger de aportes (nada se guarda a
// mano). Si la fecha objetivo ya paso y la meta no se cumplio, meses
// restantes se pisa a 1 (hay que poner el pendiente ya, no dividirlo por un
// numero negativo o cero) y se marca "vencida" aparte para la UI.
export function computeGoalStatus(
  goal: SavingsGoal,
  contributions: GoalContribution[],
  currentMonth: string,
): GoalStatus {
  const ahorrado = contributions.reduce((sum, c) => sum + c.amount, 0)
  const pendiente = Math.max(goal.target_amount - ahorrado, 0)
  const cumplida = pendiente === 0

  const targetMonth = monthKeyFromDate(goal.target_date)
  const monthsRaw = monthsBetween(currentMonth, targetMonth)
  const vencida = !cumplida && monthsRaw <= 0
  const mesesRestantes = Math.max(monthsRaw, 1)

  return {
    goal,
    ahorrado,
    pendiente,
    mesesRestantes,
    cuotaMensualSugerida: cumplida ? 0 : pendiente / mesesRestantes,
    progresoPct: goal.target_amount > 0 ? Math.min(100, (ahorrado / goal.target_amount) * 100) : 0,
    cumplida,
    vencida,
  }
}
