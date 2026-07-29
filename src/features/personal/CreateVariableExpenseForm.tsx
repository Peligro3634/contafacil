import { useState, type FormEvent } from 'react'

export function CreateVariableExpenseForm({
  onSubmit,
}: {
  onSubmit: (input: { category: string; amount: number }) => Promise<void>
}) {
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({ category, amount: Number(amount) || 0 })
      setCategory('')
      setAmount('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el gasto')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-medium">Gasto variable</h2>
      <div className="flex gap-2">
        <input
          type="text"
          required
          placeholder="Categoría (ej: Comida)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-base"
        />
        <input
          type="number"
          required
          min="0"
          step="1"
          placeholder="Monto"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-base"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Cargando…' : 'Agregar gasto'}
      </button>
    </form>
  )
}
