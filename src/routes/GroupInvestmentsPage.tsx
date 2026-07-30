import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { GroupTabs } from '@/components/GroupTabs'
import { MonthSelector } from '@/components/MonthSelector'
import { useAuth } from '@/features/auth/AuthContext'
import { fetchGroup, fetchGroupMembers } from '@/features/groups/api'
import { GroupIncomeSourceForm } from '@/features/groups/GroupIncomeSourceForm'
import { PartnerSharesBlock } from '@/features/groups/PartnerSharesBlock'
import type { Group, GroupMember } from '@/features/groups/types'
import {
  createBusinessExpense,
  createGroupIncomeSource,
  createInvestment,
  deleteBusinessExpense,
  deleteInvestment,
  fetchBusinessExpensesForSource,
  fetchGroupIncomeSources,
  fetchIncomeSourcePartners,
  fetchInvestments,
} from '@/features/investments/api'
import {
  computeConsolidatedStatus,
  computeEmprendimientoStatus,
  computeMonthlyPnL,
  computePartnerShares,
} from '@/features/investments/aggregate'
import { ConsolidatedSummary } from '@/features/investments/ConsolidatedSummary'
import { EmprendimientoBlock } from '@/features/investments/EmprendimientoBlock'
import type { BusinessExpense, IncomeSourcePartner, Investment } from '@/features/investments/types'
import { fetchIncomeEntriesForSource } from '@/features/personal/api'
import type { IncomeEntry, IncomeSource } from '@/features/personal/types'
import { currentMonthKey } from '@/lib/month'

interface EmprendimientoData {
  incomeSource: IncomeSource
  partners: IncomeSourcePartner[]
  investments: Investment[]
  entries: IncomeEntry[]
  expenses: BusinessExpense[]
}

export function GroupInvestmentsPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonthKey())
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [data, setData] = useState<EmprendimientoData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!groupId) return
    let active = true
    setLoading(true)
    setError(null)

    Promise.all([fetchGroup(groupId), fetchGroupMembers(groupId), fetchGroupIncomeSources(groupId)])
      .then(async ([g, m, sources]) => {
        const loaded = await Promise.all(
          sources.map(async (incomeSource) => {
            const [partners, investments, entries, expenses] = await Promise.all([
              fetchIncomeSourcePartners(incomeSource.id),
              fetchInvestments(incomeSource.id),
              fetchIncomeEntriesForSource(incomeSource.id),
              fetchBusinessExpensesForSource(incomeSource.id),
            ])
            return { incomeSource, partners, investments, entries, expenses }
          }),
        )
        if (!active) return
        setGroup(g)
        setMembers(m)
        setData(loaded)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar los emprendimientos')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [groupId])

  if (!user || !groupId) return null

  const statuses = data.map((d) => computeEmprendimientoStatus(d.incomeSource, d.investments, d.entries, d.expenses))
  const consolidated = computeConsolidatedStatus(statuses)

  function updateSource(incomeSourceId: string, updater: (d: EmprendimientoData) => EmprendimientoData) {
    setData((prev) => prev.map((d) => (d.incomeSource.id === incomeSourceId ? updater(d) : d)))
  }

  return (
    <AppShell title={group ? `Emprendimientos · ${group.name}` : 'Emprendimientos del grupo'}>
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
            {data.length === 0 && (
              <p className="text-sm text-slate-500">Todavía no hay emprendimientos cargados para este grupo.</p>
            )}

            <ConsolidatedSummary status={consolidated} />

            {data.map((d, i) => {
              const isPartner = d.partners.some((p) => p.user_id === user.id)
              return (
                <div key={d.incomeSource.id}>
                  <EmprendimientoBlock
                    status={statuses[i]}
                    monthlyPnL={computeMonthlyPnL(d.entries, d.expenses, month)}
                    month={month}
                    investments={d.investments}
                    monthExpenses={d.expenses.filter((e) => e.month === month)}
                    readOnly={!isPartner}
                    onCreateInvestment={async (input) => {
                      const created = await createInvestment(d.incomeSource.id, input)
                      updateSource(d.incomeSource.id, (prev) => ({
                        ...prev,
                        investments: [...prev.investments, created],
                      }))
                    }}
                    onDeleteInvestment={async (id) => {
                      await deleteInvestment(id)
                      updateSource(d.incomeSource.id, (prev) => ({
                        ...prev,
                        investments: prev.investments.filter((inv) => inv.id !== id),
                      }))
                    }}
                    onCreateBusinessExpense={async (input) => {
                      const created = await createBusinessExpense(d.incomeSource.id, month, input)
                      updateSource(d.incomeSource.id, (prev) => ({ ...prev, expenses: [...prev.expenses, created] }))
                    }}
                    onDeleteBusinessExpense={async (id) => {
                      await deleteBusinessExpense(id)
                      updateSource(d.incomeSource.id, (prev) => ({
                        ...prev,
                        expenses: prev.expenses.filter((exp) => exp.id !== id),
                      }))
                    }}
                  />
                  <PartnerSharesBlock shares={computePartnerShares(statuses[i], d.partners)} members={members} />
                </div>
              )
            })}

            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-900"
              >
                + Nuevo emprendimiento del grupo
              </button>
            ) : (
              <GroupIncomeSourceForm
                members={members}
                onSubmit={async (input) => {
                  const createdSource = await createGroupIncomeSource(groupId, input)
                  const partners = await fetchIncomeSourcePartners(createdSource.id)
                  setData((prev) => [
                    ...prev,
                    { incomeSource: createdSource, partners, investments: [], entries: [], expenses: [] },
                  ])
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
