import { useState, type FormEvent } from 'react'
import { createGroup } from './api'
import type { Group, GroupType } from './types'

const typeOptions: { value: GroupType; label: string }[] = [
  { value: 'familia', label: 'Familia' },
  { value: 'viaje', label: 'Viaje' },
  { value: 'otro', label: 'Otro' },
]

export function CreateGroupForm({ onCreated }: { onCreated: (group: Group) => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<GroupType>('familia')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const group = await createGroup(name, type)
      setName('')
      onCreated(group)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el grupo')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-medium">Crear grupo</h2>

      <input
        type="text"
        required
        placeholder="Nombre del grupo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value as GroupType)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
      >
        {typeOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Creando…' : 'Crear grupo'}
      </button>
    </form>
  )
}
