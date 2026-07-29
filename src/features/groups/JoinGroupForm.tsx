import { useState, type FormEvent } from 'react'
import { joinGroupByCode } from './api'
import type { Group } from './types'

export function JoinGroupForm({ onJoined }: { onJoined: (group: Group) => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const group = await joinGroupByCode(code)
      setCode('')
      onJoined(group)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código de invitación inválido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-medium">Unirme a un grupo</h2>

      <input
        type="text"
        required
        placeholder="Código de invitación"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="rounded-lg border border-slate-300 px-3 py-2 text-base uppercase tracking-widest focus:border-slate-500 focus:outline-none"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg border border-slate-900 px-4 py-2.5 font-medium text-slate-900 disabled:opacity-50"
      >
        {submitting ? 'Uniéndome…' : 'Unirme'}
      </button>
    </form>
  )
}
