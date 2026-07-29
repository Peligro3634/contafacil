import { useState } from 'react'
import type { FixedExpense } from './types'

export function FixedExpenseRow({
  expense,
  amount,
  onSave,
}: {
  expense: FixedExpense
  amount: number
  onSave: (amount: number) => Promise<void>
}) {
  const [value, setValue] = useState(amount ? String(amount) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dirty = (Number(value) || 0) !== amount

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave(Number(value) || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex items-center gap-2">
        <p className="flex-1 text-sm">{expense.name}</p>
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm"
        />
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm font-medium text-slate-900 underline disabled:opacity-50"
          >
            {saving ? '…' : 'Guardar'}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
