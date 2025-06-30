export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          updated_at?: string
        }
        Relationships: []
      }
      composition_ingredients: {
        Row: {
          amount: number
          composition_id: string
          created_at: string
          id: string
          ingredient_name: string
          unit: string
        }
        Insert: {
          amount: number
          composition_id: string
          created_at?: string
          id?: string
          ingredient_name: string
          unit?: string
        }
        Update: {
          amount?: number
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
          is_reversed: boolean
          quantity: number
          reversed_at: string | null
          total_price: number
          unit_price: number
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
          is_reversed?: boolean
          quantity: number
          reversed_at?: string | null
          total_price: number
          unit_price: number
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
          is_reversed?: boolean
          quantity?: number
          reversed_at?: string | null
          total_price?: number
          unit_price?: number
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
