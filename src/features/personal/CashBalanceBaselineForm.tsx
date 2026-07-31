import { useState, type FormEvent } from 'react'
import type { CashBalanceBaseline, CashBalanceBaselineInput } from '@/lib/cashBalance'

export function CashBalanceBaselineForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: CashBalanceBaseline | null
  onSubmit: (input: CashBalanceBaselineInput) => Promise<void>
  onCancel?: () => void
}) {
  const [initialAmount, setInitialAmount] = useState(initial ? String(initial.initial_amount) : '')
  const [initialDate, setInitialDate] = useState(initial?.initial_date ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({ initial_amount: Number(initialAmount) || 0, initial_date: initialDate })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el saldo inicial')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">
        ¿Cuánta plata tenías en esa fecha? A partir de ahí el fondo general se actualiza solo con lo que va quedando
        cada mes.
      </p>
      <div className="flex gap-2">
        <input
          type="number"
          required
          step="1"
          placeholder="Saldo inicial"
          value={initialAmount}
          onChange={(e) => setInitialAmount(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          required
          value={initialDate}
          onChange={(e) => setInitialDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Guardando…' : 'Guardar saldo inicial'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
