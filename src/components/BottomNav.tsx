import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/personal', label: 'Personal' },
  { to: '/groups', label: 'Grupos' },
  { to: '/profile', label: 'Perfil' },
]

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex">
        {navItems.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 text-sm font-medium ${
                  isActive ? 'text-brand-blue' : 'text-slate-400'
                }`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
