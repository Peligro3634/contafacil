import { formatCurrency } from '@/lib/format'
import type { ConsolidatedStatus } from './aggregate'

export function ConsolidatedSummary({ status }: { status: ConsolidatedStatus }) {
  if (status.capitalInvertido === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Emprendimientos — resumen consolidado</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500">Capital invertido</p>
          <p className="font-semibold">{formatCurrency(status.capitalInvertido)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Recuperado</p>
          <p className="font-semibold text-emerald-600">{formatCurrency(status.recuperado)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Pendiente de recuperar</p>
          <p className="font-semibold">{formatCurrency(status.pendiente)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Ganancia (post-recupero)</p>
          <p className="font-semibold text-emerald-600">{formatCurrency(status.gananciaPostRecupero)}</p>
        </div>
      </div>
    </div>
  )
}
