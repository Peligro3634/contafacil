import { useState, type FormEvent } from 'react'
import type { Debt, DebtInput } from './types'

export function DebtForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Debt
  onSubmit: (input: DebtInput) => Promise<void>
  onCancel?: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [originalAmount, setOriginalAmount] = useState(initial ? String(initial.original_amount) : '')
  const [installmentsCount, setInstallmentsCount] = useState(
    initial?.installments_count != null ? String(initial.installments_count) : '',
  )
  const [startDate, setStartDate] = useState(initial?.start_date ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        name,
        original_amount: Number(originalAmount) || 0,
        installments_count: installmentsCount.trim() === '' ? null : Number(installmentsCount),
        start_date: startDate,
        note: note.trim() === '' ? null : note.trim(),
      })
      if (!initial) {
        setName('')
        setOriginalAmount('')
        setInstallmentsCount('')
        setStartDate('')
        setNote('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la deuda')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      {!initial && <h2 className="font-medium">Nueva deuda</h2>}
      <input
        type="text"
        required
        placeholder="Nombre (ej: Préstamo personal, Heladera en cuotas)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-base"
      />
      <div className="flex gap-2">
        <label className="flex-1 text-sm text-slate-500">
          Monto original
          <input
            type="number"
            required
            min="0"
            step="1"
            value={originalAmount}
            onChange={(e) => setOriginalAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
          />
        </label>
        <label className="w-28 text-sm text-slate-500">
          Cuotas (opcional)
          <input
            type="number"
            min="1"
            step="1"
            value={installmentsCount}
            onChange={(e) => setInstallmentsCount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-base text-slate-900"
          />
        </label>
      </div>
      <label className="text-sm text-slate-500">
        Fecha de inicio
        <input
          type="date"
          required
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
        />
      </label>
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
          className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear deuda'}
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
