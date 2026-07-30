import { useState, type FormEvent } from 'react'
import type { SavingsGoal, SavingsGoalInput } from './types'

export function SavingsGoalForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: SavingsGoal
  onSubmit: (input: SavingsGoalInput) => Promise<void>
  onCancel?: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [targetAmount, setTargetAmount] = useState(initial ? String(initial.target_amount) : '')
  const [targetDate, setTargetDate] = useState(initial?.target_date ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({ name, target_amount: Number(targetAmount) || 0, target_date: targetDate })
      if (!initial) {
        setName('')
        setTargetAmount('')
        setTargetDate('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la meta')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      {!initial && <h2 className="font-medium">Nueva meta</h2>}
      <input
        type="text"
        required
        placeholder="Nombre (ej: Viaje a Bariloche)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-base"
      />
      <div className="flex gap-2">
        <label className="flex-1 text-sm text-slate-500">
          Monto objetivo
          <input
            type="number"
            required
            min="0"
            step="1"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
          />
        </label>
        <label className="flex-1 text-sm text-slate-500">
          Fecha objetivo
          <input
            type="date"
            required
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
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
          {submitting ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear meta'}
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
