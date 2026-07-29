import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { fetchMyGroups } from '@/features/groups/api'
import { CreateGroupForm } from '@/features/groups/CreateGroupForm'
import { JoinGroupForm } from '@/features/groups/JoinGroupForm'
import { GroupList } from '@/features/groups/GroupList'
import type { Group } from '@/features/groups/types'

export function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForms, setShowForms] = useState(false)
  const navigate = useNavigate()

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setGroups(await fetchMyGroups())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los grupos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function handleGroupReady(group: Group) {
    setShowForms(false)
    navigate(`/groups/${group.id}`)
  }

  return (
    <AppShell title="Grupos">
      <div className="flex flex-col gap-4">
        {loading && <p className="text-sm text-slate-500">Cargando…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            {/* Selector: si pertenece a más de un grupo, esta misma lista funciona
                como selector — cada item navega a la vista de ese grupo. */}
            <GroupList groups={groups} />

            {!showForms && (
              <button
                onClick={() => setShowForms(true)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-900"
              >
                Crear o unirme a un grupo
              </button>
            )}

            {showForms && (
              <div className="flex flex-col gap-4">
                <CreateGroupForm onCreated={handleGroupReady} />
                <JoinGroupForm onJoined={handleGroupReady} />
                <button onClick={() => setShowForms(false)} className="text-sm text-slate-500 underline">
                  Cancelar
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
