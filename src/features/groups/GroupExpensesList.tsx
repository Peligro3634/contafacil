import { formatCurrency } from '@/lib/format'
import type { GroupExpense, GroupExpenseSource, GroupMember } from './types'

const sourceLabels: Record<GroupExpenseSource, string> = {
  fondo_comun: 'Fondo común',
  personal: 'Bolsillo personal',
}

export function GroupExpensesList({
  expenses,
  members,
  currentUserId,
  onDelete,
}: {
  expenses: GroupExpense[]
  members: GroupMember[]
  currentUserId: string
  onDelete: (id: string) => Promise<void>
}) {
  const nameByUserId = new Map(members.map((m) => [m.user_id, m.profile?.name ?? m.profile?.email ?? 'Usuario']))

  if (expenses.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no se cargó ningún gasto este mes.</p>
  }

  return (
    <ul className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white p-4">
      {expenses.map((expense) => (
        <li key={expense.id} className="flex items-center justify-between gap-2 py-2 text-sm">
          <div>
            <p className="font-medium">{expense.description}</p>
            <p className="text-slate-500">
              {sourceLabels[expense.source]} · pagó {nameByUserId.get(expense.paid_by_user_id) ?? 'Usuario'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-medium">{formatCurrency(expense.amount)}</span>
            {expense.paid_by_user_id === currentUserId && (
              <button onClick={() => onDelete(expense.id)} className="text-red-600 underline">
                Eliminar
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
