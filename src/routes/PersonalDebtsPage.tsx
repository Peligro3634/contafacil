import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { PersonalTabs } from '@/components/PersonalTabs'
import { useAuth } from '@/features/auth/AuthContext'
import { computeDebtStatus, computeDebtsSummary } from '@/features/debts/aggregate'
import {
  createDebt,
  createDebtPayment,
  deleteDebt,
  deleteDebtPayment,
  fetchDebtPayments,
  fetchDebts,
  updateDebt,
} from '@/features/debts/api'
import { DebtCard } from '@/features/debts/DebtCard'
import { DebtForm } from '@/features/debts/DebtForm'
import { DebtsSummaryCard } from '@/features/debts/DebtsSummaryCard'
import type { Debt, DebtPayment } from '@/features/debts/types'

interface DebtData {
  debt: Debt
  payments: DebtPayment[]
}

// Sin MonthSelector: igual que Metas/Ahorros, una deuda es un estado
// presente (cuanto debo hoy), no un registro mes a mes.
export function PersonalDebtsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DebtData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    setError(null)

    fetchDebts()
      .then(async (debts) => {
        const loaded = await Promise.all(
          debts.map(async (debt) => ({ debt, payments: await fetchDebtPayments(debt.id) })),
        )
        if (active) setData(loaded)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar las deudas')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  if (!user) return null

  const statuses = data.map((d) => computeDebtStatus(d.debt, d.payments))
  const summary = computeDebtsSummary(statuses)

  function updateDebtData(debtId: string, updater: (d: DebtData) => DebtData) {
    setData((prev) => prev.map((d) => (d.debt.id === debtId ? updater(d) : d)))
  }

  return (
    <AppShell title="Deudas">
      <div className="flex flex-col gap-4">
        <PersonalTabs />

        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            <DebtsSummaryCard summary={summary} />

            {data.length === 0 && (
              <p className="text-sm text-slate-500">Todavía no cargaste ninguna deuda.</p>
            )}

            {data.map((d, i) => (
              <DebtCard
                key={d.debt.id}
                status={statuses[i]}
                payments={d.payments}
                onUpdateDebt={async (input) => {
                  const updated = await updateDebt(d.debt.id, input)
                  updateDebtData(d.debt.id, (prev) => ({ ...prev, debt: updated }))
                }}
                onDeleteDebt={async () => {
                  await deleteDebt(d.debt.id)
                  setData((prev) => prev.filter((item) => item.debt.id !== d.debt.id))
                }}
                onCreatePayment={async (input) => {
                  const created = await createDebtPayment(d.debt.id, input)
                  updateDebtData(d.debt.id, (prev) => ({ ...prev, payments: [...prev.payments, created] }))
                }}
                onDeletePayment={async (id) => {
                  await deleteDebtPayment(id)
                  updateDebtData(d.debt.id, (prev) => ({
                    ...prev,
                    payments: prev.payments.filter((p) => p.id !== id),
                  }))
                }}
              />
            ))}

            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-900"
              >
                + Nueva deuda
              </button>
            ) : (
              <DebtForm
                onSubmit={async (input) => {
                  const created = await createDebt(user.id, input)
                  setData((prev) => [...prev, { debt: created, payments: [] }])
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
