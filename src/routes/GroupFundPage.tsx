import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { GroupTabs } from '@/components/GroupTabs'
import { useAuth } from '@/features/auth/AuthContext'
import { computeGroupFundBalance } from '@/features/groups/aggregate'
import {
  createFundContribution,
  deleteFundContribution,
  fetchFundContributions,
  fetchGroup,
  fetchGroupExpenses,
  fetchGroupMembers,
} from '@/features/groups/api'
import { FundBlock } from '@/features/groups/FundBlock'
import type { FundContribution, Group, GroupExpense, GroupMember } from '@/features/groups/types'

export function GroupFundPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { user } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [contributions, setContributions] = useState<FundContribution[]>([])
  const [expenses, setExpenses] = useState<GroupExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!groupId) return
    let active = true
    setLoading(true)
    setError(null)

    Promise.all([fetchGroup(groupId), fetchGroupMembers(groupId), fetchFundContributions(groupId), fetchGroupExpenses(groupId)])
      .then(([g, m, c, e]) => {
        if (!active) return
        setGroup(g)
        setMembers(m)
        setContributions(c)
        setExpenses(e)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar el fondo común')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [groupId])

  if (!user || !groupId) return null

  return (
    <AppShell title={group ? `Fondo común · ${group.name}` : 'Fondo común'}>
      <div className="flex flex-col gap-4">
        <Link to={`/groups/${groupId}`} className="text-sm text-slate-500 underline">
          ‹ Volver al grupo
        </Link>
        <GroupTabs groupId={groupId} />

        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <FundBlock
            balance={computeGroupFundBalance(contributions, expenses)}
            contributions={contributions}
            members={members}
            currentUserId={user.id}
            onCreateContribution={async (input) => {
              const created = await createFundContribution(groupId, user.id, input)
              setContributions((prev) => [...prev, created])
            }}
            onDeleteContribution={async (id) => {
              await deleteFundContribution(id)
              setContributions((prev) => prev.filter((c) => c.id !== id))
            }}
          />
        )}
      </div>
    </AppShell>
  )
}
