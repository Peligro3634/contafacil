import { useState, type FormEvent } from 'react'
import type { IncomeEntry, IncomeEntryInput } from './types'

export function IncomeEntryForm({
  defaultDate,
  initial,
  onSubmit,
  onCancel,
}: {
  defaultDate: string
  initial?: IncomeEntry
  onSubmit: (values: IncomeEntryInput) => Promise<void>
  onCancel?: () => void
}) {
  const [date, setDate] = useState(initial?.date ?? defaultDate)
  const [baseAmount, setBaseAmount] = useState(initial ? String(initial.base_amount) : '')
  const [extraAmount, setExtraAmount] = useState(initial ? String(initial.extra_amount) : '')
  const [unitsSold, setUnitsSold] = useState(initial?.units_sold != null ? String(initial.units_sold) : '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        date,
        base_amount: Number(baseAmount) || 0,
        extra_amount: Number(extraAmount) || 0,
        units_sold: unitsSold.trim() === '' ? null : Number(unitsSold),
        note: note.trim() === '' ? null : note.trim(),
      })
      if (!initial) {
        setBaseAmount('')
        setExtraAmount('')
        setUnitsSold('')
        setNote('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el ingreso')
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
          min="0"
          step="1"
          required
          placeholder="Monto base"
          value={baseAmount}
          onChange={(e) => setBaseAmount(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          min="0"
          step="1"
          placeholder="Extra (bono/venta)"
          value={extraAmount}
          onChange={(e) => setExtraAmount(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <input
        type="number"
        min="0"
        step="1"
        placeholder="Unidades vendidas (opcional)"
        value={unitsSold}
        onChange={(e) => setUnitsSold(e.target.value)}
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
          {submitting ? 'Guardando…' : initial ? 'Guardar cambios' : 'Agregar ingreso'}
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
