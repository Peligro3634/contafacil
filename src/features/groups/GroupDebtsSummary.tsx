import { formatCurrency } from '@/lib/format'
import type { DebtBalance } from './aggregate'
import type { GroupMember } from './types'

// Solo muestra el saldo neto "quién le debe a quién" a partir de los gastos
// 'personal' cargados hasta ahora — no hay forma de marcar una deuda como
// saldada (eso queda para una fase futura si hace falta).
export function GroupDebtsSummary({ debts, members }: { debts: DebtBalance[]; members: GroupMember[] }) {
  const nameByUserId = new Map(members.map((m) => [m.user_id, m.profile?.name ?? m.profile?.email ?? 'Usuario']))

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">Quién le debe a quién</p>
      {debts.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No hay deudas pendientes entre miembros.</p>
      ) : (
        <ul className="mt-2 flex flex-col divide-y divide-slate-100">
          {debts.map((debt) => (
            <li key={`${debt.fromUserId}-${debt.toUserId}`} className="flex items-center justify-between py-2 text-sm">
              <span>
                <span className="font-medium">{nameByUserId.get(debt.fromUserId) ?? 'Usuario'}</span> le debe a{' '}
                <span className="font-medium">{nameByUserId.get(debt.toUserId) ?? 'Usuario'}</span>
              </span>
              <span className="font-medium">{formatCurrency(debt.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
