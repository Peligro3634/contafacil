import { formatCurrency } from '@/lib/format'
import type { VariableExpense } from './types'

export function VariableExpenseList({
  expenses,
  onDelete,
}: {
  expenses: VariableExpense[]
  onDelete: (id: string) => Promise<void>
}) {
  if (expenses.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no cargaste gastos variables este mes.</p>
  }

  return (
    <ul className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4">
      {expenses.map((expense) => (
        <li key={expense.id} className="flex items-center justify-between py-3">
          <span className="text-sm">{expense.category}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{formatCurrency(expense.amount)}</span>
            <button onClick={() => onDelete(expense.id)} className="text-sm text-red-600 underline">
              Eliminar
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
