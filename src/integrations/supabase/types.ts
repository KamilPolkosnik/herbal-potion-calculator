export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          company_address: string | null
          company_email: string | null
          company_name: string
          company_phone: string | null
          company_tax_id: string | null
          company_website: string | null
          created_at: string
          id: string
          is_vat_registered: boolean
          show_ues_generator: boolean
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          company_address?: string | null
          company_email?: string | null
          company_name: string
          company_phone?: string | null
          company_tax_id?: string | null
          company_website?: string | null
          created_at?: string
          id?: string
          is_vat_registered?: boolean
          show_ues_generator?: boolean
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          company_address?: string | null
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          company_tax_id?: string | null
          company_website?: string | null
          created_at?: string
          id?: string
          is_vat_registered?: boolean
          show_ues_generator?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      composition_ingredients: {
        Row: {
          amount: number
          category: string
          composition_id: string
          created_at: string
          id: string
          ingredient_name: string
          unit: string
        }
        Insert: {
          amount: number
          category?: string
          composition_id: string
          created_at?: string
          id?: string
          ingredient_name: string
          unit?: string
        }
        Update: {
          amount?: number
          category?: string
          composition_id?: string
          created_at?: string
          id?: string
          ingredient_name?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "composition_ingredients_composition_id_fkey"
            columns: ["composition_id"]
            isOneToOne: false
            referencedRelation: "compositions"
            referencedColumns: ["id"]
          },
        ]
      }
      compositions: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          sale_price: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sale_price?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sale_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      cost_invoices: {
        Row: {
          amount: number | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          invoice_month: number
          invoice_year: number
          mime_type: string
          original_name: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          invoice_month: number
          invoice_year: number
          mime_type: string
          original_name: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          invoice_month?: number
          invoice_year?: number
          mime_type?: string
          original_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ingredient_movements: {
        Row: {
          created_at: string
          id: string
          ingredient_name: string
          is_archived: boolean | null
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes: string | null
          quantity_change: number
          reference_id: string | null
          reference_type: string | null
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_name: string
          is_archived?: boolean | null
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          quantity_change: number
          reference_id?: string | null
          reference_type?: string | null
          unit: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_name?: string
          is_archived?: boolean | null
          movement_type?: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          quantity_change?: number
          reference_id?: string | null
          reference_type?: string | null
          unit?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          amount: number
          created_at: string
          id: string
          name: string
          price: number
          unit: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          name: string
          price?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          name?: string
          price?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_costs: {
        Row: {
          amount: number
          category: string
          cost_month: number
          cost_year: number
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string
          cost_month: number
          cost_year: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          cost_month?: number
          cost_year?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_transactions: {
        Row: {
          buyer_address: string | null
          buyer_email: string | null
          buyer_name: string | null
          buyer_phone: string | null
          buyer_tax_id: string | null
          composition_id: string
          composition_name: string
          created_at: string
          id: string
          invoice_number: number
          is_reversed: boolean
          quantity: number
          receipt_number: number | null
          reversed_at: string | null
          total_price: number
          unit_price: number
          was_vat_registered: boolean
        }
        Insert: {
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          buyer_tax_id?: string | null
          composition_id: string
          composition_name: string
          created_at?: string
          id?: string
          invoice_number?: number
          is_reversed?: boolean
          quantity: number
          receipt_number?: number | null
          reversed_at?: string | null
          total_price: number
          unit_price: number
          was_vat_registered?: boolean
        }
        Update: {
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          buyer_tax_id?: string | null
          composition_id?: string
          composition_name?: string
          created_at?: string
          id?: string
          invoice_number?: number
          is_reversed?: boolean
          quantity?: number
          receipt_number?: number | null
          reversed_at?: string | null
          total_price?: number
          unit_price?: number
          was_vat_registered?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sales_transactions_composition_id_fkey"
            columns: ["composition_id"]
            isOneToOne: false
            referencedRelation: "compositions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_ingredient_usage: {
        Row: {
          created_at: string
          id: string
          ingredient_name: string
          quantity_used: number
          transaction_id: string
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_name: string
          quantity_used: number
          transaction_id: string
          unit: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_name?: string
          quantity_used?: number
          transaction_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_ingredient_usage_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "sales_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      warning_thresholds: {
        Row: {
          created_at: string
          herbs_threshold: number
          id: string
          oils_threshold: number
          others_threshold: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          herbs_threshold?: number
          id?: string
          oils_threshold?: number
          others_threshold?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          herbs_threshold?: number
          id?: string
          oils_threshold?: number
          others_threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_receipt_number: {
        Args: { p_transaction_id: string }
        Returns: number
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      update_ingredient_amount: {
        Args: { amount_change: number; ingredient_name: string }
        Returns: undefined
      }
    }
    Enums: {
      movement_type: "purchase" | "sale" | "reversal" | "adjustment"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      movement_type: ["purchase", "sale", "reversal", "adjustment"],
    },
  },
} as const
