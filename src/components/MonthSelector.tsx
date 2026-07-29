import { monthLabel, shiftMonth } from '@/lib/month'

export function MonthSelector({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
      <button
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="Mes anterior"
        className="px-3 py-1 text-lg text-slate-500"
      >
        ‹
      </button>
      <p className="font-medium capitalize">{monthLabel(month)}</p>
      <button
        onClick={() => onChange(shiftMonth(month, 1))}
        aria-label="Mes siguiente"
        className="px-3 py-1 text-lg text-slate-500"
      >
        ›
      </button>
    </div>
  )
}
