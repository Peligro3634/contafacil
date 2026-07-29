import { Link } from 'react-router-dom'
import type { Group } from './types'

const typeLabels: Record<Group['type'], string> = {
  familia: 'Familia',
  viaje: 'Viaje',
  otro: 'Otro',
}

export function GroupList({ groups }: { groups: Group[] }) {
  if (groups.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no pertenecés a ningún grupo.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {groups.map((group) => (
        <li key={group.id}>
          <Link
            to={`/groups/${group.id}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
          >
            <div>
              <p className="font-medium">{group.name}</p>
              <p className="text-sm text-slate-500">{typeLabels[group.type]}</p>
            </div>
            <span className="text-slate-400">›</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
