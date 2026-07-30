import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { MonthSelector } from '@/components/MonthSelector'
import { PersonalTabs } from '@/components/PersonalTabs'
import { useAuth } from '@/features/auth/AuthContext'
import { createIncomeEntry, createIncomeSource, deleteIncomeEntry, fetchIncomeEntries, fetchIncomeSources, updateIncomeEntry } from '@/features/personal/api'
import { CreateIncomeSourceForm } from '@/features/personal/CreateIncomeSourceForm'
import { IncomeSourceCard } from '@/features/personal/IncomeSourceCard'
import type { IncomeEntry, IncomeSource } from '@/features/personal/types'
import { currentMonthKey, monthRange } from '@/lib/month'

export function PersonalIncomePage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonthKey())
  const [sources, setSources] = useState<IncomeSource[]>([])
  const [entries, setEntries] = useState<IncomeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    const { start, end } = monthRange(month)

    Promise.all([fetchIncomeSources(), fetchIncomeEntries(start, end)])
      .then(([s, e]) => {
        if (!active) return
        setSources(s)
        setEntries(e)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar los ingresos')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [month])

  if (!user) return null

  return (
    <AppShell title="Ingresos">
      <div className="flex flex-col gap-4">
        <PersonalTabs />
        <MonthSelector month={month} onChange={setMonth} />

        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            {sources.length === 0 && (
              <p className="text-sm text-slate-500">Todavía no cargaste ninguna fuente de ingreso.</p>
            )}

            {sources.map((source) => (
              <IncomeSourceCard
                key={source.id}
                source={source}
                entries={entries.filter((entry) => entry.income_source_id === source.id)}
                monthDefaultDate={month}
                userId={user.id}
                onCreateEntry={async (values) => {
                  const created = await createIncomeEntry(source.id, values)
                  setEntries((prev) => [created, ...prev])
                }}
                onUpdateEntry={async (id, values) => {
                  const updated = await updateIncomeEntry(id, values)
                  setEntries((prev) => prev.map((entry) => (entry.id === id ? updated : entry)))
                }}
                onDeleteEntry={async (id) => {
                  await deleteIncomeEntry(id)
                  setEntries((prev) => prev.filter((entry) => entry.id !== id))
                }}
                onEntryCaptured={(entry) => setEntries((prev) => [entry, ...prev])}
              />
            ))}

            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-900"
              >
                + Nueva fuente de ingreso
              </button>
            )}

            {showCreateForm && (
              <CreateIncomeSourceForm
                onSubmit={async (input) => {
                  const created = await createIncomeSource(user.id, input)
                  setSources((prev) => [...prev, created])
                  setShowCreateForm(false)
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
