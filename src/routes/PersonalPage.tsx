import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { MonthSelector } from '@/components/MonthSelector'
import { PersonalTabs } from '@/components/PersonalTabs'
import { useAuth } from '@/features/auth/AuthContext'
import { Dashboard } from '@/features/personal/Dashboard'
import type { DashboardTotals } from '@/features/personal/aggregate'
import { loadBalanceOverview, type BalanceOverview } from '@/lib/balanceOverview'
import {
  fetchCashBalanceBaseline,
  upsertCashBalanceBaseline,
  type CashBalanceBaseline,
  type CashBalanceBaselineInput,
} from '@/lib/cashBalance'
import { loadDashboardTotals } from '@/lib/dashboard'
import { loadDashboardHistory, type MonthlyBalancePoint } from '@/lib/dashboardHistory'
import { currentMonthKey } from '@/lib/month'

export function PersonalPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonthKey())
  const [totals, setTotals] = useState<DashboardTotals | null>(null)
  const [overview, setOverview] = useState<BalanceOverview | null>(null)
  const [baseline, setBaseline] = useState<CashBalanceBaseline | null>(null)
  const [history, setHistory] = useState<MonthlyBalancePoint[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    setError(null)

    loadDashboardTotals(month, user.id)
      .then((totals) => {
        if (active) setTotals(totals)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar el dashboard')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [month, user])

  // Balance total e historico son independientes del mes seleccionado (el
  // primero es un estado presente, el segundo mira siempre los ultimos N
  // meses): se cargan una sola vez por usuario, no en cada cambio de mes.
  useEffect(() => {
    if (!user) return
    let active = true

    fetchCashBalanceBaseline()
      .then((baseline) => {
        if (active) setBaseline(baseline)
      })
      .catch(() => {
        if (active) setBaseline(null)
      })

    loadBalanceOverview(user.id)
      .then((overview) => {
        if (active) setOverview(overview)
      })
      .catch(() => {
        if (active) setOverview(null)
      })

    loadDashboardHistory(user.id)
      .then((history) => {
        if (active) setHistory(history)
      })
      .catch(() => {
        if (active) setHistory(null)
      })

    return () => {
      active = false
    }
  }, [user])

  async function handleSaveBaseline(input: CashBalanceBaselineInput) {
    if (!user) return
    const saved = await upsertCashBalanceBaseline(user.id, input)
    setBaseline(saved)
    const refreshed = await loadBalanceOverview(user.id)
    setOverview(refreshed)
  }

  return (
    <AppShell title="Personal">
      <div className="flex flex-col gap-4">
        <PersonalTabs />
        <MonthSelector month={month} onChange={setMonth} />

        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && totals && (
          <Dashboard
            totals={totals}
            overview={overview}
            baseline={baseline}
            onSaveBaseline={handleSaveBaseline}
            history={history}
          />
        )}
      </div>
    </AppShell>
  )
}
