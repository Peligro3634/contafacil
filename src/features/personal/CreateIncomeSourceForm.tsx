import { useState, type FormEvent } from 'react'
import type { IncomeSourceType } from './types'

const typeOptions: { value: IncomeSourceType; label: string }[] = [
  { value: 'empleado_fijo', label: 'Sueldo fijo' },
  { value: 'monotributo', label: 'Monotributo' },
  { value: 'responsable_inscripto', label: 'Responsable inscripto' },
]

export function CreateIncomeSourceForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: { type: IncomeSourceType; name: string }) => Promise<void>
  onCancel?: () => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<IncomeSourceType>('empleado_fijo')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({ type, name })
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la fuente de ingreso')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-medium">Nueva fuente de ingreso</h2>

      <input
        type="text"
        required
        placeholder="Nombre (ej: Sueldo agencia)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value as IncomeSourceType)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
      >
        {typeOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Creando…' : 'Crear fuente'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
