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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          id: string
          user_id: string
          company_name: string | null
          cnpj: string | null
          phone: string | null
          email: string | null
          website: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name?: string | null
          cnpj?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string | null
          cnpj?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }

      clients: {
        Row: {
          id: string
          name: string
          email: string | null
          company: string | null
          phone: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          company?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          company?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_services: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          base_price: number
          features: string[]
          category: string
          icon: string
          popular: boolean
          created_at: string
          updated_at: string
          billing_type: Database["public"]["Enums"]["billing_type"] // Added billing_type
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description: string
          base_price?: number
          features?: string[]
          category: string
          icon?: string
          popular?: boolean
          created_at?: string
          updated_at?: string
          billing_type?: Database["public"]["Enums"]["billing_type"] // Added billing_type
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          base_price?: number
          features?: string[]
          category?: string
          icon?: string
          popular?: boolean
          created_at?: string
          updated_at?: string
          billing_type?: Database["public"]["Enums"]["billing_type"] // Added billing_type
        }
        Relationships: [
          {
            foreignKeyName: "custom_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          owner: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          owner: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          owner?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          }
        ]
      }
      proposals: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          id: string
          owner: string
          status: string
          title: string
          updated_at: string
          share_token: string | null
          notes: string | null // Added notes column
          payment_type: string | null // Added payment_type
          cash_discount_percentage: number | null // Added cash_discount_percentage
          installment_number: number | null // Added installment_number
          installment_value: number | null // Added installment_value
          manual_installment_total: number | null // Added manual_installment_total
          is_validity_enabled: boolean | null // Added is_validity_enabled
          validity_days: number | null // Added validity_days
          proposal_logo_url: string | null // Added proposal_logo_url
          proposal_gradient_theme: string | null // Added proposal_gradient_theme
          expected_close_date: string | null // NEW: expected_close_date
        }
        Insert: {
          amount?: number
          client_id?: string | null
          created_at?: string
          id?: string
          owner: string
          status?: string
          title: string
          updated_at?: string
          share_token?: string
          notes?: string | null // Added notes column
          payment_type?: string | null // Added payment_type
          cash_discount_percentage?: number | null // Added cash_discount_percentage
          installment_number?: number | null // Added installment_number
          installment_value?: number | null // Added installment_value
          manual_installment_total?: number | null // Added manual_installment_total
          is_validity_enabled?: boolean | null // Added is_validity_enabled
          validity_days?: number | null // Added validity_days
          proposal_logo_url?: string | null // Added proposal_logo_url
          proposal_gradient_theme?: string | null // Added proposal_gradient_theme
          expected_close_date?: string | null // NEW: expected_close_date
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          id?: string
          owner?: string
          status?: string
          title?: string
          updated_at?: string
          share_token?: string
          notes?: string | null // Added notes column
          payment_type?: string | null // Added payment_type
          cash_discount_percentage?: number | null // Added cash_discount_percentage
          installment_number?: number | null // Added installment_number
          installment_value?: number | null // Added installment_value
          manual_installment_total?: number | null // Added manual_installment_total
          is_validity_enabled?: boolean | null // Added is_validity_enabled
          validity_days?: number | null // Added validity_days
          proposal_logo_url?: string | null // Added proposal_logo_url
          proposal_gradient_theme?: string | null // Added proposal_gradient_theme
          expected_close_date?: string | null // NEW: expected_close_date
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_services: { // New table proposal_services
        Row: {
          id: string
          proposal_id: string
          service_id: string
          name: string
          description: string | null
          base_price: number
          quantity: number
          custom_price: number | null
          discount: number
          discount_percentage: number
          discount_type: string
          features: string[]
          category: string | null
          icon: string | null
          is_custom: boolean
          billing_type: Database["public"]["Enums"]["billing_type"]
          created_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          service_id: string
          name: string
          description?: string | null
          base_price: number
          quantity?: number
          custom_price?: number | null
          discount?: number
          discount_percentage?: number
          discount_type?: string
          features?: string[]
          category?: string | null
          icon?: string | null
          is_custom?: boolean
          billing_type?: Database["public"]["Enums"]["billing_type"]
          created_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          service_id?: string
          name?: string
          description?: string | null
          base_price?: number
          quantity?: number
          custom_price?: number | null
          discount?: number
          discount_percentage?: number
          discount_type?: string
          features?: string[]
          category?: string | null
          icon?: string | null
          is_custom?: boolean
          billing_type?: Database["public"]["Enums"]["billing_type"]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_services_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          status: string
          due_date: string | null
          owner: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          status?: string
          due_date?: string | null
          owner: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          status?: string
          due_date?: string | null
          owner?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      billing_type: "one_time" | "monthly" // New ENUM type
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
      billing_type: {
        one_time: "one_time",
        monthly: "monthly",
      },
    },
  },
} as const