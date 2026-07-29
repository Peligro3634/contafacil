import type { Database } from '@/lib/database.types'

export type Group = Database['public']['Tables']['groups']['Row']
export type GroupType = Database['public']['Tables']['groups']['Row']['type']
export type GroupRole = Database['public']['Tables']['group_members']['Row']['role']

export interface GroupMember {
  user_id: string
  role: GroupRole
  joined_at: string
  profile: {
    id: string
    name: string
    email: string
  } | null
}
