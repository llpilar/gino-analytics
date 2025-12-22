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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      cloaked_links: {
        Row: {
          allowed_countries: string[] | null
          allowed_devices: string[] | null
          behavior_time_ms: number | null
          block_bots: boolean
          blocked_countries: string[] | null
          clicks_count: number
          collect_fingerprint: boolean | null
          created_at: string
          id: string
          is_active: boolean
          min_score: number | null
          name: string
          require_behavior: boolean | null
          safe_url: string
          slug: string
          target_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_countries?: string[] | null
          allowed_devices?: string[] | null
          behavior_time_ms?: number | null
          block_bots?: boolean
          blocked_countries?: string[] | null
          clicks_count?: number
          collect_fingerprint?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean
          min_score?: number | null
          name: string
          require_behavior?: boolean | null
          safe_url: string
          slug: string
          target_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_countries?: string[] | null
          allowed_devices?: string[] | null
          behavior_time_ms?: number | null
          block_bots?: boolean
          blocked_countries?: string[] | null
          clicks_count?: number
          collect_fingerprint?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean
          min_score?: number | null
          name?: string
          require_behavior?: boolean | null
          safe_url?: string
          slug?: string
          target_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cloaker_visitors: {
        Row: {
          audio_hash: string | null
          canvas_hash: string | null
          city: string | null
          color_depth: number | null
          country_code: string | null
          created_at: string
          decision: string
          device_memory: number | null
          fingerprint_hash: string
          focus_changes: number | null
          fonts_hash: string | null
          hardware_concurrency: number | null
          has_phantom: boolean | null
          has_puppeteer: boolean | null
          has_selenium: boolean | null
          has_webdriver: boolean | null
          id: string
          ip_address: string | null
          is_automated: boolean | null
          is_bot: boolean | null
          is_datacenter: boolean | null
          is_headless: boolean | null
          is_proxy: boolean | null
          is_tor: boolean | null
          is_vpn: boolean | null
          isp: string | null
          keypress_events: number | null
          language: string | null
          link_id: string | null
          mouse_movements: number | null
          platform: string | null
          plugins_count: number | null
          score: number
          score_automation: number | null
          score_behavior: number | null
          score_fingerprint: number | null
          score_network: number | null
          screen_resolution: string | null
          scroll_events: number | null
          time_on_page: number | null
          timezone: string | null
          touch_support: boolean | null
          user_agent: string | null
          webgl_renderer: string | null
          webgl_vendor: string | null
        }
        Insert: {
          audio_hash?: string | null
          canvas_hash?: string | null
          city?: string | null
          color_depth?: number | null
          country_code?: string | null
          created_at?: string
          decision: string
          device_memory?: number | null
          fingerprint_hash: string
          focus_changes?: number | null
          fonts_hash?: string | null
          hardware_concurrency?: number | null
          has_phantom?: boolean | null
          has_puppeteer?: boolean | null
          has_selenium?: boolean | null
          has_webdriver?: boolean | null
          id?: string
          ip_address?: string | null
          is_automated?: boolean | null
          is_bot?: boolean | null
          is_datacenter?: boolean | null
          is_headless?: boolean | null
          is_proxy?: boolean | null
          is_tor?: boolean | null
          is_vpn?: boolean | null
          isp?: string | null
          keypress_events?: number | null
          language?: string | null
          link_id?: string | null
          mouse_movements?: number | null
          platform?: string | null
          plugins_count?: number | null
          score?: number
          score_automation?: number | null
          score_behavior?: number | null
          score_fingerprint?: number | null
          score_network?: number | null
          screen_resolution?: string | null
          scroll_events?: number | null
          time_on_page?: number | null
          timezone?: string | null
          touch_support?: boolean | null
          user_agent?: string | null
          webgl_renderer?: string | null
          webgl_vendor?: string | null
        }
        Update: {
          audio_hash?: string | null
          canvas_hash?: string | null
          city?: string | null
          color_depth?: number | null
          country_code?: string | null
          created_at?: string
          decision?: string
          device_memory?: number | null
          fingerprint_hash?: string
          focus_changes?: number | null
          fonts_hash?: string | null
          hardware_concurrency?: number | null
          has_phantom?: boolean | null
          has_puppeteer?: boolean | null
          has_selenium?: boolean | null
          has_webdriver?: boolean | null
          id?: string
          ip_address?: string | null
          is_automated?: boolean | null
          is_bot?: boolean | null
          is_datacenter?: boolean | null
          is_headless?: boolean | null
          is_proxy?: boolean | null
          is_tor?: boolean | null
          is_vpn?: boolean | null
          isp?: string | null
          keypress_events?: number | null
          language?: string | null
          link_id?: string | null
          mouse_movements?: number | null
          platform?: string | null
          plugins_count?: number | null
          score?: number
          score_automation?: number | null
          score_behavior?: number | null
          score_fingerprint?: number | null
          score_network?: number | null
          screen_resolution?: string | null
          scroll_events?: number | null
          time_on_page?: number | null
          timezone?: string | null
          touch_support?: boolean | null
          user_agent?: string | null
          webgl_renderer?: string | null
          webgl_vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cloaker_visitors_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "cloaked_links"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          expense_date: string
          id: string
          paid_by: string
          receipt_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          paid_by: string
          receipt_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          paid_by?: string
          receipt_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      facebook_connections: {
        Row: {
          access_token: string
          created_at: string
          facebook_user_id: string | null
          facebook_user_name: string | null
          id: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          facebook_user_id?: string | null
          facebook_user_name?: string | null
          id?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          facebook_user_id?: string | null
          facebook_user_name?: string | null
          id?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fixed_expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          id: string
          is_active: boolean
          paid_by: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          paid_by: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          paid_by?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      partners_config: {
        Row: {
          created_at: string
          id: string
          partner1_name: string
          partner2_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          partner1_name?: string
          partner2_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          partner1_name?: string
          partner2_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          id: string
          last_active_at: string | null
          last_login_at: string | null
          login_count: number | null
          name: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          id: string
          last_active_at?: string | null
          last_login_at?: string | null
          login_count?: number | null
          name?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          last_active_at?: string | null
          last_login_at?: string | null
          login_count?: number | null
          name?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          config: Json
          configured_by: string | null
          created_at: string
          id: string
          integration_type: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          configured_by?: string | null
          created_at?: string
          id?: string
          integration_type: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          configured_by?: string | null
          created_at?: string
          id?: string
          integration_type?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          partner_name: string
          updated_at: string
          user_id: string | null
          withdrawal_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          partner_name: string
          updated_at?: string
          user_id?: string | null
          withdrawal_date?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          partner_name?: string
          updated_at?: string
          user_id?: string | null
          withdrawal_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_login_count: { Args: { user_id: string }; Returns: undefined }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
      make_user_admin: { Args: { _user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
      user_status: "pending" | "approved" | "rejected" | "suspended"
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
      app_role: ["admin", "user"],
      user_status: ["pending", "approved", "rejected", "suspended"],
    },
  },
} as const
