import { formatCurrency } from '@/lib/format'
import type { PortfolioSummary } from './aggregate'

export function PortfolioSummaryCard({ summary }: { summary: PortfolioSummary }) {
  if (summary.capitalInvertido === 0 && summary.valorActual === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Cartera — resumen consolidado</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500">Capital invertido</p>
          <p className="font-semibold">{formatCurrency(summary.capitalInvertido)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Valor actual</p>
          <p className="font-semibold">{formatCurrency(summary.valorActual)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-slate-500">Ganancia / pérdida</p>
          <p className={`font-semibold ${summary.gananciaPerdida >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(summary.gananciaPerdida)} ({summary.gananciaPct >= 0 ? '+' : ''}
            {summary.gananciaPct.toFixed(1)}%)
          </p>
        </div>
      </div>
    </div>
  )
}
