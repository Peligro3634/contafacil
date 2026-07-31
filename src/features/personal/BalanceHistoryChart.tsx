import { formatCurrency } from '@/lib/format'
import type { BalancePoint } from '@/lib/dashboard'

const SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function shortLabel(monthKey: string): string {
  const [, month] = monthKey.split('-').map(Number)
  return SHORT_MONTHS[month - 1]
}

// Chart de barras del "disponible del mes" (ingresos − gastos) mes a mes.
// SVG con viewBox fijo escalado al ancho del contenedor: cada barra sale de
// una línea base = 0, hacia arriba si el mes cerró en positivo y hacia abajo
// si cerró en negativo.
export function BalanceHistoryChart({ points }: { points: BalancePoint[] }) {
  const hasData = points.some((point) => point.available !== 0)
  if (points.length === 0 || !hasData) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Balance histórico</p>
        <p className="text-sm text-slate-500">
          Todavía no hay suficientes datos para mostrar la evolución del balance.
        </p>
      </div>
    )
  }

  const width = 320
  const height = 140
  const paddingTop = 8
  const paddingBottom = 22
  const plotHeight = height - paddingTop - paddingBottom

  const posMax = Math.max(0, ...points.map((point) => point.available))
  const negMax = Math.max(0, ...points.map((point) => -point.available))
  const range = posMax + negMax || 1
  const baselineY = paddingTop + (plotHeight * posMax) / range

  const slot = width / points.length
  const barWidth = Math.min(36, slot * 0.6)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">
        Balance histórico · disponible por mes
      </p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Disponible por mes">
        <line x1={0} y1={baselineY} x2={width} y2={baselineY} stroke="#e2e8f0" strokeWidth={1} />
        {points.map((point, index) => {
          const cx = slot * index + slot / 2
          const magnitude = (plotHeight * Math.abs(point.available)) / range
          const isPositive = point.available >= 0
          const barY = isPositive ? baselineY - magnitude : baselineY
          return (
            <g key={point.month}>
              <rect
                x={cx - barWidth / 2}
                y={barY}
                width={barWidth}
                height={Math.max(magnitude, 1)}
                rx={2}
                fill={isPositive ? '#059669' : '#dc2626'}
              />
              <text x={cx} y={height - 8} textAnchor="middle" className="fill-slate-500" fontSize={11}>
                {shortLabel(point.month)}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{shortLabel(points[0].month)}</span>
        <span className={points[points.length - 1].available >= 0 ? 'text-emerald-600' : 'text-red-600'}>
          Último: {formatCurrency(points[points.length - 1].available)}
        </span>
      </div>
    </div>
  )
}
