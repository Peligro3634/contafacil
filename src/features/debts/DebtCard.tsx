import { useState } from 'react'
import { formatCurrency } from '@/lib/format'
import { todayDateKey } from '@/lib/month'
import { DebtForm } from './DebtForm'
import { DebtPaymentForm } from './DebtPaymentForm'
import type { DebtStatus } from './aggregate'
import type { DebtInput, DebtPayment, DebtPaymentInput, DebtPaymentSource } from './types'

const sourceLabels: Record<DebtPaymentSource, string> = {
  efectivo: 'Efectivo',
  cuenta_bancaria: 'Cuenta bancaria',
  ahorros: 'Ahorros',
  otro: 'Otro',
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="mt-1 h-1.5 rounded-full bg-slate-100">
      <div className="h-1.5 rounded-full bg-brand-emerald" style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  )
}

export function DebtCard({
  status,
  payments,
  onUpdateDebt,
  onDeleteDebt,
  onCreatePayment,
  onDeletePayment,
}: {
  status: DebtStatus
  payments: DebtPayment[]
  onUpdateDebt: (input: DebtInput) => Promise<void>
  onDeleteDebt: () => Promise<void>
  onCreatePayment: (input: DebtPaymentInput) => Promise<void>
  onDeletePayment: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [paying, setPaying] = useState(false)
  const { debt } = status

  if (editing) {
    return (
      <DebtForm
        initial={debt}
        onSubmit={async (input) => {
          await onUpdateDebt(input)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-brand-navy">{debt.name}</p>
          <p className="text-xs text-slate-500">Desde {debt.start_date}</p>
          {debt.note && <p className="mt-1 text-xs text-slate-500">{debt.note}</p>}
        </div>
        <div className="flex shrink-0 gap-2 text-xs">
          <button onClick={() => setEditing(true)} className="text-slate-500 underline">
            Editar
          </button>
          <button onClick={onDeleteDebt} className="text-red-600 underline">
            Eliminar
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">{status.pagada ? 'Deuda saldada' : 'Pagado'}</span>
          <span className="font-medium">
            {formatCurrency(status.pagado)} / {formatCurrency(debt.original_amount)}
          </span>
        </div>
        <ProgressBar pct={status.progresoPct} />
      </div>

      {!status.pagada && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Pendiente</span>
            <span className="font-semibold text-red-600">{formatCurrency(status.pendiente)}</span>
          </div>
          {status.cuotaSugerida != null && (
            <div className="mt-1 flex justify-between">
              <span className="text-slate-500">Cuota sugerida ({debt.installments_count})</span>
              <span>{formatCurrency(status.cuotaSugerida)}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Pagos</p>
        {payments.length > 0 && (
          <ul className="mt-1 flex flex-col divide-y divide-slate-100">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <p>{payment.date}</p>
                  <p className="text-slate-500">
                    {sourceLabels[payment.source]}
                    {payment.note ? ` · ${payment.note}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-medium">{formatCurrency(payment.amount)}</span>
                  <button onClick={() => onDeletePayment(payment.id)} className="text-red-600 underline">
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!status.pagada &&
          (paying ? (
            <div className="mt-2">
              <DebtPaymentForm
                defaultDate={todayDateKey()}
                onSubmit={async (input) => {
                  await onCreatePayment(input)
                  setPaying(false)
                }}
                onCancel={() => setPaying(false)}
              />
            </div>
          ) : (
            <button onClick={() => setPaying(true)} className="mt-2 text-sm font-medium text-brand-blue underline">
              + Registrar pago
            </button>
          ))}
      </div>
    </div>
  )
}
