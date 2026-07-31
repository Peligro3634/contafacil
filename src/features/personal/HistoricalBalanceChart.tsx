import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/format'
import type { MonthlyBalancePoint } from '@/lib/dashboardHistory'

const compactCurrency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function HistoricalBalanceChart({ history }: { history: MonthlyBalancePoint[] }) {
  const hasData = history.some((point) => point.ingresos > 0 || point.gastos > 0)
  if (!hasData) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-xs uppercase tracking-wide text-slate-500">Balance histórico</h2>
      <p className="mt-1 text-sm text-slate-500">Ingresos y gastos por mes, con el balance acumulado</p>

      <div className="mt-3 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => compactCurrency.format(value)}
              width={56}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              labelStyle={{ color: '#0D1B2A', fontWeight: 600 }}
              contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
            />
            <Bar dataKey="ingresos" name="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastos" name="Gastos" fill="#DC2626" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="disponibleAcumulado"
              name="Balance acumulado"
              stroke="#2563EB"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
