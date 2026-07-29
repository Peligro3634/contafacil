import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProfileView() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Nombre</p>
        <p className="text-lg font-medium">{profile?.name ?? '—'}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
        <p className="text-lg font-medium">{profile?.email ?? user?.email}</p>
      </div>

      <button
        onClick={handleSignOut}
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 font-medium text-red-700"
      >
        Cerrar sesión
      </button>
    </div>
  )
}
