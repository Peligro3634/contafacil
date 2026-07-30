// Tipos manuales, alineados a mano con /supabase/migrations.
// Si más adelante se linkea el proyecto con `supabase link`, este archivo se
// puede regenerar con `supabase gen types typescript --linked`.

export type GroupType = 'familia' | 'viaje' | 'otro'
export type GroupRole = 'admin' | 'miembro'

export type IncomeSourceOwnerType = 'user' | 'group'
export type IncomeSourceType = 'empleado_fijo' | 'monotributo' | 'responsable_inscripto'
export type ProductMode = 'simple' | 'detallado'
export type BusinessExpenseType = 'costo_mercaderia' | 'gasto_operativo'
export type GroupExpenseSource = 'fondo_comun' | 'personal'
export type ReceiptRelatedEntity = 'income_entry' | 'expense' | 'card_purchase'
export type ReceiptStatus = 'pendiente_confirmacion' | 'confirmado' | 'editado_manualmente'
export type ReceiptConfidence = 'alta' | 'media' | 'baja'
export type PortfolioInstrumentType = 'accion' | 'cedear' | 'plazo_fijo' | 'fondo' | 'cripto' | 'otro'

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
      credit_cards: {
        Row: {
          id: string
          user_id: string
          name: string
          closing_day: number
          due_day: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          closing_day: number
          due_day: number
          created_at?: string
        }
        Update: {
          name?: string
          closing_day?: number
          due_day?: number
        }
        Relationships: []
      }
      card_purchases: {
        Row: {
          id: string
          credit_card_id: string
          date: string
          amount_total: number
          description: string
          installments_count: number
          created_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      card_purchase_installments: {
        Row: {
          id: string
          card_purchase_id: string
          credit_card_id: string
          installment_number: number
          month: string
          amount: number
        }
        Insert: never
        Update: never
        Relationships: []
      }
      investments: {
        Row: {
          id: string
          income_source_id: string
          date: string
          amount: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          income_source_id: string
          date: string
          amount: number
          note?: string | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      business_expenses: {
        Row: {
          id: string
          income_source_id: string
          type: BusinessExpenseType
          category: string
          month: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          income_source_id: string
          type: BusinessExpenseType
          category: string
          month: string
          amount?: number
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      savings_goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_amount: number
          target_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target_amount: number
          target_date: string
          created_at?: string
        }
        Update: {
          name?: string
          target_amount?: number
          target_date?: string
        }
        Relationships: []
      }
      goal_contributions: {
        Row: {
          id: string
          savings_goal_id: string
          date: string
          amount: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          savings_goal_id: string
          date: string
          amount: number
          note?: string | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      group_goals: {
        Row: {
          id: string
          group_id: string
          name: string
          target_amount: number
          target_date: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          target_amount: number
          target_date: string
          created_at?: string
        }
        Update: {
          name?: string
          target_amount?: number
          target_date?: string
        }
        Relationships: []
      }
      group_goal_contributions: {
        Row: {
          id: string
          group_goal_id: string
          user_id: string
          date: string
          amount: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          group_goal_id: string
          user_id: string
          date: string
          amount: number
          note?: string | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      fund_contributions: {
        Row: {
          id: string
          group_id: string
          user_id: string
          date: string
          amount: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          date: string
          amount: number
          note?: string | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      group_expenses: {
        Row: {
          id: string
          group_id: string
          paid_by_user_id: string
          description: string
          amount: number
          month: string
          source: GroupExpenseSource
          created_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      group_expense_shares: {
        Row: {
          id: string
          group_expense_id: string
          user_id: string
          amount: number
        }
        Insert: never
        Update: never
        Relationships: []
      }
      income_source_partners: {
        Row: {
          id: string
          income_source_id: string
          user_id: string
          aporte_inicial: number
          participacion_pct: number
        }
        Insert: never
        Update: never
        Relationships: []
      }
      receipts: {
        Row: {
          id: string
          user_id: string
          related_entity: ReceiptRelatedEntity
          target_income_source_id: string | null
          target_credit_card_id: string | null
          file_path: string
          status: ReceiptStatus
          extracted_amount: number | null
          extracted_date: string | null
          extracted_note: string | null
          confidence: ReceiptConfidence | null
          requires_review: boolean | null
          review_reason: string | null
          extraction_input_tokens: number | null
          extraction_output_tokens: number | null
          created_income_entry_id: string | null
          created_expense_id: string | null
          created_card_purchase_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          related_entity: ReceiptRelatedEntity
          target_income_source_id?: string | null
          target_credit_card_id?: string | null
          file_path: string
          status?: ReceiptStatus
          extracted_amount?: number | null
          extracted_date?: string | null
          extracted_note?: string | null
          confidence?: ReceiptConfidence | null
          requires_review?: boolean | null
          review_reason?: string | null
          extraction_input_tokens?: number | null
          extraction_output_tokens?: number | null
          created_income_entry_id?: string | null
          created_expense_id?: string | null
          created_card_purchase_id?: string | null
          created_at?: string
        }
        Update: {
          status?: ReceiptStatus
          extracted_amount?: number | null
          extracted_date?: string | null
          extracted_note?: string | null
          confidence?: ReceiptConfidence | null
          requires_review?: boolean | null
          review_reason?: string | null
          extraction_input_tokens?: number | null
          extraction_output_tokens?: number | null
          created_income_entry_id?: string | null
          created_expense_id?: string | null
          created_card_purchase_id?: string | null
        }
        Relationships: []
      }
      investment_portfolio: {
        Row: {
          id: string
          user_id: string
          instrument_type: PortfolioInstrumentType
          name: string
          quantity: number
          purchase_price: number
          purchase_date: string
          current_value: number
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          instrument_type: PortfolioInstrumentType
          name: string
          quantity: number
          purchase_price: number
          purchase_date: string
          current_value?: number
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          instrument_type?: PortfolioInstrumentType
          name?: string
          quantity?: number
          purchase_price?: number
          purchase_date?: string
          current_value?: number
          note?: string | null
          updated_at?: string
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
      create_card_purchase: {
        Args: {
          p_credit_card_id: string
          p_date: string
          p_amount_total: number
          p_description: string
          p_installments_count: number
        }
        Returns: Database['public']['Tables']['card_purchases']['Row']
      }
      delete_card_purchase: {
        Args: { p_purchase_id: string }
        Returns: undefined
      }
      create_group_expense: {
        Args: {
          p_group_id: string
          p_description: string
          p_amount: number
          p_month: string
          p_source: GroupExpenseSource
          p_shares: { user_id: string; amount: number }[] | null
        }
        Returns: Database['public']['Tables']['group_expenses']['Row']
      }
      create_group_income_source: {
        Args: {
          p_group_id: string
          p_type: IncomeSourceType
          p_name: string
          p_product_mode: ProductMode
          p_partners: { user_id: string; participacion_pct: number; aporte_inicial: number }[]
        }
        Returns: Database['public']['Tables']['income_sources']['Row']
      }
    }
    Enums: Record<string, never>
  }
}
