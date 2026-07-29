import { AppShell } from '@/components/AppShell'
import { ProfileView } from '@/features/auth/ProfileView'

export function ProfilePage() {
  return (
    <AppShell title="Perfil">
      <ProfileView />
    </AppShell>
  )
}
