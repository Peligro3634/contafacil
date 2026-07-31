import { Link } from 'react-router-dom'
import { formatCurrency } from '@/lib/format'
import type { WealthBreakdown } from './wealth'

function BreakdownRow({
  to,
  label,
  hint,
  amount,
  tone,
}: {
  to: string
  label: string
  hint: string
  amount: number
  tone: 'emerald' | 'red' | 'slate'
}) {
  const amountColor =
    tone === 'emerald' ? 'text-emerald-600' : tone === 'red' ? 'text-red-600' : 'text-slate-900'

  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50 active:bg-slate-100"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <span className={`text-sm font-semibold ${amountColor}`}>{formatCurrency(amount)}</span>
        <span aria-hidden className="text-slate-400">
          ›
        </span>
      </span>
    </Link>
  )
}

// Resumen de patrimonio: lo que el resumen mensual no deja ver de un vistazo
// (ahorrado + invertido − deudas). Cada fila es un atajo al módulo
// correspondiente.
export function BalanceBreakdownCard({ wealth }: { wealth: WealthBreakdown }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Balance total</p>
      <p
        className={`mb-3 text-2xl font-semibold ${
          wealth.balanceTotal >= 0 ? 'text-slate-900' : 'text-red-600'
        }`}
      >
        {formatCurrency(wealth.balanceTotal)}
      </p>

      <div className="flex flex-col gap-2">
        <BreakdownRow
          to="/personal/metas"
          label="Ahorrado"
          hint="Aportes a metas"
          amount={wealth.ahorrado}
          tone="emerald"
        />
        <BreakdownRow
          to="/personal/ahorros"
          label="Invertido"
          hint="Valor actual de la cartera"
          amount={wealth.invertido}
          tone="emerald"
        />
        <BreakdownRow
          to="/personal/tarjetas"
          label="Deudas"
          hint="Cuotas de tarjeta pendientes"
          amount={wealth.deudas}
          tone="red"
        />
      </div>
    </div>
  )
}
