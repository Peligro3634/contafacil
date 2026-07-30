import { useState } from 'react'
import { formatCurrency } from '@/lib/format'
import { todayDateKey } from '@/lib/month'
import { CreateGoalContributionForm } from './CreateGoalContributionForm'
import { SavingsGoalForm } from './SavingsGoalForm'
import type { GoalStatus } from './aggregate'
import type { GoalContribution, GoalContributionInput, SavingsGoalInput } from './types'

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="mt-1 h-1.5 rounded-full bg-slate-100">
      <div className="h-1.5 rounded-full bg-slate-900" style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  )
}

export function GoalCard({
  status,
  contributions,
  onUpdateGoal,
  onDeleteGoal,
  onCreateContribution,
  onDeleteContribution,
}: {
  status: GoalStatus
  contributions: GoalContribution[]
  onUpdateGoal: (input: SavingsGoalInput) => Promise<void>
  onDeleteGoal: () => Promise<void>
  onCreateContribution: (input: GoalContributionInput) => Promise<void>
  onDeleteContribution: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const { goal } = status

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {editing ? (
        <SavingsGoalForm
          initial={goal}
          onSubmit={async (input) => {
            await onUpdateGoal(input)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">{goal.name}</p>
            <p className="text-xs text-slate-500">
              Objetivo: {formatCurrency(goal.target_amount)} para el {goal.target_date}
            </p>
          </div>
          <div className="flex shrink-0 gap-2 text-xs">
            <button onClick={() => setEditing(true)} className="text-slate-500 underline">
              Editar
            </button>
            <button onClick={onDeleteGoal} className="text-red-600 underline">
              Eliminar
            </button>
          </div>
        </div>
      )}

      <div className="mt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">{status.cumplida ? 'Meta cumplida' : 'Ahorrado'}</span>
          <span className="font-medium">
            {formatCurrency(status.ahorrado)} / {formatCurrency(goal.target_amount)}
          </span>
        </div>
        <ProgressBar pct={status.progresoPct} />
      </div>

      {!status.cumplida && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
          {status.vencida && <p className="mb-1 font-medium text-red-600">La fecha objetivo ya pasó</p>}
          <div className="flex justify-between">
            <span className="text-slate-500">Pendiente</span>
            <span>{formatCurrency(status.pendiente)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Cuota mensual sugerida</span>
            <span>{formatCurrency(status.cuotaMensualSugerida)}</span>
          </div>
        </div>
      )}

      <div className="mt-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Aportes</p>
        {contributions.length > 0 && (
          <ul className="mt-1 flex flex-col divide-y divide-slate-100">
            {contributions.map((contribution) => (
              <li key={contribution.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <p>{contribution.date}</p>
                  {contribution.note && <p className="text-slate-500">{contribution.note}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-medium">{formatCurrency(contribution.amount)}</span>
                  <button onClick={() => onDeleteContribution(contribution.id)} className="text-red-600 underline">
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {adding ? (
          <div className="mt-2">
            <CreateGoalContributionForm
              defaultDate={todayDateKey()}
              onSubmit={async (input) => {
                await onCreateContribution(input)
                setAdding(false)
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="mt-2 text-sm font-medium text-slate-900 underline">
            + Cargar aporte
          </button>
        )}
      </div>
    </div>
  )
}
