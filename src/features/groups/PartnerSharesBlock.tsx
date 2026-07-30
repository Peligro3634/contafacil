import type { PartnerShare } from '@/features/investments/aggregate'
import { formatCurrency } from '@/lib/format'
import type { GroupMember } from './types'

export function PartnerSharesBlock({ shares, members }: { shares: PartnerShare[]; members: GroupMember[] }) {
  const nameByUserId = new Map(members.map((m) => [m.user_id, m.profile?.name ?? m.profile?.email ?? 'Usuario']))

  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">Reparto entre socios</p>
      <ul className="mt-2 flex flex-col divide-y divide-slate-200">
        {shares.map((share) => (
          <li key={share.userId} className="flex items-center justify-between gap-2 py-2 text-sm">
            <div>
              <p className="font-medium">{nameByUserId.get(share.userId) ?? 'Usuario'}</p>
              <p className="text-xs text-slate-500">{share.participacionPct}% de participación</p>
            </div>
            <div className="text-right">
              <p>{formatCurrency(share.recuperado)} recuperado</p>
              {share.gananciaPostRecupero > 0 && (
                <p className="text-emerald-600">{formatCurrency(share.gananciaPostRecupero)} ganancia</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
