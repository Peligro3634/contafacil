import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { MonthSelector } from '@/components/MonthSelector'
import { PersonalTabs } from '@/components/PersonalTabs'
import { useAuth } from '@/features/auth/AuthContext'
import { createCardPurchase, fetchCreditCards } from '@/features/cards/api'
import type { CreditCard } from '@/features/cards/types'
import { createGoalWithdrawal, fetchSavingsGoals } from '@/features/goals/api'
import type { SavingsGoal } from '@/features/goals/types'
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
import { FixedExpenseRow } from '@/features/personal/FixedExpenseRow'
import { NewExpenseForm } from '@/features/personal/NewExpenseForm'
import type { FixedExpense, FixedExpenseEntry, VariableExpense } from '@/features/personal/types'
import { VariableExpenseList } from '@/features/personal/VariableExpenseList'
import { ReceiptCaptureFlow } from '@/features/receipts/ReceiptCaptureFlow'
import { currentMonthKey } from '@/lib/month'

export function PersonalExpensesPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonthKey())
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([])
  const [fixedEntries, setFixedEntries] = useState<FixedExpenseEntry[]>([])
  const [variableExpenses, setVariableExpenses] = useState<VariableExpense[]>([])
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateFixed, setShowCreateFixed] = useState(false)
  const [capturingExpense, setCapturingExpense] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    Promise.all([
      fetchFixedExpenses(),
      fetchFixedExpenseEntries(month),
      fetchVariableExpenses(month),
      fetchSavingsGoals(),
      fetchCreditCards(),
    ])
      .then(([fe, fee, ve, g, c]) => {
        if (!active) return
        setFixedExpenses(fe)
        setFixedEntries(fee)
        setVariableExpenses(ve)
        setGoals(g)
        setCards(c)
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

            <NewExpenseForm
              goals={goals}
              cards={cards}
              onSubmit={async (input) => {
                if (input.source === 'disponible') {
                  const created = await createVariableExpense(user.id, { category: input.category, month, amount: input.amount })
                  setVariableExpenses((prev) => [created, ...prev])
                } else if (input.source === 'ahorro') {
                  await createGoalWithdrawal(input.goalId, { date: input.date, amount: input.amount, note: input.note })
                } else {
                  await createCardPurchase(input.cardId, {
                    date: input.date,
                    description: input.description,
                    amount_total: input.amount_total,
                    installments_count: input.installments_count,
                    paid_installments_count: 0,
                  })
                }
              }}
            />

            {capturingExpense ? (
              <ReceiptCaptureFlow
                userId={user.id}
                relatedEntity="expense"
                onExpenseCreated={(expense) => {
                  setVariableExpenses((prev) => [expense, ...prev])
                  setCapturingExpense(false)
                }}
                onCancel={() => setCapturingExpense(false)}
              />
            ) : (
              <button
                onClick={() => setCapturingExpense(true)}
                className="text-sm font-medium text-slate-900 underline"
              >
                + Cargar gasto por foto/PDF
              </button>
            )}

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
