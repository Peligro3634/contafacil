import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { MonthSelector } from '@/components/MonthSelector'
import { PersonalTabs } from '@/components/PersonalTabs'
import { useAuth } from '@/features/auth/AuthContext'
import { Dashboard } from '@/features/personal/Dashboard'
import type { DashboardTotals } from '@/features/personal/aggregate'
import type { WealthBreakdown } from '@/features/personal/wealth'
import { currentMonthKey } from '@/lib/month'
import { loadBalanceHistory, loadDashboardTotals, loadWealthBreakdown, type BalancePoint } from '@/lib/dashboard'

export function PersonalPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonthKey())
  const [totals, setTotals] = useState<DashboardTotals | null>(null)
  const [wealth, setWealth] = useState<WealthBreakdown | null>(null)
  const [history, setHistory] = useState<BalancePoint[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Resumen del mes + foto de patrimonio: se recargan al cambiar el mes o el
  // usuario. El patrimonio no depende del mes, pero es barato y se mantiene
  // junto al resumen para un solo estado de carga.
  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    setError(null)

    Promise.all([loadDashboardTotals(month, user.id), loadWealthBreakdown()])
      .then(([totals, wealth]) => {
        if (!active) return
        setTotals(totals)
        setWealth(wealth)
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

  // Historial de balance: es lo más pesado (varios meses en paralelo), así que
  // se carga aparte para no frenar el resto del resumen.
  useEffect(() => {
    if (!user) return
    let active = true
    setHistoryLoading(true)

    loadBalanceHistory(month, user.id)
      .then((points) => {
        if (active) setHistory(points)
      })
      .catch(() => {
        if (active) setHistory(null)
      })
      .finally(() => {
        if (active) setHistoryLoading(false)
      })

    return () => {
      active = false
    }
  }, [month, user])

  return (
    <AppShell title="Personal">
      <div className="flex flex-col gap-4">
        <PersonalTabs />
        <MonthSelector month={month} onChange={setMonth} />

        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && totals && (
          <Dashboard totals={totals} wealth={wealth} history={history} historyLoading={historyLoading} />
        )}
      </div>
    </AppShell>
  )
}
