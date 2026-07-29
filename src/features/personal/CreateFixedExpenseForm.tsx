import { useState, type FormEvent } from 'react'

export function CreateFixedExpenseForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string) => Promise<void>
  onCancel?: () => void
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit(name)
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el gasto fijo')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          required
          placeholder="Nombre (ej: Alquiler)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? '…' : 'Agregar'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            Cancelar
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
