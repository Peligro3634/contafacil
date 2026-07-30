import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { MonthSelector } from '@/components/MonthSelector'
import { PersonalTabs } from '@/components/PersonalTabs'
import {
  createBusinessExpense,
  createInvestment,
  deleteBusinessExpense,
  deleteInvestment,
  fetchBusinessExpensesForSource,
  fetchInvestments,
} from '@/features/investments/api'
import {
  computeConsolidatedStatus,
  computeEmprendimientoStatus,
  computeMonthlyPnL,
} from '@/features/investments/aggregate'
import { ConsolidatedSummary } from '@/features/investments/ConsolidatedSummary'
import { EmprendimientoBlock } from '@/features/investments/EmprendimientoBlock'
import type { BusinessExpense, Investment } from '@/features/investments/types'
import { fetchIncomeEntriesForSource, fetchIncomeSources } from '@/features/personal/api'
import type { IncomeEntry, IncomeSource } from '@/features/personal/types'
import { currentMonthKey } from '@/lib/month'

interface EmprendimientoData {
  incomeSource: IncomeSource
  investments: Investment[]
  entries: IncomeEntry[]
  expenses: BusinessExpense[]
}

// La carga de datos NO depende del mes seleccionado: se traen ingresos,
// aportes y costos historicos completos una sola vez, y el mes elegido solo
// recorta que datos se muestran (computeMonthlyPnL), sin volver a pedirlos.
export function PersonalInvestmentsPage() {
  const [month, setMonth] = useState(currentMonthKey())
  const [data, setData] = useState<EmprendimientoData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    fetchIncomeSources()
      .then(async (sources) => {
        const emprendimientos = sources.filter((s) => s.type === 'monotributo' || s.type === 'responsable_inscripto')
        const loaded = await Promise.all(
          emprendimientos.map(async (incomeSource) => {
            const [investments, entries, expenses] = await Promise.all([
              fetchInvestments(incomeSource.id),
              fetchIncomeEntriesForSource(incomeSource.id),
              fetchBusinessExpensesForSource(incomeSource.id),
            ])
            return { incomeSource, investments, entries, expenses }
          }),
        )
        if (!active) return
        setData(loaded)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar los emprendimientos')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const statuses = data.map((d) => computeEmprendimientoStatus(d.incomeSource, d.investments, d.entries, d.expenses))
  const consolidated = computeConsolidatedStatus(statuses)

  function updateSource(incomeSourceId: string, updater: (d: EmprendimientoData) => EmprendimientoData) {
    setData((prev) => prev.map((d) => (d.incomeSource.id === incomeSourceId ? updater(d) : d)))
  }

  return (
    <AppShell title="Inversiones">
      <div className="flex flex-col gap-4">
        <PersonalTabs />
        <MonthSelector month={month} onChange={setMonth} />

        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            {data.length === 0 && (
              <p className="text-sm text-slate-500">
                Todavía no tenés emprendimientos cargados. Agregá una fuente de ingreso de tipo monotributo o
                responsable inscripto en la pestaña Ingresos.
              </p>
            )}

            <ConsolidatedSummary status={consolidated} />

            {data.map((d, i) => (
              <EmprendimientoBlock
                key={d.incomeSource.id}
                status={statuses[i]}
                monthlyPnL={computeMonthlyPnL(d.entries, d.expenses, month)}
                month={month}
                investments={d.investments}
                monthExpenses={d.expenses.filter((e) => e.month === month)}
                onCreateInvestment={async (input) => {
                  const created = await createInvestment(d.incomeSource.id, input)
                  updateSource(d.incomeSource.id, (prev) => ({ ...prev, investments: [...prev.investments, created] }))
                }}
                onDeleteInvestment={async (id) => {
                  await deleteInvestment(id)
                  updateSource(d.incomeSource.id, (prev) => ({
                    ...prev,
                    investments: prev.investments.filter((inv) => inv.id !== id),
                  }))
                }}
                onCreateBusinessExpense={async (input) => {
                  const created = await createBusinessExpense(d.incomeSource.id, month, input)
                  updateSource(d.incomeSource.id, (prev) => ({ ...prev, expenses: [...prev.expenses, created] }))
                }}
                onDeleteBusinessExpense={async (id) => {
                  await deleteBusinessExpense(id)
                  updateSource(d.incomeSource.id, (prev) => ({
                    ...prev,
                    expenses: prev.expenses.filter((exp) => exp.id !== id),
                  }))
                }}
              />
            ))}
          </>
        )}
      </div>
    </AppShell>
  )
}
