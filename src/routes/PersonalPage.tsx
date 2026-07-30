import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { MonthSelector } from '@/components/MonthSelector'
import { PersonalTabs } from '@/components/PersonalTabs'
import { Dashboard } from '@/features/personal/Dashboard'
import type { DashboardTotals } from '@/features/personal/aggregate'
import { currentMonthKey } from '@/lib/month'
import { loadDashboardTotals } from '@/lib/dashboard'

export function PersonalPage() {
  const [month, setMonth] = useState(currentMonthKey())
  const [totals, setTotals] = useState<DashboardTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    loadDashboardTotals(month)
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
  }, [month])

  return (
    <AppShell title="Personal">
      <div className="flex flex-col gap-4">
        <PersonalTabs />
        <MonthSelector month={month} onChange={setMonth} />

        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && totals && <Dashboard totals={totals} />}
      </div>
    </AppShell>
  )
}
