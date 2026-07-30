import { useState, type FormEvent } from 'react'
import type { BusinessExpenseInput, BusinessExpenseType } from './types'

const typeLabels: Record<BusinessExpenseType, string> = {
  costo_mercaderia: 'Costo de mercadería',
  gasto_operativo: 'Gasto operativo',
}

export function CreateBusinessExpenseForm({
  onSubmit,
}: {
  onSubmit: (input: BusinessExpenseInput) => Promise<void>
}) {
  const [type, setType] = useState<BusinessExpenseType>('costo_mercaderia')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({ type, category, amount: Number(amount) || 0 })
      setCategory('')
      setAmount('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el gasto')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as BusinessExpenseType)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        {Object.entries(typeLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <input
          type="text"
          required
          placeholder="Categoría (ej: Insumos)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          required
          min="0"
          step="1"
          placeholder="Monto"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Guardando…' : 'Cargar gasto'}
      </button>
    </form>
  )
}
