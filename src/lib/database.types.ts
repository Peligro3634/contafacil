// Tipos manuales, alineados a mano con /supabase/migrations.
// Si más adelante se linkea el proyecto con `supabase link`, este archivo se
// puede regenerar con `supabase gen types typescript --linked`.

export type GroupType = 'familia' | 'viaje' | 'otro'
export type GroupRole = 'admin' | 'miembro'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          created_at?: string
        }
        Update: {
          name?: string
          email?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          name: string
          type: GroupType
          invite_code: string
          created_by: string
          created_at: string
        }
        Insert: never
        Update: {
          name?: string
          type?: GroupType
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
          role: GroupRole
          joined_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_group: {
        Args: { p_name: string; p_type: GroupType }
        Returns: Database['public']['Tables']['groups']['Row']
      }
      join_group_by_code: {
        Args: { p_invite_code: string }
        Returns: Database['public']['Tables']['groups']['Row']
      }
    }
    Enums: Record<string, never>
  }
}
