import { useState, type FormEvent } from 'react'
import type { CardPurchaseInput } from './types'

export function CardPurchaseForm({
  defaultDate,
  onSubmit,
  onCancel,
}: {
  defaultDate: string
  onSubmit: (input: CardPurchaseInput) => Promise<void>
  onCancel?: () => void
}) {
  const [date, setDate] = useState(defaultDate)
  const [description, setDescription] = useState('')
  const [amountTotal, setAmountTotal] = useState('')
  const [installmentsCount, setInstallmentsCount] = useState('1')
  const [paidInstallmentsCount, setPaidInstallmentsCount] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const installmentsCountNum = Number(installmentsCount) || 1

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        date,
        description,
        amount_total: Number(amountTotal) || 0,
        installments_count: installmentsCountNum,
        paid_installments_count: Number(paidInstallmentsCount) || 0,
      })
      setDescription('')
      setAmountTotal('')
      setInstallmentsCount('1')
      setPaidInstallmentsCount('0')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la compra')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3">
      <input
        type="date"
        required
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        type="text"
        required
        placeholder="Descripción (ej: Zapatillas)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <input
          type="number"
          required
          min="0"
          step="1"
          placeholder="Monto total"
          value={amountTotal}
          onChange={(e) => setAmountTotal(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <label className="w-28 text-xs text-slate-500">
          Cuotas
          <input
            type="number"
            required
            min="1"
            step="1"
            value={installmentsCount}
            onChange={(e) => setInstallmentsCount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900"
          />
        </label>
      </div>

      {installmentsCountNum > 1 && (
        <label className="text-xs text-slate-500">
          Cuotas ya pagadas (opcional)
          <input
            type="number"
            min="0"
            max={installmentsCountNum - 1}
            step="1"
            value={paidInstallmentsCount}
            onChange={(e) => setPaidInstallmentsCount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
          <span className="mt-1 block text-slate-400">
            Si es una compra vieja que ya venías pagando, indicá cuántas cuotas ya abonaste — el sistema arranca a
            contar desde la siguiente.
          </span>
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Guardando…' : 'Cargar compra'}
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
