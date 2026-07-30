import { useState, type FormEvent } from 'react'
import type { GroupExpenseInput, GroupExpenseShareInput, GroupExpenseSource, GroupMember } from './types'

const sourceLabels: Record<GroupExpenseSource, string> = {
  fondo_comun: 'Fondo común',
  personal: 'Bolsillo personal',
}

// Reparte "amount" en partes iguales entre userIds, ajustando centavos de
// redondeo en el ultimo participante (mismo truco que las cuotas de tarjeta
// en create_card_purchase).
function splitEqually(amount: number, userIds: string[]): GroupExpenseShareInput[] {
  const perPerson = Math.trunc((amount / userIds.length) * 100) / 100
  let remaining = amount
  return userIds.map((userId, i) => {
    const isLast = i === userIds.length - 1
    const share = isLast ? Math.round(remaining * 100) / 100 : perPerson
    remaining -= share
    return { user_id: userId, amount: share }
  })
}

export function GroupExpenseForm({
  members,
  month,
  onSubmit,
  onCancel,
}: {
  members: GroupMember[]
  month: string
  onSubmit: (input: GroupExpenseInput) => Promise<void>
  onCancel?: () => void
}) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState<GroupExpenseSource>('personal')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set(members.map((m) => m.user_id)))
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal')
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggleParticipant(userId: string) {
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

    const totalAmount = Number(amount) || 0
    let shares: GroupExpenseShareInput[] = []

    if (source === 'personal') {
      const participantIds = [...selectedUserIds]
      if (participantIds.length === 0) {
        setError('Elegí al menos un participante')
        return
      }

      if (splitMode === 'equal') {
        shares = splitEqually(totalAmount, participantIds)
      } else {
        shares = participantIds.map((userId) => ({ user_id: userId, amount: Number(customAmounts[userId]) || 0 }))
        const sum = shares.reduce((s, share) => s + share.amount, 0)
        if (Math.round(sum * 100) !== Math.round(totalAmount * 100)) {
          setError(`La suma de los participantes (${sum}) no coincide con el monto total (${totalAmount})`)
          return
        }
      }
    }

    setSubmitting(true)
    try {
      await onSubmit({ description, amount: totalAmount, month, source, shares })
      setDescription('')
      setAmount('')
      setCustomAmounts({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el gasto')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-medium">Nuevo gasto del grupo</h2>
      <input
        type="text"
        required
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-base"
      />
      <input
        type="number"
        required
        min="0"
        step="1"
        placeholder="Monto"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-base"
      />

      <div className="flex gap-2">
        {(Object.keys(sourceLabels) as GroupExpenseSource[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSource(value)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              source === value ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-700'
            }`}
          >
            {sourceLabels[value]}
          </button>
        ))}
      </div>

      {source === 'personal' && (
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Participantes y reparto</p>

          <div className="flex flex-col gap-1">
            {members.map((member) => (
              <label key={member.user_id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedUserIds.has(member.user_id)}
                  onChange={() => toggleParticipant(member.user_id)}
                />
                <span className="flex-1">{member.profile?.name ?? member.profile?.email ?? 'Usuario'}</span>
                {splitMode === 'custom' && selectedUserIds.has(member.user_id) && (
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Monto"
                    value={customAmounts[member.user_id] ?? ''}
                    onChange={(e) =>
                      setCustomAmounts((prev) => ({ ...prev, [member.user_id]: e.target.value }))
                    }
                    className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                )}
              </label>
            ))}
          </div>

          <div className="mt-2 flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSplitMode('equal')}
              className={`rounded-full px-3 py-1 font-medium ${
                splitMode === 'equal' ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-700'
              }`}
            >
              Partes iguales
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('custom')}
              className={`rounded-full px-3 py-1 font-medium ${
                splitMode === 'custom' ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-700'
              }`}
            >
              Montos personalizados
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Guardando…' : 'Cargar gasto'}
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
