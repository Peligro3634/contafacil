import { useState } from 'react'
import { formatCurrency } from '@/lib/format'
import { todayDateKey } from '@/lib/month'
import { CreateFundContributionForm } from './CreateFundContributionForm'
import type { FundContribution, FundContributionInput, GroupMember } from './types'

export function FundBlock({
  balance,
  contributions,
  members,
  currentUserId,
  onCreateContribution,
  onDeleteContribution,
}: {
  balance: number
  contributions: FundContribution[]
  members: GroupMember[]
  currentUserId: string
  onCreateContribution: (input: FundContributionInput) => Promise<void>
  onDeleteContribution: (id: string) => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const nameByUserId = new Map(members.map((m) => [m.user_id, m.profile?.name ?? m.profile?.email ?? 'Usuario']))

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">Saldo del fondo común</p>
      <p className={`mt-1 text-xl font-semibold ${balance < 0 ? 'text-red-600' : ''}`}>{formatCurrency(balance)}</p>
      <p className="mt-1 text-xs text-slate-500">
        Informativo: aportes menos gastos pagados desde el fondo. Puede quedar negativo.
      </p>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Aportes</p>
        {contributions.length > 0 && (
          <ul className="mt-1 flex flex-col divide-y divide-slate-100">
            {contributions.map((contribution) => (
              <li key={contribution.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <p>
                    {contribution.date} · {nameByUserId.get(contribution.user_id) ?? 'Usuario'}
                  </p>
                  {contribution.note && <p className="text-slate-500">{contribution.note}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-medium">{formatCurrency(contribution.amount)}</span>
                  {contribution.user_id === currentUserId && (
                    <button onClick={() => onDeleteContribution(contribution.id)} className="text-red-600 underline">
                      Eliminar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {adding ? (
          <div className="mt-2">
            <CreateFundContributionForm
              defaultDate={todayDateKey()}
              onSubmit={async (input) => {
                await onCreateContribution(input)
                setAdding(false)
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="mt-2 text-sm font-medium text-slate-900 underline">
            + Aportar al fondo
          </button>
        )}
      </div>
    </div>
  )
}
