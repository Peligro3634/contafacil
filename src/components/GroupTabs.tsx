import { NavLink } from 'react-router-dom'

export function GroupTabs({ groupId }: { groupId: string }) {
  const tabs = [
    { to: `/groups/${groupId}`, label: 'Resumen', end: true },
    { to: `/groups/${groupId}/metas`, label: 'Metas', end: false },
    { to: `/groups/${groupId}/fondo`, label: 'Fondo común', end: false },
    { to: `/groups/${groupId}/gastos`, label: 'Gastos', end: false },
    { to: `/groups/${groupId}/emprendimientos`, label: 'Emprendimientos', end: false },
  ]

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
