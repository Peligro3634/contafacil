import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { PersonalTabs } from '@/components/PersonalTabs'
import { useAuth } from '@/features/auth/AuthContext'
import { computePortfolioItemStatus, computePortfolioSummary } from '@/features/portfolio/aggregate'
import {
  createPortfolioItem,
  deletePortfolioItem,
  fetchPortfolio,
  updatePortfolioItem,
  updatePortfolioValue,
} from '@/features/portfolio/api'
import { PortfolioForm } from '@/features/portfolio/PortfolioForm'
import { PortfolioItemCard } from '@/features/portfolio/PortfolioItemCard'
import { PortfolioSummaryCard } from '@/features/portfolio/PortfolioSummaryCard'
import type { PortfolioItem } from '@/features/portfolio/types'

// Sin MonthSelector: la cartera es un estado presente (cuanto tengo hoy),
// no un registro mes a mes como ingresos/gastos/tarjetas.
export function PersonalSavingsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    fetchPortfolio()
      .then((data) => {
        if (active) setItems(data)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar la cartera')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  if (!user) return null

  const statuses = items.map(computePortfolioItemStatus)
  const summary = computePortfolioSummary(statuses)

  return (
    <AppShell title="Ahorros">
      <div className="flex flex-col gap-4">
        <PersonalTabs />

        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            <PortfolioSummaryCard summary={summary} />

            {items.length === 0 && (
              <p className="text-sm text-slate-500">Todavía no cargaste ningún instrumento en tu cartera.</p>
            )}

            {statuses.map((status) => (
              <PortfolioItemCard
                key={status.item.id}
                status={status}
                onUpdateItem={async (input) => {
                  const updated = await updatePortfolioItem(status.item.id, input)
                  setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
                }}
                onUpdateValue={async (value) => {
                  const updated = await updatePortfolioValue(status.item.id, value)
                  setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
                }}
                onDelete={async () => {
                  await deletePortfolioItem(status.item.id)
                  setItems((prev) => prev.filter((it) => it.id !== status.item.id))
                }}
              />
            ))}

            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-900"
              >
                + Nuevo instrumento
              </button>
            ) : (
              <PortfolioForm
                onSubmit={async (input) => {
                  const created = await createPortfolioItem(user.id, input)
                  setItems((prev) => [...prev, created])
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
