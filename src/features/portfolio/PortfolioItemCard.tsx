import { useState, type FormEvent } from 'react'
import { formatCurrency } from '@/lib/format'
import { PortfolioForm } from './PortfolioForm'
import type { PortfolioItemStatus } from './aggregate'
import type { PortfolioInstrumentType, PortfolioItemInput } from './types'

const typeLabels: Record<PortfolioInstrumentType, string> = {
  accion: 'Acción',
  cedear: 'CEDEAR',
  plazo_fijo: 'Plazo fijo',
  fondo: 'Fondo',
  cripto: 'Cripto',
  otro: 'Otro',
}

export function PortfolioItemCard({
  status,
  onUpdateItem,
  onUpdateValue,
  onDelete,
}: {
  status: PortfolioItemStatus
  onUpdateItem: (input: PortfolioItemInput) => Promise<void>
  onUpdateValue: (value: number) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const { item, capitalInvertido, gananciaPerdida, gananciaPct } = status
  const [editing, setEditing] = useState(false)
  const [newValue, setNewValue] = useState(String(item.current_value))
  const [updatingValue, setUpdatingValue] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpdateValue(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setUpdatingValue(true)
    try {
      await onUpdateValue(Number(newValue) || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el valor')
    } finally {
      setUpdatingValue(false)
    }
  }

  if (editing) {
    return (
      <PortfolioForm
        initial={item}
        onSubmit={async (input) => {
          await onUpdateItem(input)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">{typeLabels[item.instrument_type]}</p>
          {item.note && <p className="mt-1 text-xs text-slate-500">{item.note}</p>}
        </div>
        <div className="flex shrink-0 gap-2 text-xs">
          <button onClick={() => setEditing(true)} className="text-slate-500 underline">
            Editar
          </button>
          <button onClick={onDelete} className="text-red-600 underline">
            Eliminar
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-slate-500">Capital invertido</p>
          <p className="font-medium">{formatCurrency(capitalInvertido)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Valor actual</p>
          <p className="font-medium">{formatCurrency(item.current_value)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-slate-500">Ganancia / pérdida</p>
          <p className={`font-semibold ${gananciaPerdida >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(gananciaPerdida)} ({gananciaPct >= 0 ? '+' : ''}
            {gananciaPct.toFixed(1)}%)
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Valor actualizado el {new Date(item.updated_at).toLocaleDateString('es-AR')}
      </p>

      <form onSubmit={handleUpdateValue} className="mt-2 flex gap-2">
        <input
          type="number"
          min="0"
          step="any"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={updatingValue}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {updatingValue ? 'Guardando…' : 'Actualizar valor'}
        </button>
      </form>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
