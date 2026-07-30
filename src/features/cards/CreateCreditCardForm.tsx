import { useState, type FormEvent } from 'react'
import type { CreditCardInput } from './types'

export function CreateCreditCardForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: CreditCardInput) => Promise<void>
  onCancel?: () => void
}) {
  const [name, setName] = useState('')
  const [closingDay, setClosingDay] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({ name, closing_day: Number(closingDay), due_day: Number(dueDay) })
      setName('')
      setClosingDay('')
      setDueDay('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la tarjeta')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-medium">Nueva tarjeta</h2>
      <input
        type="text"
        required
        placeholder="Nombre (ej: Visa Galicia)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-base"
      />
      <div className="flex gap-2">
        <label className="flex-1 text-sm text-slate-500">
          Día de cierre
          <input
            type="number"
            required
            min="1"
            max="31"
            value={closingDay}
            onChange={(e) => setClosingDay(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
          />
        </label>
        <label className="flex-1 text-sm text-slate-500">
          Día de vencimiento
          <input
            type="number"
            required
            min="1"
            max="31"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Creando…' : 'Crear tarjeta'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2.5">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
