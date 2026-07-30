import { useState } from 'react'
import { formatCurrency } from '@/lib/format'
import { monthLabel } from '@/lib/month'
import { CardPurchaseForm } from './CardPurchaseForm'
import type { CardStatement } from './aggregate'
import type { CardPurchaseInput, CreditCard, CreditCardInput } from './types'

function EditCreditCardForm({
  card,
  onSave,
  onCancel,
}: {
  card: CreditCard
  onSave: (input: CreditCardInput) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(card.name)
  const [closingDay, setClosingDay] = useState(String(card.closing_day))
  const [dueDay, setDueDay] = useState(String(card.due_day))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave({ name, closing_day: Number(closingDay), due_day: Number(dueDay) })
      onCancel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <label className="flex-1 text-xs text-slate-500">
          Cierre
          <input
            type="number"
            min="1"
            max="31"
            value={closingDay}
            onChange={(e) => setClosingDay(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          />
        </label>
        <label className="flex-1 text-xs text-slate-500">
          Vencimiento
          <input
            type="number"
            min="1"
            max="31"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          />
        </label>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button onClick={onCancel} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
          Cancelar
        </button>
      </div>
    </div>
  )
}

export function CreditCardBlock({
  statement,
  dueMonth,
  monthDefaultDate,
  onUpdateCard,
  onCreatePurchase,
  onDeletePurchase,
}: {
  statement: CardStatement
  dueMonth: string
  monthDefaultDate: string
  onUpdateCard: (input: CreditCardInput) => Promise<void>
  onCreatePurchase: (input: CardPurchaseInput) => Promise<void>
  onDeletePurchase: (purchaseId: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [addingPurchase, setAddingPurchase] = useState(false)
  const { card, total, lines } = statement

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {editing ? (
        <EditCreditCardForm card={card} onSave={onUpdateCard} onCancel={() => setEditing(false)} />
      ) : (
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">{card.name}</p>
            <p className="text-xs text-slate-500">
              Cierra el {card.closing_day} · vence el {card.due_day}
            </p>
          </div>
          <button onClick={() => setEditing(true)} className="text-xs text-slate-500 underline">
            Editar
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
        <p className="text-xs text-slate-500">Vence en {monthLabel(dueMonth)}</p>
        <p className="font-semibold">{formatCurrency(total)}</p>
      </div>

      {lines.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-slate-100">
          {lines.map((line) => (
            <li key={`${line.purchaseId}-${line.installmentNumber}`} className="flex items-center justify-between gap-2 py-2 text-sm">
              <div>
                <p>{line.description}</p>
                <p className="text-slate-500">
                  {line.date}
                  {line.installmentsCount > 1 && ` · cuota ${line.installmentNumber}/${line.installmentsCount}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-medium">{formatCurrency(line.amount)}</span>
                <button onClick={() => onDeletePurchase(line.purchaseId)} className="text-red-600 underline">
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {addingPurchase ? (
        <div className="mt-3">
          <CardPurchaseForm
            defaultDate={monthDefaultDate}
            onSubmit={async (input) => {
              await onCreatePurchase(input)
              setAddingPurchase(false)
            }}
            onCancel={() => setAddingPurchase(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setAddingPurchase(true)}
          className="mt-3 text-sm font-medium text-slate-900 underline"
        >
          + Cargar compra
        </button>
      )}
    </div>
  )
}
