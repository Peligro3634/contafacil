import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { fetchGroup, fetchGroupMembers } from '@/features/groups/api'
import { GroupDetail } from '@/features/groups/GroupDetail'
import type { Group, GroupMember } from '@/features/groups/types'

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!groupId) return
    setLoading(true)
    setError(null)
    Promise.all([fetchGroup(groupId), fetchGroupMembers(groupId)])
      .then(([g, m]) => {
        setGroup(g)
        setMembers(m)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el grupo'))
      .finally(() => setLoading(false))
  }, [groupId])

  return (
    <AppShell title={group?.name ?? 'Grupo'}>
      <div className="flex flex-col gap-4">
        <Link to="/groups" className="text-sm text-slate-500 underline">
          ‹ Volver a grupos
        </Link>

        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && group && <GroupDetail group={group} members={members} />}
      </div>
    </AppShell>
  )
}
