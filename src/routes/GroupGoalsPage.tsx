import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { GroupTabs } from '@/components/GroupTabs'
import { useAuth } from '@/features/auth/AuthContext'
import { computeGroupGoalStatus } from '@/features/groups/aggregate'
import {
  createGroupGoal,
  createGroupGoalContribution,
  deleteGroupGoal,
  deleteGroupGoalContribution,
  fetchGroup,
  fetchGroupGoalContributions,
  fetchGroupGoals,
  fetchGroupMembers,
  updateGroupGoal,
} from '@/features/groups/api'
import { GroupGoalCard } from '@/features/groups/GroupGoalCard'
import { GroupGoalForm } from '@/features/groups/GroupGoalForm'
import type { Group, GroupGoalContribution, GroupMember, GroupGoal as GroupGoalType } from '@/features/groups/types'
import { currentMonthKey } from '@/lib/month'

interface GroupGoalData {
  goal: GroupGoalType
  contributions: GroupGoalContribution[]
}

export function GroupGoalsPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { user } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [data, setData] = useState<GroupGoalData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!groupId) return
    let active = true
    setLoading(true)
    setError(null)

    Promise.all([fetchGroup(groupId), fetchGroupMembers(groupId), fetchGroupGoals(groupId)])
      .then(async ([g, m, goals]) => {
        const loaded = await Promise.all(
          goals.map(async (goal) => ({ goal, contributions: await fetchGroupGoalContributions(goal.id) })),
        )
        if (!active) return
        setGroup(g)
        setMembers(m)
        setData(loaded)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar las metas del grupo')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [groupId])

  if (!user || !groupId) return null

  const currentMonth = currentMonthKey()
  const statuses = data.map((d) => computeGroupGoalStatus(d.goal, d.contributions, members.length, currentMonth))

  function updateGoalData(goalId: string, updater: (d: GroupGoalData) => GroupGoalData) {
    setData((prev) => prev.map((d) => (d.goal.id === goalId ? updater(d) : d)))
  }

  return (
    <AppShell title={group ? `Metas · ${group.name}` : 'Metas del grupo'}>
      <div className="flex flex-col gap-4">
        <Link to={`/groups/${groupId}`} className="text-sm text-slate-500 underline">
          ‹ Volver al grupo
        </Link>
        <GroupTabs groupId={groupId} />

        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            {data.length === 0 && (
              <p className="text-sm text-slate-500">Todavía no hay metas cargadas para este grupo.</p>
            )}

            {data.map((d, i) => (
              <GroupGoalCard
                key={d.goal.id}
                status={statuses[i]}
                contributions={d.contributions}
                members={members}
                currentUserId={user.id}
                onUpdateGoal={async (input) => {
                  const updated = await updateGroupGoal(d.goal.id, input)
                  updateGoalData(d.goal.id, (prev) => ({ ...prev, goal: updated }))
                }}
                onDeleteGoal={async () => {
                  await deleteGroupGoal(d.goal.id)
                  setData((prev) => prev.filter((item) => item.goal.id !== d.goal.id))
                }}
                onCreateContribution={async (input) => {
                  const created = await createGroupGoalContribution(d.goal.id, user.id, input)
                  updateGoalData(d.goal.id, (prev) => ({ ...prev, contributions: [...prev.contributions, created] }))
                }}
                onDeleteContribution={async (id) => {
                  await deleteGroupGoalContribution(id)
                  updateGoalData(d.goal.id, (prev) => ({
                    ...prev,
                    contributions: prev.contributions.filter((c) => c.id !== id),
                  }))
                }}
              />
            ))}

            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-900"
              >
                + Nueva meta del grupo
              </button>
            ) : (
              <GroupGoalForm
                onSubmit={async (input) => {
                  const created = await createGroupGoal(groupId, input)
                  setData((prev) => [...prev, { goal: created, contributions: [] }])
                  setShowCreate(false)
                }}
                onCancel={() => setShowCreate(false)}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
