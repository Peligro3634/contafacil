import { useState, type FormEvent } from 'react'
import type { DebtPaymentInput, DebtPaymentSource } from './types'

const sourceLabels: Record<DebtPaymentSource, string> = {
  efectivo: 'Efectivo',
  cuenta_bancaria: 'Cuenta bancaria',
  ahorros: 'Ahorros',
  otro: 'Otro',
}

export function DebtPaymentForm({
  defaultDate,
  onSubmit,
  onCancel,
}: {
  defaultDate: string
  onSubmit: (input: DebtPaymentInput) => Promise<void>
  onCancel?: () => void
}) {
  const [date, setDate] = useState(defaultDate)
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState<DebtPaymentSource>('efectivo')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({ date, amount: Number(amount) || 0, source, note: note.trim() === '' ? null : note.trim() })
      setAmount('')
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el pago')
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
      <div className="flex gap-2">
        <input
          type="number"
          required
          min="0"
          step="1"
          placeholder="Monto pagado"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <label className="w-40 text-xs text-slate-500">
          Origen
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as DebtPaymentSource)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900"
          >
            {Object.entries(sourceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <input
        type="text"
        placeholder="Nota (opcional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <p className="text-xs text-slate-500">
        Este pago se registra también como gasto variable, así impacta el disponible del mes en Resumen.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Guardando…' : 'Registrar pago'}
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
