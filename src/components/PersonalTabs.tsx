import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/personal', label: 'Resumen', end: true },
  { to: '/personal/ingresos', label: 'Ingresos', end: false },
  { to: '/personal/gastos', label: 'Gastos', end: false },
]

export function PersonalTabs() {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
              isActive ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-500'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
