import { useState, type FormEvent } from 'react'
import { todayDateKey } from '@/lib/month'
import type { PortfolioInstrumentType, PortfolioItem, PortfolioItemInput } from './types'

const typeLabels: Record<PortfolioInstrumentType, string> = {
  accion: 'Acción',
  cedear: 'CEDEAR',
  plazo_fijo: 'Plazo fijo',
  fondo: 'Fondo',
  cripto: 'Cripto',
  otro: 'Otro',
}

export function PortfolioForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: PortfolioItem
  onSubmit: (input: PortfolioItemInput) => Promise<void>
  onCancel?: () => void
}) {
  const [instrumentType, setInstrumentType] = useState<PortfolioInstrumentType>(initial?.instrument_type ?? 'accion')
  const [name, setName] = useState(initial?.name ?? '')
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : '')
  const [purchasePrice, setPurchasePrice] = useState(initial ? String(initial.purchase_price) : '')
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchase_date ?? todayDateKey())
  const [currentValue, setCurrentValue] = useState(initial ? String(initial.current_value) : '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        instrument_type: instrumentType,
        name,
        quantity: Number(quantity) || 0,
        purchase_price: Number(purchasePrice) || 0,
        purchase_date: purchaseDate,
        current_value: Number(currentValue) || 0,
        note: note.trim() === '' ? null : note.trim(),
      })
      if (!initial) {
        setName('')
        setQuantity('')
        setPurchasePrice('')
        setCurrentValue('')
        setNote('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el instrumento')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      {!initial && <h2 className="font-medium">Nuevo instrumento</h2>}

      <select
        value={instrumentType}
        onChange={(e) => setInstrumentType(e.target.value as PortfolioInstrumentType)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-base"
      >
        {Object.entries(typeLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <input
        type="text"
        required
        placeholder="Nombre (ej: AAPL, Bitcoin, Plazo fijo Banco X)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-base"
      />

      <div className="flex gap-2">
        <label className="flex-1 text-sm text-slate-500">
          Cantidad
          <input
            type="number"
            required
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
          />
        </label>
        <label className="flex-1 text-sm text-slate-500">
          Precio de compra (unitario)
          <input
            type="number"
            required
            min="0"
            step="any"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
          />
        </label>
      </div>

      <label className="text-sm text-slate-500">
        Fecha de compra
        <input
          type="date"
          required
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
        />
      </label>

      <label className="text-sm text-slate-500">
        Valor actual (total de la posición)
        <input
          type="number"
          required
          min="0"
          step="any"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
        />
      </label>

      <input
        type="text"
        placeholder="Nota (opcional, ej: cuenta/broker)"
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
          {submitting ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear instrumento'}
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
