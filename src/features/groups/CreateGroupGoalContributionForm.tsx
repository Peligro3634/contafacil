import { useState, type FormEvent } from 'react'
import type { GroupGoalContributionInput } from './types'

export function CreateGroupGoalContributionForm({
  defaultDate,
  onSubmit,
  onCancel,
}: {
  defaultDate: string
  onSubmit: (input: GroupGoalContributionInput) => Promise<void>
  onCancel?: () => void
}) {
  const [date, setDate] = useState(defaultDate)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({ date, amount: Number(amount) || 0, note: note.trim() === '' ? null : note.trim() })
      setAmount('')
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el aporte')
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
        type="number"
        required
        min="0"
        step="1"
        placeholder="Monto ahorrado"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        type="text"
        placeholder="Nota (opcional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Guardando…' : 'Cargar aporte'}
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
