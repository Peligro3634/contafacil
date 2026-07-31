import { useState, type FormEvent } from 'react'
import type { CreditCard } from '@/features/cards/types'
import type { SavingsGoal } from '@/features/goals/types'
import { todayDateKey } from '@/lib/month'

export type NewExpenseInput =
  | { source: 'disponible'; category: string; amount: number }
  | { source: 'ahorro'; goalId: string; date: string; amount: number; note: string | null }
  | {
      source: 'tarjeta'
      cardId: string
      date: string
      description: string
      amount_total: number
      installments_count: number
    }

type ExpenseSource = NewExpenseInput['source']

const sourceLabels: Record<ExpenseSource, string> = {
  disponible: 'Disponible',
  ahorro: 'Ahorro',
  tarjeta: 'Tarjeta',
}

// Un unico punto de entrada para cargar un gasto sin tener que pensar en que
// pestaña corresponde: segun el origen elegido, el gasto sale del disponible
// del mes (variable_expenses, como siempre), de una Meta (retiro, resta de
// "Ahorrado" sin tocar el disponible) o de una tarjeta (compra en cuotas,
// tampoco toca el disponible de este mes — impacta cuando la cuota vence,
// igual que cargando la compra desde Tarjetas).
export function NewExpenseForm({
  goals,
  cards,
  onSubmit,
}: {
  goals: SavingsGoal[]
  cards: CreditCard[]
  onSubmit: (input: NewExpenseInput) => Promise<void>
}) {
  const [source, setSource] = useState<ExpenseSource>('disponible')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayDateKey())
  const [goalId, setGoalId] = useState(goals[0]?.id ?? '')
  const [cardId, setCardId] = useState(cards[0]?.id ?? '')
  const [installmentsCount, setInstallmentsCount] = useState('1')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const availableSources: ExpenseSource[] = [
    'disponible',
    ...(goals.length > 0 ? (['ahorro'] as const) : []),
    ...(cards.length > 0 ? (['tarjeta'] as const) : []),
  ]

  function reset() {
    setDescription('')
    setAmount('')
    setDate(todayDateKey())
    setInstallmentsCount('1')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const amountNum = Number(amount) || 0
      if (source === 'disponible') {
        await onSubmit({ source, category: description, amount: amountNum })
      } else if (source === 'ahorro') {
        await onSubmit({
          source,
          goalId,
          date,
          amount: amountNum,
          note: description.trim() === '' ? null : description.trim(),
        })
      } else {
        await onSubmit({
          source,
          cardId,
          date,
          description,
          amount_total: amountNum,
          installments_count: Number(installmentsCount) || 1,
        })
      }
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el gasto')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-medium text-brand-navy">Nuevo gasto</h2>

      {availableSources.length > 1 && (
        <div className="flex gap-2">
          {availableSources.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSource(value)}
              className={`min-h-11 flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                source === value
                  ? 'border-brand-navy bg-brand-navy text-white'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {sourceLabels[value]}
            </button>
          ))}
        </div>
      )}

      {source === 'disponible' && (
        <div className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Categoría (ej: Comida)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-base"
          />
          <input
            type="number"
            required
            min="0"
            step="1"
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-base"
          />
        </div>
      )}

      {source === 'ahorro' && (
        <>
          <label className="text-xs text-slate-500">
            Meta
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            >
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-base"
            />
            <input
              type="number"
              required
              min="0"
              step="1"
              placeholder="Monto"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-base"
            />
          </div>
          <input
            type="text"
            placeholder="Nota (ej: en qué se gastó)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-slate-500">
            Este gasto resta de lo ahorrado en la meta elegida y no afecta el disponible del mes.
          </p>
        </>
      )}

      {source === 'tarjeta' && (
        <>
          <label className="text-xs text-slate-500">
            Tarjeta
            <select
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            >
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </label>
          <input
            type="text"
            required
            placeholder="Descripción (ej: Zapatillas)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-base"
          />
          <div className="flex gap-2">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-base"
            />
            <input
              type="number"
              required
              min="0"
              step="1"
              placeholder="Monto total"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-base"
            />
            <label className="w-24 text-xs text-slate-500">
              Cuotas
              <input
                type="number"
                required
                min="1"
                step="1"
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900"
              />
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Este gasto se carga como compra de tarjeta y no afecta el disponible de este mes — impacta cuando venza
            cada cuota.
          </p>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="min-h-11 rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Cargando…' : 'Agregar gasto'}
      </button>
    </form>
  )
}
