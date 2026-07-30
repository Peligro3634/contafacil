import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { GroupTabs } from '@/components/GroupTabs'
import { MonthSelector } from '@/components/MonthSelector'
import { useAuth } from '@/features/auth/AuthContext'
import { computeGroupDebts } from '@/features/groups/aggregate'
import {
  createGroupExpense,
  deleteGroupExpense,
  fetchGroup,
  fetchGroupExpenses,
  fetchGroupExpenseShares,
  fetchGroupMembers,
} from '@/features/groups/api'
import { GroupDebtsSummary } from '@/features/groups/GroupDebtsSummary'
import { GroupExpenseForm } from '@/features/groups/GroupExpenseForm'
import { GroupExpensesList } from '@/features/groups/GroupExpensesList'
import type { Group, GroupExpense, GroupExpenseShare, GroupMember } from '@/features/groups/types'
import { currentMonthKey } from '@/lib/month'

export function GroupExpensesPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonthKey())
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [expenses, setExpenses] = useState<GroupExpense[]>([])
  const [shares, setShares] = useState<GroupExpenseShare[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!groupId) return
    let active = true
    setLoading(true)
    setError(null)

    Promise.all([fetchGroup(groupId), fetchGroupMembers(groupId), fetchGroupExpenses(groupId)])
      .then(async ([g, m, e]) => {
        const personalExpenseIds = e.filter((expense) => expense.source === 'personal').map((expense) => expense.id)
        const s = await fetchGroupExpenseShares(personalExpenseIds)
        if (!active) return
        setGroup(g)
        setMembers(m)
        setExpenses(e)
        setShares(s)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar los gastos del grupo')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [groupId])

  if (!user || !groupId) return null

  const monthExpenses = expenses.filter((expense) => expense.month === month)
  const sharesByExpenseId = new Map<string, GroupExpenseShare[]>()
  for (const share of shares) {
    const list = sharesByExpenseId.get(share.group_expense_id) ?? []
    list.push(share)
    sharesByExpenseId.set(share.group_expense_id, list)
  }
  const debts = computeGroupDebts(expenses, sharesByExpenseId)

  return (
    <AppShell title={group ? `Gastos · ${group.name}` : 'Gastos del grupo'}>
      <div className="flex flex-col gap-4">
        <Link to={`/groups/${groupId}`} className="text-sm text-slate-500 underline">
          ‹ Volver al grupo
        </Link>
        <GroupTabs groupId={groupId} />
        <MonthSelector month={month} onChange={setMonth} />

        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            <GroupDebtsSummary debts={debts} members={members} />

            <GroupExpensesList
              expenses={monthExpenses}
              members={members}
              currentUserId={user.id}
              onDelete={async (id) => {
                await deleteGroupExpense(id)
                setExpenses((prev) => prev.filter((expense) => expense.id !== id))
                setShares((prev) => prev.filter((share) => share.group_expense_id !== id))
              }}
            />

            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-900"
              >
                + Nuevo gasto
              </button>
            ) : (
              <GroupExpenseForm
                members={members}
                month={month}
                onSubmit={async (input) => {
                  const created = await createGroupExpense(groupId, input)
                  setExpenses((prev) => [created, ...prev])
                  if (input.source === 'personal') {
                    const newShares = await fetchGroupExpenseShares([created.id])
                    setShares((prev) => [...prev, ...newShares])
                  }
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
