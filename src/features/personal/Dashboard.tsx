import { formatCurrency } from '@/lib/format'
import type { BreakdownItem, DashboardTotals } from './aggregate'

function BreakdownList({ title, items, total }: { title: string; items: BreakdownItem[]; total: number }) {
  if (items.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.label}>
            <div className="flex items-center justify-between text-sm">
              <span>{item.label}</span>
              <span className="font-medium">{formatCurrency(item.amount)}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-slate-900"
                style={{ width: total > 0 ? `${Math.min(100, (item.amount / total) * 100)}%` : '0%' }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Dashboard({ totals }: { totals: DashboardTotals }) {
  const isEmpty = totals.incomeBySource.length === 0 && totals.expenseBreakdown.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Ingresos</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600">{formatCurrency(totals.totalIncome)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Gastos</p>
          <p className="mt-1 text-lg font-semibold text-red-600">{formatCurrency(totals.totalExpenses)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Disponible del mes</p>
        <p className={`mt-1 text-2xl font-semibold ${totals.available >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
          {formatCurrency(totals.available)}
        </p>
      </div>

      <BreakdownList title="Ingresos por fuente" items={totals.incomeBySource} total={totals.totalIncome} />
      <BreakdownList title="Gastos por categoría" items={totals.expenseBreakdown} total={totals.totalExpenses} />

      {isEmpty && (
        <p className="text-sm text-slate-500">Todavía no cargaste ingresos ni gastos para este mes.</p>
      )}
    </div>
  )
}
