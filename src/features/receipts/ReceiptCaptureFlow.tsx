import { useState, type FormEvent } from 'react'
import { createIncomeEntry, createVariableExpense } from '@/features/personal/api'
import type { IncomeEntry, VariableExpense } from '@/features/personal/types'
import { monthKeyFromDate, todayDateKey } from '@/lib/month'
import { createReceipt, discardReceipt, extractReceipt, markReceiptConfirmed, uploadReceiptFile } from './api'
import type { Receipt } from './types'

type Step = 'idle' | 'uploading' | 'extracting' | 'confirming' | 'submitting'

// Comprobante (foto/PDF) para una venta/ingreso o un gasto variable: sube el
// archivo, dispara la extraccion por IA (Edge Function extract-receipt) y
// muestra una pantalla de confirmacion editable antes de crear el registro
// final — nunca se guarda el income_entry/variable_expense directo desde lo
// que devuelve la IA.
export function ReceiptCaptureFlow({
  userId,
  relatedEntity,
  targetIncomeSourceId,
  defaultCategory,
  onIncomeEntryCreated,
  onExpenseCreated,
  onCancel,
}: {
  userId: string
  relatedEntity: 'income_entry' | 'expense'
  targetIncomeSourceId?: string
  defaultCategory?: string
  onIncomeEntryCreated?: (entry: IncomeEntry) => void
  onExpenseCreated?: (expense: VariableExpense) => void
  onCancel?: () => void
}) {
  const [step, setStep] = useState<Step>('idle')
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState(defaultCategory ?? '')

  async function handleFileSelected(file: File) {
    setError(null)
    setStep('uploading')
    try {
      const path = await uploadReceiptFile(userId, file)
      const created = await createReceipt(userId, {
        related_entity: relatedEntity,
        target_income_source_id: relatedEntity === 'income_entry' ? (targetIncomeSourceId ?? null) : null,
        file_path: path,
      })
      setReceipt(created)
      setStep('extracting')

      const extraction = await extractReceipt(created.id)
      setAmount(extraction.amount != null ? String(extraction.amount) : '')
      setDate(extraction.date ?? todayDateKey())
      setNote(extraction.note ?? '')
      setReceipt({
        ...created,
        extracted_amount: extraction.amount,
        extracted_date: extraction.date,
        extracted_note: extraction.note,
        confidence: extraction.confidence,
        requires_review: extraction.requires_review,
        review_reason: extraction.review_reason,
      })
      setStep('confirming')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar el comprobante')
      setStep('idle')
    }
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault()
    if (!receipt) return
    setError(null)
    setStep('submitting')
    try {
      const wasEdited =
        Number(amount) !== (receipt.extracted_amount ?? Number(amount)) ||
        date !== (receipt.extracted_date ?? date) ||
        note !== (receipt.extracted_note ?? note)
      const status = wasEdited ? 'editado_manualmente' : 'confirmado'

      if (relatedEntity === 'income_entry') {
        if (!targetIncomeSourceId) throw new Error('Falta la fuente de ingreso')
        const createdEntry = await createIncomeEntry(targetIncomeSourceId, {
          date,
          base_amount: Number(amount) || 0,
          extra_amount: 0,
          units_sold: null,
          note: note.trim() === '' ? null : note.trim(),
        })
        await markReceiptConfirmed(receipt.id, status, { incomeEntryId: createdEntry.id })
        onIncomeEntryCreated?.(createdEntry)
      } else {
        const createdExpense = await createVariableExpense(userId, {
          category: category.trim() === '' ? 'Comprobante' : category.trim(),
          month: monthKeyFromDate(date),
          amount: Number(amount) || 0,
        })
        await markReceiptConfirmed(receipt.id, status, { expenseId: createdExpense.id })
        onExpenseCreated?.(createdExpense)
      }

      setReceipt(null)
      setAmount('')
      setDate('')
      setNote('')
      setStep('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo confirmar el comprobante')
      setStep('confirming')
    }
  }

  async function handleDiscard() {
    if (receipt) {
      try {
        await discardReceipt(receipt)
      } catch {
        // si falla el borrado del archivo/fila no bloqueamos al usuario
      }
    }
    setReceipt(null)
    setError(null)
    setStep('idle')
    onCancel?.()
  }

  if (step === 'idle') {
    return (
      <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3">
        <label className="text-sm font-medium text-slate-900">Cargar por foto o PDF</label>
        <input
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelected(file)
          }}
          className="text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-slate-500 underline">
            Cancelar
          </button>
        )}
      </div>
    )
  }

  if (step === 'uploading' || step === 'extracting') {
    return (
      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
        {step === 'uploading' ? 'Subiendo comprobante…' : 'Leyendo comprobante con IA…'}
      </div>
    )
  }

  return (
    <form onSubmit={handleConfirm} className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">Confirmá los datos del comprobante</p>

      {receipt?.requires_review && (
        <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">
          Revisá con atención: {receipt.review_reason ?? 'la IA no está segura de estos datos'}
        </p>
      )}
      {receipt?.confidence && <p className="text-xs text-slate-500">Confianza de la extracción: {receipt.confidence}</p>}

      <input
        type="number"
        required
        min="0"
        step="1"
        placeholder="Monto"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        type="date"
        required
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {relatedEntity === 'expense' && (
        <input
          type="text"
          required
          placeholder="Categoría"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      )}
      <input
        type="text"
        placeholder="Nota (opcional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={step === 'submitting'}
          className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {step === 'submitting' ? 'Guardando…' : 'Confirmar y guardar'}
        </button>
        <button type="button" onClick={handleDiscard} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          Descartar
        </button>
      </div>
    </form>
  )
}
