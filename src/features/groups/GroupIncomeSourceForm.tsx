import { useState, type FormEvent } from 'react'
import type { GroupIncomeSourceInput, IncomeSourcePartnerInput } from '@/features/investments/types'
import type { GroupMember } from './types'

type GroupIncomeSourceType = GroupIncomeSourceInput['type']

const typeOptions: { value: GroupIncomeSourceType; label: string }[] = [
  { value: 'monotributo', label: 'Monotributo' },
  { value: 'responsable_inscripto', label: 'Responsable inscripto' },
]

export function GroupIncomeSourceForm({
  members,
  onSubmit,
  onCancel,
}: {
  members: GroupMember[]
  onSubmit: (input: GroupIncomeSourceInput) => Promise<void>
  onCancel?: () => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<GroupIncomeSourceType>('monotributo')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [pctByUser, setPctByUser] = useState<Record<string, string>>({})
  const [aporteByUser, setAporteByUser] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function togglePartner(userId: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const partnerIds = [...selectedUserIds]
    if (partnerIds.length === 0) {
      setError('Elegí al menos un socio')
      return
    }

    const partners: IncomeSourcePartnerInput[] = partnerIds.map((userId) => ({
      user_id: userId,
      participacion_pct: Number(pctByUser[userId]) || 0,
      aporte_inicial: Number(aporteByUser[userId]) || 0,
    }))

    const pctTotal = partners.reduce((sum, p) => sum + p.participacion_pct, 0)
    if (Math.round(pctTotal * 100) !== 10000) {
      setError(`La suma de participaciones (${pctTotal}%) debe dar 100%`)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({ type, name, product_mode: 'simple', partners })
      setName('')
      setSelectedUserIds(new Set())
      setPctByUser({})
      setAporteByUser({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el emprendimiento')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-medium">Nuevo emprendimiento del grupo</h2>

      <input
        type="text"
        required
        placeholder="Nombre (ej: Feria de los sábados)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-base"
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value as GroupIncomeSourceType)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-base"
      >
        {typeOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="rounded-lg bg-slate-50 p-3">
        <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
          Socios (participación en recuperación y ganancia, debe sumar 100%)
        </p>

        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <div key={member.user_id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedUserIds.has(member.user_id)}
                onChange={() => togglePartner(member.user_id)}
              />
              <span className="flex-1">{member.profile?.name ?? member.profile?.email ?? 'Usuario'}</span>
              {selectedUserIds.has(member.user_id) && (
                <>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="%"
                    value={pctByUser[member.user_id] ?? ''}
                    onChange={(e) => setPctByUser((prev) => ({ ...prev, [member.user_id]: e.target.value }))}
                    className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Aporte inicial"
                    value={aporteByUser[member.user_id] ?? ''}
                    onChange={(e) => setAporteByUser((prev) => ({ ...prev, [member.user_id]: e.target.value }))}
                    className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Creando…' : 'Crear emprendimiento'}
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
