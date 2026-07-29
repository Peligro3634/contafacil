import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { MonthSelector } from '@/components/MonthSelector'
import { PersonalTabs } from '@/components/PersonalTabs'
import { useAuth } from '@/features/auth/AuthContext'
import {
  createFixedExpense,
  createVariableExpense,
  deleteVariableExpense,
  fetchFixedExpenseEntries,
  fetchFixedExpenses,
  fetchVariableExpenses,
  upsertFixedExpenseEntry,
} from '@/features/personal/api'
import { CreateFixedExpenseForm } from '@/features/personal/CreateFixedExpenseForm'
import { CreateVariableExpenseForm } from '@/features/personal/CreateVariableExpenseForm'
import { FixedExpenseRow } from '@/features/personal/FixedExpenseRow'
import type { FixedExpense, FixedExpenseEntry, VariableExpense } from '@/features/personal/types'
import { VariableExpenseList } from '@/features/personal/VariableExpenseList'
import { currentMonthKey } from '@/lib/month'

export function PersonalExpensesPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonthKey())
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([])
  const [fixedEntries, setFixedEntries] = useState<FixedExpenseEntry[]>([])
  const [variableExpenses, setVariableExpenses] = useState<VariableExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateFixed, setShowCreateFixed] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    Promise.all([fetchFixedExpenses(), fetchFixedExpenseEntries(month), fetchVariableExpenses(month)])
      .then(([fe, fee, ve]) => {
        if (!active) return
        setFixedExpenses(fe)
        setFixedEntries(fee)
        setVariableExpenses(ve)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar los gastos')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [month])

  if (!user) return null

  const fixedAmountByExpenseId = new Map(fixedEntries.map((entry) => [entry.fixed_expense_id, entry.amount]))

  return (
    <AppShell title="Gastos">
      <div className="flex flex-col gap-4">
        <PersonalTabs />
        <MonthSelector month={month} onChange={setMonth} />

        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Gastos fijos</p>

              {fixedExpenses.length === 0 && (
                <p className="text-sm text-slate-500">Todavía no cargaste gastos fijos.</p>
              )}

              <div className="flex flex-col divide-y divide-slate-100">
                {fixedExpenses.map((expense) => (
                  <FixedExpenseRow
                    key={`${expense.id}-${month}`}
                    expense={expense}
                    amount={fixedAmountByExpenseId.get(expense.id) ?? 0}
                    onSave={async (amount) => {
                      const updated = await upsertFixedExpenseEntry(expense.id, month, amount)
                      setFixedEntries((prev) => [...prev.filter((e) => e.fixed_expense_id !== expense.id), updated])
                    }}
                  />
                ))}
              </div>

              {!showCreateFixed ? (
                <button
                  onClick={() => setShowCreateFixed(true)}
                  className="mt-3 text-sm font-medium text-slate-900 underline"
                >
                  + Nuevo gasto fijo
                </button>
              ) : (
                <div className="mt-3">
                  <CreateFixedExpenseForm
                    onSubmit={async (name) => {
                      const created = await createFixedExpense(user.id, name)
                      setFixedExpenses((prev) => [...prev, created])
                      setShowCreateFixed(false)
                    }}
                    onCancel={() => setShowCreateFixed(false)}
                  />
                </div>
              )}
            </div>

            <CreateVariableExpenseForm
              onSubmit={async (input) => {
                const created = await createVariableExpense(user.id, { ...input, month })
                setVariableExpenses((prev) => [created, ...prev])
              }}
            />

            <VariableExpenseList
              expenses={variableExpenses}
              onDelete={async (id) => {
                await deleteVariableExpense(id)
                setVariableExpenses((prev) => prev.filter((expense) => expense.id !== id))
              }}
            />
          </>
        )}
      </div>
    </AppShell>
  )
}
