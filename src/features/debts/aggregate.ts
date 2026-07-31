import type { Debt, DebtPayment } from './types'

export interface DebtStatus {
  debt: Debt
  pagado: number
  pendiente: number
  progresoPct: number
  cuotaSugerida: number | null
  pagada: boolean
}

// pendiente/pagado se derivan siempre del ledger de pagos (nunca se guardan
// en la tabla debts): evita que la base y la UI queden desincronizadas si un
// pago se borra o se registra parcial. cuotaSugerida es solo informativa
// (original_amount / installments_count), los pagos reales no estan atados a
// un cronograma fijo — se puede pagar de mas, de menos, o en cualquier orden.
export function computeDebtStatus(debt: Debt, payments: DebtPayment[]): DebtStatus {
  const pagado = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const pendiente = Math.max(debt.original_amount - pagado, 0)

  return {
    debt,
    pagado,
    pendiente,
    progresoPct: debt.original_amount > 0 ? Math.min(100, (pagado / debt.original_amount) * 100) : 0,
    cuotaSugerida: debt.installments_count ? debt.original_amount / debt.installments_count : null,
    pagada: pendiente === 0,
  }
}

export interface DebtsSummary {
  totalOriginal: number
  totalPagado: number
  totalPendiente: number
  activasCount: number
}

export function computeDebtsSummary(statuses: DebtStatus[]): DebtsSummary {
  return statuses.reduce(
    (acc, status) => ({
      totalOriginal: acc.totalOriginal + status.debt.original_amount,
      totalPagado: acc.totalPagado + status.pagado,
      totalPendiente: acc.totalPendiente + status.pendiente,
      activasCount: acc.activasCount + (status.pagada ? 0 : 1),
    }),
    { totalOriginal: 0, totalPagado: 0, totalPendiente: 0, activasCount: 0 },
  )
}
