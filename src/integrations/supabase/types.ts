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
    PostgrestVersion: "14.5"
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
      clients: {
        Row: {
          company: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          company_name: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      custom_services: {
        Row: {
          base_price: number
          billing_type: Database["public"]["Enums"]["billing_type"]
          category: string
          created_at: string
          description: string
          features: string[]
          icon: string
          id: string
          name: string
          popular: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          base_price?: number
          billing_type?: Database["public"]["Enums"]["billing_type"]
          category: string
          created_at?: string
          description: string
          features?: string[]
          icon?: string
          id?: string
          name: string
          popular?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          base_price?: number
          billing_type?: Database["public"]["Enums"]["billing_type"]
          category?: string
          created_at?: string
          description?: string
          features?: string[]
          icon?: string
          id?: string
          name?: string
          popular?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      folders: {
        Row: {
          color: string | null
          created_at: string
          custom_statuses: Json | null
          description: string | null
          icon: string | null
          id: string
          name: string
          position: number
          space_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          custom_statuses?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          position?: number
          space_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          custom_statuses?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          position?: number
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          owner: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          owner: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          owner?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          owner: string
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner: string
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner?: string
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "legacy_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          color: string | null
          created_at: string
          custom_statuses: Json | null
          description: string | null
          folder_id: string | null
          icon: string | null
          id: string
          name: string
          position: number
          space_id: string | null
          updated_at: string
          workspace_folder_id: string | null
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          custom_statuses?: Json | null
          description?: string | null
          folder_id?: string | null
          icon?: string | null
          id?: string
          name: string
          position?: number
          space_id?: string | null
          updated_at?: string
          workspace_folder_id?: string | null
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          custom_statuses?: Json | null
          description?: string | null
          folder_id?: string | null
          icon?: string | null
          id?: string
          name?: string
          position?: number
          space_id?: string | null
          updated_at?: string
          workspace_folder_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_folder_space_fkey"
            columns: ["folder_id", "space_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id", "space_id"]
          },
          {
            foreignKeyName: "lists_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lists_workspace_folder_workspace_fkey"
            columns: ["workspace_folder_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_folders"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "lists_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_services: {
        Row: {
          base_price: number
          billing_type: Database["public"]["Enums"]["billing_type"]
          category: string | null
          created_at: string | null
          custom_price: number | null
          description: string | null
          discount: number | null
          discount_percentage: number | null
          discount_type: string | null
          features: string[] | null
          icon: string | null
          id: string
          is_custom: boolean | null
          name: string
          proposal_id: string
          quantity: number
          service_id: string
        }
        Insert: {
          base_price: number
          billing_type?: Database["public"]["Enums"]["billing_type"]
          category?: string | null
          created_at?: string | null
          custom_price?: number | null
          description?: string | null
          discount?: number | null
          discount_percentage?: number | null
          discount_type?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string
          is_custom?: boolean | null
          name: string
          proposal_id: string
          quantity?: number
          service_id: string
        }
        Update: {
          base_price?: number
          billing_type?: Database["public"]["Enums"]["billing_type"]
          category?: string | null
          created_at?: string | null
          custom_price?: number | null
          description?: string | null
          discount?: number | null
          discount_percentage?: number | null
          discount_type?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string
          is_custom?: boolean | null
          name?: string
          proposal_id?: string
          quantity?: number
          service_id?: string
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
      proposals: {
        Row: {
          amount: number
          approved_at: string | null
          cash_discount_percentage: number | null
          client_id: string | null
          created_at: string
          expected_close_date: string | null
          id: string
          installment_number: number | null
          installment_value: number | null
          is_validity_enabled: boolean | null
          manual_installment_total: number | null
          notes: string | null
          owner: string
          payment_type: string | null
          proposal_gradient_theme: string | null
          proposal_logo_url: string | null
          share_token: string | null
          show_interest_rate: boolean
          status: string
          title: string
          updated_at: string
          validity_days: number | null
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          cash_discount_percentage?: number | null
          client_id?: string | null
          created_at?: string
          expected_close_date?: string | null
          id?: string
          installment_number?: number | null
          installment_value?: number | null
          is_validity_enabled?: boolean | null
          manual_installment_total?: number | null
          notes?: string | null
          owner: string
          payment_type?: string | null
          proposal_gradient_theme?: string | null
          proposal_logo_url?: string | null
          share_token?: string | null
          show_interest_rate?: boolean
          status?: string
          title: string
          updated_at?: string
          validity_days?: number | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          cash_discount_percentage?: number | null
          client_id?: string | null
          created_at?: string
          expected_close_date?: string | null
          id?: string
          installment_number?: number | null
          installment_value?: number | null
          is_validity_enabled?: boolean | null
          manual_installment_total?: number | null
          notes?: string | null
          owner?: string
          payment_type?: string | null
          proposal_gradient_theme?: string | null
          proposal_logo_url?: string | null
          share_token?: string | null
          show_interest_rate?: boolean
          status?: string
          title?: string
          updated_at?: string
          validity_days?: number | null
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
      spaces: {
        Row: {
          color: string | null
          created_at: string
          custom_statuses: Json
          description: string | null
          icon: string | null
          id: string
          name: string
          position: number
          status: string
          updated_at: string
          workspace_folder_id: string | null
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          custom_statuses?: Json
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          position?: number
          status?: string
          updated_at?: string
          workspace_folder_id?: string | null
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          custom_statuses?: Json
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          position?: number
          status?: string
          updated_at?: string
          workspace_folder_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_workspace_folder_workspace_fkey"
            columns: ["workspace_folder_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_folders"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "spaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          creator_id: string
          description: string | null
          due_date: string | null
          id: string
          parent_subtask_id: string | null
          position: number
          priority: string
          status: string
          task_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_subtask_id?: string | null
          position?: number
          priority?: string
          status?: string
          task_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_subtask_id?: string | null
          position?: number
          priority?: string
          status?: string
          task_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_parent_task_fkey"
            columns: ["parent_subtask_id", "task_id"]
            isOneToOne: false
            referencedRelation: "subtasks"
            referencedColumns: ["id", "task_id"]
          },
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          creator_id: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          list_id: string
          position: number
          priority: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          list_id: string
          position?: number
          priority?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          list_id?: string
          position?: number
          priority?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_folders: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          position: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          position?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          position?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          owner: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          owner: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          owner?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dashboard_values_by_month: {
        Args: { p_from: string; p_to: string; p_user: string }
        Returns: {
          closed_total: number
          generated_total: number
          month_label: string
          month_start: string
          proposals_count: number
        }[]
      }
      get_public_proposal_by_token: {
        Args: { p_share_token: string }
        Returns: Json
      }
      proposals_aggregate: {
        Args: {
          p_from: string
          p_granularity?: string
          p_to: string
          p_user: string
        }
        Returns: {
          approved_count: number
          bucket_label: string
          bucket_start: string
          total_amount: number
          total_count: number
        }[]
      }
      update_editable_proposal: {
        Args: {
          p_expected_updated_at: string
          p_new_client?: Json
          p_proposal: Json
          p_proposal_id: string
          p_services: Json
        }
        Returns: {
          committed_share_token: string
          committed_status: string
          committed_updated_at: string
          proposal_id: string
        }[]
      }
    }
    Enums: {
      billing_type: "one_time" | "monthly"
      task_priority: "Baixa" | "Media" | "Alta" | "Urgente"
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
      billing_type: ["one_time", "monthly"],
      task_priority: ["Baixa", "Media", "Alta", "Urgente"],
    },
  },
} as const
