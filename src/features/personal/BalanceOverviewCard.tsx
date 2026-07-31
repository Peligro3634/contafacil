import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { CashBalanceBaseline, CashBalanceBaselineInput } from '@/lib/cashBalance'
import { formatCurrency } from '@/lib/format'
import type { BalanceOverview } from '@/lib/balanceOverview'
import { CashBalanceBaselineForm } from './CashBalanceBaselineForm'

function BalanceRow({
  to,
  label,
  amount,
  tone,
}: {
  to: string
  label: string
  amount: number
  tone: 'positive' | 'negative' | 'neutral'
}) {
  const toneClass = tone === 'positive' ? 'text-brand-emerald' : tone === 'negative' ? 'text-red-600' : 'text-brand-navy'

  return (
    <Link
      to={to}
      className="flex min-h-11 items-center justify-between gap-2 rounded-lg px-2 py-2 -mx-2 text-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
      aria-label={`Ver detalle de ${label}: ${formatCurrency(amount)}`}
    >
      <span className="text-slate-600">{label}</span>
      <span className={`font-semibold ${toneClass}`}>{formatCurrency(amount)}</span>
    </Link>
  )
}

export function BalanceOverviewCard({
  overview,
  baseline,
  onSaveBaseline,
}: {
  overview: BalanceOverview
  baseline: CashBalanceBaseline | null
  onSaveBaseline: (input: CashBalanceBaselineInput) => Promise<void>
}) {
  const [editingBaseline, setEditingBaseline] = useState(false)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-xs uppercase tracking-wide text-slate-500">Balance total</h2>
      <p
        className={`mt-1 font-heading text-3xl font-bold ${overview.balanceNeto >= 0 ? 'text-brand-navy' : 'text-red-600'}`}
      >
        {formatCurrency(overview.balanceNeto)}
      </p>
      <p className="mt-1 text-xs text-slate-400">Fondo general + ahorrado + invertido − tarjetas y deudas pendientes</p>

      <div className="mt-3 border-t border-slate-100 pt-3">
        {editingBaseline ? (
          <CashBalanceBaselineForm
            initial={baseline}
            onSubmit={async (input) => {
              await onSaveBaseline(input)
              setEditingBaseline(false)
            }}
            onCancel={() => setEditingBaseline(false)}
          />
        ) : overview.fondoGeneral == null ? (
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-sm text-slate-600">
              Configurá tu saldo inicial para ver tu fondo general (cuánta plata real tenés hoy).
            </p>
            <button
              onClick={() => setEditingBaseline(true)}
              className="mt-2 text-sm font-medium text-brand-blue underline"
            >
              Configurar saldo inicial
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Fondo general</p>
              <p className="text-lg font-semibold text-brand-navy">{formatCurrency(overview.fondoGeneral)}</p>
            </div>
            <button onClick={() => setEditingBaseline(true)} className="text-xs text-slate-500 underline">
              Editar saldo inicial
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col divide-y divide-slate-100">
        <BalanceRow to="/personal/metas" label="Ahorrado" amount={overview.ahorrado} tone="positive" />
        <BalanceRow to="/personal/ahorros" label="Invertido" amount={overview.invertido} tone="positive" />
        <BalanceRow to="/personal/tarjetas" label="Tarjetas pendientes" amount={overview.tarjetasPendientes} tone="negative" />
        <BalanceRow to="/personal/deudas" label="Deudas" amount={overview.deudasPendientes} tone="negative" />
        <BalanceRow to="/personal/inversiones" label="Por recuperar (negocio)" amount={overview.porCobrar} tone="neutral" />
      </div>
    </div>
  )
}
