import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { PersonalTabs } from '@/components/PersonalTabs'
import { useAuth } from '@/features/auth/AuthContext'
import { computeGoalStatus } from '@/features/goals/aggregate'
import {
  createGoalContribution,
  createSavingsGoal,
  deleteGoalContribution,
  deleteSavingsGoal,
  fetchGoalContributions,
  fetchSavingsGoals,
  updateSavingsGoal,
} from '@/features/goals/api'
import { GoalCard } from '@/features/goals/GoalCard'
import { SavingsGoalForm } from '@/features/goals/SavingsGoalForm'
import type { GoalContribution, SavingsGoal } from '@/features/goals/types'
import { formatCurrency } from '@/lib/format'
import { loadDashboardTotals } from '@/lib/dashboard'
import { currentMonthKey } from '@/lib/month'

interface GoalData {
  goal: SavingsGoal
  contributions: GoalContribution[]
}

// Sin MonthSelector: a diferencia de Ingresos/Gastos/Tarjetas/Inversiones,
// las metas no son un registro mes a mes sino un plan hacia adelante desde
// "ahora" (mes calendario actual), asi que solo importa el estado presente.
export function PersonalGoalsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<GoalData[]>([])
  const [available, setAvailable] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    setError(null)

    Promise.all([fetchSavingsGoals(), loadDashboardTotals(currentMonthKey(), user.id)])
      .then(async ([goals, totals]) => {
        const loaded = await Promise.all(
          goals.map(async (goal) => ({ goal, contributions: await fetchGoalContributions(goal.id) })),
        )
        if (!active) return
        setData(loaded)
        setAvailable(totals.available)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar las metas')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  if (!user) return null

  const currentMonth = currentMonthKey()
  const statuses = data.map((d) => computeGoalStatus(d.goal, d.contributions, currentMonth))
  const cuotaTotalSugerida = statuses.filter((s) => !s.cumplida).reduce((sum, s) => sum + s.cuotaMensualSugerida, 0)

  function updateGoalData(goalId: string, updater: (d: GoalData) => GoalData) {
    setData((prev) => prev.map((d) => (d.goal.id === goalId ? updater(d) : d)))
  }

  return (
    <AppShell title="Metas">
      <div className="flex flex-col gap-4">
        <PersonalTabs />

        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            {available != null && cuotaTotalSugerida > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Disponible este mes</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(available)}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Cuota mensual sugerida de tus metas:{' '}
                  <span className="font-medium text-slate-900">{formatCurrency(cuotaTotalSugerida)}</span>
                </p>
                <p
                  className={`mt-1 text-sm font-medium ${available >= cuotaTotalSugerida ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {available >= cuotaTotalSugerida
                    ? 'Te alcanza el disponible de este mes'
                    : 'No te alcanza el disponible de este mes'}
                </p>
              </div>
            )}

            {data.length === 0 && (
              <p className="text-sm text-slate-500">Todavía no cargaste ninguna meta de ahorro.</p>
            )}

            {data.map((d, i) => (
              <GoalCard
                key={d.goal.id}
                status={statuses[i]}
                contributions={d.contributions}
                onUpdateGoal={async (input) => {
                  const updated = await updateSavingsGoal(d.goal.id, input)
                  updateGoalData(d.goal.id, (prev) => ({ ...prev, goal: updated }))
                }}
                onDeleteGoal={async () => {
                  await deleteSavingsGoal(d.goal.id)
                  setData((prev) => prev.filter((item) => item.goal.id !== d.goal.id))
                }}
                onCreateContribution={async (input) => {
                  const created = await createGoalContribution(d.goal.id, input)
                  updateGoalData(d.goal.id, (prev) => ({ ...prev, contributions: [...prev.contributions, created] }))
                }}
                onDeleteContribution={async (id) => {
                  await deleteGoalContribution(id)
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
                + Nueva meta
              </button>
            ) : (
              <SavingsGoalForm
                onSubmit={async (input) => {
                  const created = await createSavingsGoal(user.id, input)
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
