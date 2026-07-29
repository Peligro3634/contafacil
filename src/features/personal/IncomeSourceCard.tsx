import { useState } from 'react'
import { formatCurrency } from '@/lib/format'
import { IncomeEntryForm } from './IncomeEntryForm'
import type { IncomeEntry, IncomeEntryInput, IncomeSource } from './types'

const typeLabels: Record<IncomeSource['type'], string> = {
  empleado_fijo: 'Sueldo fijo',
  monotributo: 'Monotributo',
  responsable_inscripto: 'Responsable inscripto',
}

export function IncomeSourceCard({
  source,
  entries,
  monthDefaultDate,
  onCreateEntry,
  onUpdateEntry,
  onDeleteEntry,
}: {
  source: IncomeSource
  entries: IncomeEntry[]
  monthDefaultDate: string
  onCreateEntry: (values: IncomeEntryInput) => Promise<void>
  onUpdateEntry: (id: string, values: IncomeEntryInput) => Promise<void>
  onDeleteEntry: (id: string) => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const total = entries.reduce((sum, entry) => sum + entry.base_amount + entry.extra_amount, 0)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{source.name}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">{typeLabels[source.type]}</p>
        </div>
        <p className="font-semibold">{formatCurrency(total)}</p>
      </div>

      {entries.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-slate-100">
          {entries.map((entry) =>
            editingId === entry.id ? (
              <li key={entry.id} className="py-2">
                <IncomeEntryForm
                  defaultDate={monthDefaultDate}
                  initial={entry}
                  onSubmit={async (values) => {
                    await onUpdateEntry(entry.id, values)
                    setEditingId(null)
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={entry.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <p>
                    {entry.date}
                    {entry.note ? ` · ${entry.note}` : ''}
                  </p>
                  <p className="text-slate-500">
                    {formatCurrency(entry.base_amount)}
                    {entry.extra_amount > 0 && ` + ${formatCurrency(entry.extra_amount)} extra`}
                    {entry.units_sold != null && ` · ${entry.units_sold} u.`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => setEditingId(entry.id)} className="text-slate-500 underline">
                    Editar
                  </button>
                  <button onClick={() => onDeleteEntry(entry.id)} className="text-red-600 underline">
                    Eliminar
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {adding ? (
        <div className="mt-3">
          <IncomeEntryForm
            defaultDate={monthDefaultDate}
            onSubmit={async (values) => {
              await onCreateEntry(values)
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-3 text-sm font-medium text-slate-900 underline">
          + Cargar ingreso
        </button>
      )}
    </div>
  )
}
