import { Link } from 'react-router-dom'
import type { BalanceOverview } from '@/lib/balanceOverview'
import type { CashBalanceBaseline, CashBalanceBaselineInput } from '@/lib/cashBalance'
import type { MonthlyBalancePoint } from '@/lib/dashboardHistory'
import { formatCurrency } from '@/lib/format'
import { BalanceOverviewCard } from './BalanceOverviewCard'
import { HistoricalBalanceChart } from './HistoricalBalanceChart'
import type { BreakdownItem, DashboardTotals } from './aggregate'

function BreakdownList({ title, items, total }: { title: string; items: BreakdownItem[]; total: number }) {
  if (items.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-2 text-xs uppercase tracking-wide text-slate-500">{title}</h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.label}>
            <div className="flex items-center justify-between text-sm">
              <span>{item.label}</span>
              <span className="font-medium">{formatCurrency(item.amount)}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-brand-navy"
                style={{ width: total > 0 ? `${Math.min(100, (item.amount / total) * 100)}%` : '0%' }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SummaryLink({
  to,
  label,
  amount,
  tone,
}: {
  to: string
  label: string
  amount: number
  tone: 'positive' | 'negative'
}) {
  return (
    <Link
      to={to}
      aria-label={`Ver detalle de ${label}: ${formatCurrency(amount)}`}
      className="min-h-11 rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
    >
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone === 'positive' ? 'text-brand-emerald' : 'text-red-600'}`}>
        {formatCurrency(amount)}
      </p>
    </Link>
  )
}

export function Dashboard({
  totals,
  overview,
  baseline,
  onSaveBaseline,
  history,
}: {
  totals: DashboardTotals
  overview: BalanceOverview | null
  baseline: CashBalanceBaseline | null
  onSaveBaseline: (input: CashBalanceBaselineInput) => Promise<void>
  history: MonthlyBalancePoint[] | null
}) {
  const isEmpty = totals.incomeBySource.length === 0 && totals.expenseBreakdown.length === 0

  return (
    <div className="flex flex-col gap-4">
      {overview && (
        <BalanceOverviewCard overview={overview} baseline={baseline} onSaveBaseline={onSaveBaseline} />
      )}
      {history && <HistoricalBalanceChart history={history} />}

      <div className="grid grid-cols-2 gap-3">
        <SummaryLink to="/personal/ingresos" label="Ingresos" amount={totals.totalIncome} tone="positive" />
        <SummaryLink to="/personal/gastos" label="Gastos" amount={totals.totalExpenses} tone="negative" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-xs uppercase tracking-wide text-slate-500">Disponible del mes</h2>
        <p
          className={`mt-1 font-heading text-3xl font-bold ${totals.available >= 0 ? 'text-brand-navy' : 'text-red-600'}`}
        >
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
