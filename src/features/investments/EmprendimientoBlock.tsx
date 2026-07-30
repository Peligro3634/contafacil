import { useState } from 'react'
import type { IncomeSourceType } from '@/features/personal/types'
import { formatCurrency } from '@/lib/format'
import { monthLabel } from '@/lib/month'
import { CreateBusinessExpenseForm } from './CreateBusinessExpenseForm'
import { CreateInvestmentForm } from './CreateInvestmentForm'
import type { EmprendimientoStatus, MonthlyPnL } from './aggregate'
import type { BusinessExpense, BusinessExpenseInput, Investment, InvestmentInput } from './types'

const typeLabels: Record<IncomeSourceType, string> = {
  empleado_fijo: 'Sueldo fijo',
  monotributo: 'Monotributo',
  responsable_inscripto: 'Responsable inscripto',
}

const expenseTypeLabels: Record<BusinessExpense['type'], string> = {
  costo_mercaderia: 'Mercadería',
  gasto_operativo: 'Operativo',
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="mt-1 h-1.5 rounded-full bg-slate-100">
      <div className="h-1.5 rounded-full bg-slate-900" style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  )
}

export function EmprendimientoBlock({
  status,
  monthlyPnL,
  month,
  investments,
  monthExpenses,
  // Oculta las altas/bajas de aportes y gastos (RLS ya las bloquea para
  // quien no sea socio de un emprendimiento de grupo, pero ocultarlas evita
  // mostrar un formulario que va a fallar al enviarse).
  readOnly = false,
  onCreateInvestment,
  onDeleteInvestment,
  onCreateBusinessExpense,
  onDeleteBusinessExpense,
}: {
  status: EmprendimientoStatus
  monthlyPnL: MonthlyPnL
  month: string
  investments: Investment[]
  monthExpenses: BusinessExpense[]
  readOnly?: boolean
  onCreateInvestment?: (input: InvestmentInput) => Promise<void>
  onDeleteInvestment?: (id: string) => Promise<void>
  onCreateBusinessExpense?: (input: BusinessExpenseInput) => Promise<void>
  onDeleteBusinessExpense?: (id: string) => Promise<void>
}) {
  const [addingInvestment, setAddingInvestment] = useState(false)
  const [addingExpense, setAddingExpense] = useState(false)
  const { incomeSource } = status

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <p className="font-medium">{incomeSource.name}</p>
        <p className="text-xs uppercase tracking-wide text-slate-500">{typeLabels[incomeSource.type]}</p>
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">{status.recuperada ? 'Inversión recuperada' : 'Recuperando inversión'}</span>
          <span className="font-medium">{formatCurrency(status.recuperado)} / {formatCurrency(status.capitalInvertido)}</span>
        </div>
        <ProgressBar pct={status.progresoPct} />
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-slate-500">Pendiente de recuperar</p>
            <p className="font-medium">{formatCurrency(status.pendiente)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Ganancia (post-recupero)</p>
            <p className="font-medium text-emerald-600">{formatCurrency(status.gananciaPostRecupero)}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Resultado de {monthLabel(month)}</p>
        <div className="mt-2 flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Ingresos</span>
            <span>{formatCurrency(monthlyPnL.ingresosDelMes)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Costo de mercadería</span>
            <span>-{formatCurrency(monthlyPnL.costoMercaderiaDelMes)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Margen bruto</span>
            <span>{formatCurrency(monthlyPnL.margenBruto)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Gastos operativos</span>
            <span>-{formatCurrency(monthlyPnL.gastoOperativoDelMes)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold">
            <span>Utilidad del mes</span>
            <span className={monthlyPnL.utilidadDelMes >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {formatCurrency(monthlyPnL.utilidadDelMes)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Aportes de capital</p>
        {investments.length > 0 && (
          <ul className="mt-1 flex flex-col divide-y divide-slate-100">
            {investments.map((investment) => (
              <li key={investment.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <p>{investment.date}</p>
                  {investment.note && <p className="text-slate-500">{investment.note}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-medium">{formatCurrency(investment.amount)}</span>
                  {!readOnly && onDeleteInvestment && (
                    <button onClick={() => onDeleteInvestment(investment.id)} className="text-red-600 underline">
                      Eliminar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {!readOnly &&
          onCreateInvestment &&
          (addingInvestment ? (
            <div className="mt-2">
              <CreateInvestmentForm
                defaultDate={month}
                onSubmit={async (input) => {
                  await onCreateInvestment(input)
                  setAddingInvestment(false)
                }}
                onCancel={() => setAddingInvestment(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingInvestment(true)}
              className="mt-2 text-sm font-medium text-slate-900 underline"
            >
              + Nuevo aporte
            </button>
          ))}
      </div>

      <div className="mt-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Gastos del negocio en {monthLabel(month)}</p>
        {monthExpenses.length > 0 && (
          <ul className="mt-1 flex flex-col divide-y divide-slate-100">
            {monthExpenses.map((expense) => (
              <li key={expense.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <p>{expense.category}</p>
                  <p className="text-slate-500">{expenseTypeLabels[expense.type]}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-medium">{formatCurrency(expense.amount)}</span>
                  {!readOnly && onDeleteBusinessExpense && (
                    <button onClick={() => onDeleteBusinessExpense(expense.id)} className="text-red-600 underline">
                      Eliminar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {!readOnly &&
          onCreateBusinessExpense &&
          (addingExpense ? (
            <div className="mt-2">
              <CreateBusinessExpenseForm
                onSubmit={async (input) => {
                  await onCreateBusinessExpense(input)
                  setAddingExpense(false)
                }}
              />
              <button onClick={() => setAddingExpense(false)} className="mt-2 text-sm text-slate-500 underline">
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingExpense(true)}
              className="mt-2 text-sm font-medium text-slate-900 underline"
            >
              + Nuevo gasto
            </button>
          ))}
      </div>
    </div>
  )
}
