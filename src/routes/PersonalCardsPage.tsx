import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { MonthSelector } from '@/components/MonthSelector'
import { PersonalTabs } from '@/components/PersonalTabs'
import { useAuth } from '@/features/auth/AuthContext'
import {
  createCardPurchase,
  createCreditCard,
  deleteCardPurchase,
  fetchCardPurchasesByIds,
  fetchCreditCards,
  fetchInstallmentsForPeriod,
  updateCreditCard,
} from '@/features/cards/api'
import { closingPeriodForDueMonth, computeCardStatements } from '@/features/cards/aggregate'
import { CreateCreditCardForm } from '@/features/cards/CreateCreditCardForm'
import { CreditCardBlock } from '@/features/cards/CreditCardBlock'
import type { CardPurchase, CardPurchaseInstallment, CreditCard } from '@/features/cards/types'
import { currentMonthKey } from '@/lib/month'

async function loadPeriod(period: string) {
  const installments = await fetchInstallmentsForPeriod(period)
  const purchaseIds = [...new Set(installments.map((i) => i.card_purchase_id))]
  const purchases = await fetchCardPurchasesByIds(purchaseIds)
  return { installments, purchases }
}

// El selector de mes en esta pantalla representa el mes de VENCIMIENTO (el
// mismo sentido de "mes" que usa el dashboard), asi el usuario razona en
// terminos de "cuanto tengo que pagar este mes" y no de "mes de cierre".
export function PersonalCardsPage() {
  const { user } = useAuth()
  const [dueMonth, setDueMonth] = useState(currentMonthKey())
  const [cards, setCards] = useState<CreditCard[]>([])
  const [purchases, setPurchases] = useState<CardPurchase[]>([])
  const [installments, setInstallments] = useState<CardPurchaseInstallment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateCard, setShowCreateCard] = useState(false)

  const period = closingPeriodForDueMonth(dueMonth)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    Promise.all([fetchCreditCards(), loadPeriod(period)])
      .then(([fetchedCards, periodData]) => {
        if (!active) return
        setCards(fetchedCards)
        setPurchases(periodData.purchases)
        setInstallments(periodData.installments)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar las tarjetas')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [period])

  if (!user) return null

  const statements = computeCardStatements(cards, installments, purchases)

  async function refreshPeriod() {
    const periodData = await loadPeriod(period)
    setPurchases(periodData.purchases)
    setInstallments(periodData.installments)
  }

  return (
    <AppShell title="Tarjetas">
      <div className="flex flex-col gap-4">
        <PersonalTabs />
        <MonthSelector month={dueMonth} onChange={setDueMonth} />

        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            {cards.length === 0 && <p className="text-sm text-slate-500">Todavía no cargaste ninguna tarjeta.</p>}

            {statements.map((statement) => (
              <CreditCardBlock
                key={statement.card.id}
                statement={statement}
                dueMonth={dueMonth}
                monthDefaultDate={period}
                userId={user.id}
                onUpdateCard={async (input) => {
                  const updated = await updateCreditCard(statement.card.id, input)
                  setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
                }}
                onCreatePurchase={async (input) => {
                  await createCardPurchase(statement.card.id, input)
                  await refreshPeriod()
                }}
                onDeletePurchase={async (purchaseId) => {
                  await deleteCardPurchase(purchaseId)
                  await refreshPeriod()
                }}
                onPurchaseCaptured={async () => {
                  await refreshPeriod()
                }}
              />
            ))}

            {!showCreateCard ? (
              <button
                onClick={() => setShowCreateCard(true)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-900"
              >
                + Nueva tarjeta
              </button>
            ) : (
              <CreateCreditCardForm
                onSubmit={async (input) => {
                  const created = await createCreditCard(user.id, input)
                  setCards((prev) => [...prev, created])
                  setShowCreateCard(false)
                }}
                onCancel={() => setShowCreateCard(false)}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
