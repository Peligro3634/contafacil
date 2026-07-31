import { formatCurrency } from '@/lib/format'
import type { DebtsSummary } from './aggregate'

export function DebtsSummaryCard({ summary }: { summary: DebtsSummary }) {
  if (summary.totalOriginal === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Deudas — resumen consolidado</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500">Monto original</p>
          <p className="font-semibold">{formatCurrency(summary.totalOriginal)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Pagado</p>
          <p className="font-semibold text-brand-emerald">{formatCurrency(summary.totalPagado)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-slate-500">Pendiente ({summary.activasCount} deuda{summary.activasCount === 1 ? '' : 's'} activa{summary.activasCount === 1 ? '' : 's'})</p>
          <p className="text-2xl font-semibold text-red-600">{formatCurrency(summary.totalPendiente)}</p>
        </div>
      </div>
    </div>
  )
}
