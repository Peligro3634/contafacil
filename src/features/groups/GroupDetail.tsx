import { useState } from 'react'
import type { Group, GroupMember } from './types'

const typeLabels: Record<Group['type'], string> = {
  familia: 'Familia',
  viaje: 'Viaje',
  otro: 'Otro',
}

export function GroupDetail({ group, members }: { group: Group; members: GroupMember[] }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(group.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">{typeLabels[group.type]}</p>
        <p className="text-xl font-semibold">{group.name}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Código de invitación</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-2xl font-mono font-semibold tracking-widest">{group.invite_code}</p>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium"
          >
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">Compartilo para que otros se unan al grupo.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
          Miembros ({members.length})
        </p>
        <ul className="flex flex-col divide-y divide-slate-100">
          {members.map((member) => (
            <li key={member.user_id} className="flex items-center justify-between py-2">
              <span>{member.profile?.name ?? member.profile?.email ?? 'Usuario'}</span>
              {member.role === 'admin' && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  Admin
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
