// Tipos manuales, alineados a mano con /supabase/migrations.
// Si más adelante se linkea el proyecto con `supabase link`, este archivo se
// puede regenerar con `supabase gen types typescript --linked`.

export type GroupType = 'familia' | 'viaje' | 'otro'
export type GroupRole = 'admin' | 'miembro'

export type IncomeSourceOwnerType = 'user' | 'group'
export type IncomeSourceType = 'empleado_fijo' | 'monotributo' | 'responsable_inscripto'
export type ProductMode = 'simple' | 'detallado'

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
      income_sources: {
        Row: {
          id: string
          owner_type: IncomeSourceOwnerType
          owner_id: string
          type: IncomeSourceType
          name: string
          product_mode: ProductMode
          created_at: string
        }
        Insert: {
          id?: string
          owner_type: IncomeSourceOwnerType
          owner_id: string
          type: IncomeSourceType
          name: string
          product_mode?: ProductMode
          created_at?: string
        }
        Update: {
          name?: string
          type?: IncomeSourceType
          product_mode?: ProductMode
        }
        Relationships: []
      }
      income_entries: {
        Row: {
          id: string
          income_source_id: string
          date: string
          base_amount: number
          extra_amount: number
          units_sold: number | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          income_source_id: string
          date: string
          base_amount?: number
          extra_amount?: number
          units_sold?: number | null
          note?: string | null
          created_at?: string
        }
        Update: {
          date?: string
          base_amount?: number
          extra_amount?: number
          units_sold?: number | null
          note?: string | null
        }
        Relationships: []
      }
      fixed_expenses: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          name?: string
        }
        Relationships: []
      }
      fixed_expense_entries: {
        Row: {
          id: string
          fixed_expense_id: string
          month: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          fixed_expense_id: string
          month: string
          amount?: number
          created_at?: string
        }
        Update: {
          amount?: number
        }
        Relationships: []
      }
      variable_expenses: {
        Row: {
          id: string
          user_id: string
          category: string
          month: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          month: string
          amount?: number
          created_at?: string
        }
        Update: {
          category?: string
          amount?: number
        }
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
