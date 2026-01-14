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
          allow_social_previews: boolean | null
          allowed_countries: string[] | null
          allowed_devices: string[] | null
          allowed_hours_end: number | null
          allowed_hours_start: number | null
          allowed_languages: string[] | null
          allowed_referers: string[] | null
          auto_blacklist_enabled: boolean | null
          auto_blacklist_threshold: number | null
          behavior_time_ms: number | null
          blacklist_ips: string[] | null
          block_bots: boolean
          block_datacenter: boolean | null
          block_proxy: boolean | null
          block_tor: boolean | null
          block_vpn: boolean | null
          blocked_asns: string[] | null
          blocked_countries: string[] | null
          blocked_isps: string[] | null
          blocked_languages: string[] | null
          blocked_referers: string[] | null
          blocked_url_params: Json | null
          clicks_count: number
          clicks_today: number | null
          collect_fingerprint: boolean | null
          created_at: string
          custom_user_agents: string[] | null
          id: string
          is_active: boolean
          last_click_reset: string | null
          max_clicks_daily: number | null
          max_clicks_total: number | null
          min_score: number | null
          name: string
          passthrough_utm: boolean | null
          rate_limit_per_ip: number | null
          rate_limit_window_minutes: number | null
          redirect_delay_ms: number | null
          require_behavior: boolean | null
          required_url_params: Json | null
          safe_url: string
          slug: string
          target_url: string
          target_urls: Json | null
          updated_at: string
          user_id: string
          webhook_enabled: boolean | null
          webhook_events: string[] | null
          webhook_url: string | null
          whitelist_ips: string[] | null
        }
        Insert: {
          allow_social_previews?: boolean | null
          allowed_countries?: string[] | null
          allowed_devices?: string[] | null
          allowed_hours_end?: number | null
          allowed_hours_start?: number | null
          allowed_languages?: string[] | null
          allowed_referers?: string[] | null
          auto_blacklist_enabled?: boolean | null
          auto_blacklist_threshold?: number | null
          behavior_time_ms?: number | null
          blacklist_ips?: string[] | null
          block_bots?: boolean
          block_datacenter?: boolean | null
          block_proxy?: boolean | null
          block_tor?: boolean | null
          block_vpn?: boolean | null
          blocked_asns?: string[] | null
          blocked_countries?: string[] | null
          blocked_isps?: string[] | null
          blocked_languages?: string[] | null
          blocked_referers?: string[] | null
          blocked_url_params?: Json | null
          clicks_count?: number
          clicks_today?: number | null
          collect_fingerprint?: boolean | null
          created_at?: string
          custom_user_agents?: string[] | null
          id?: string
          is_active?: boolean
          last_click_reset?: string | null
          max_clicks_daily?: number | null
          max_clicks_total?: number | null
          min_score?: number | null
          name: string
          passthrough_utm?: boolean | null
          rate_limit_per_ip?: number | null
          rate_limit_window_minutes?: number | null
          redirect_delay_ms?: number | null
          require_behavior?: boolean | null
          required_url_params?: Json | null
          safe_url: string
          slug: string
          target_url: string
          target_urls?: Json | null
          updated_at?: string
          user_id: string
          webhook_enabled?: boolean | null
          webhook_events?: string[] | null
          webhook_url?: string | null
          whitelist_ips?: string[] | null
        }
        Update: {
          allow_social_previews?: boolean | null
          allowed_countries?: string[] | null
          allowed_devices?: string[] | null
          allowed_hours_end?: number | null
          allowed_hours_start?: number | null
          allowed_languages?: string[] | null
          allowed_referers?: string[] | null
          auto_blacklist_enabled?: boolean | null
          auto_blacklist_threshold?: number | null
          behavior_time_ms?: number | null
          blacklist_ips?: string[] | null
          block_bots?: boolean
          block_datacenter?: boolean | null
          block_proxy?: boolean | null
          block_tor?: boolean | null
          block_vpn?: boolean | null
          blocked_asns?: string[] | null
          blocked_countries?: string[] | null
          blocked_isps?: string[] | null
          blocked_languages?: string[] | null
          blocked_referers?: string[] | null
          blocked_url_params?: Json | null
          clicks_count?: number
          clicks_today?: number | null
          collect_fingerprint?: boolean | null
          created_at?: string
          custom_user_agents?: string[] | null
          id?: string
          is_active?: boolean
          last_click_reset?: string | null
          max_clicks_daily?: number | null
          max_clicks_total?: number | null
          min_score?: number | null
          name?: string
          passthrough_utm?: boolean | null
          rate_limit_per_ip?: number | null
          rate_limit_window_minutes?: number | null
          redirect_delay_ms?: number | null
          require_behavior?: boolean | null
          required_url_params?: Json | null
          safe_url?: string
          slug?: string
          target_url?: string
          target_urls?: Json | null
          updated_at?: string
          user_id?: string
          webhook_enabled?: boolean | null
          webhook_events?: string[] | null
          webhook_url?: string | null
          whitelist_ips?: string[] | null
        }
        Relationships: []
      }
      cloaker_blacklist: {
        Row: {
          created_at: string | null
          expires_at: string | null
          fail_count: number | null
          first_seen_at: string | null
          id: string
          ip_address: string
          last_seen_at: string | null
          link_id: string | null
          metadata: Json | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          fail_count?: number | null
          first_seen_at?: string | null
          id?: string
          ip_address: string
          last_seen_at?: string | null
          link_id?: string | null
          metadata?: Json | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          fail_count?: number | null
          first_seen_at?: string | null
          id?: string
          ip_address?: string
          last_seen_at?: string | null
          link_id?: string | null
          metadata?: Json | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloaker_blacklist_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "cloaked_links"
            referencedColumns: ["id"]
          },
        ]
      }
      cloaker_ml_feedback: {
        Row: {
          corrected_decision: string
          created_at: string
          feedback_type: string
          id: string
          link_id: string | null
          original_decision: string
          visitor_id: string | null
        }
        Insert: {
          corrected_decision: string
          created_at?: string
          feedback_type: string
          id?: string
          link_id?: string | null
          original_decision: string
          visitor_id?: string | null
        }
        Update: {
          corrected_decision?: string
          created_at?: string
          feedback_type?: string
          id?: string
          link_id?: string | null
          original_decision?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cloaker_ml_feedback_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "cloaked_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloaker_ml_feedback_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "cloaker_visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      cloaker_ml_patterns: {
        Row: {
          approve_count: number
          block_count: number
          confidence_score: number
          created_at: string
          false_positive_count: number
          id: string
          last_seen_at: string
          metadata: Json | null
          pattern_type: string
          pattern_value: string
          updated_at: string
          weight_adjustment: number
        }
        Insert: {
          approve_count?: number
          block_count?: number
          confidence_score?: number
          created_at?: string
          false_positive_count?: number
          id?: string
          last_seen_at?: string
          metadata?: Json | null
          pattern_type: string
          pattern_value: string
          updated_at?: string
          weight_adjustment?: number
        }
        Update: {
          approve_count?: number
          block_count?: number
          confidence_score?: number
          created_at?: string
          false_positive_count?: number
          id?: string
          last_seen_at?: string
          metadata?: Json | null
          pattern_type?: string
          pattern_value?: string
          updated_at?: string
          weight_adjustment?: number
        }
        Relationships: []
      }
      cloaker_ml_thresholds: {
        Row: {
          automation_weight: number
          behavior_weight: number
          block_rate: number
          created_at: string
          false_positive_rate: number
          fingerprint_weight: number
          id: string
          last_adjusted_at: string
          learning_rate: number
          link_id: string | null
          min_score_adjusted: number
          network_weight: number
          total_decisions: number
          updated_at: string
        }
        Insert: {
          automation_weight?: number
          behavior_weight?: number
          block_rate?: number
          created_at?: string
          false_positive_rate?: number
          fingerprint_weight?: number
          id?: string
          last_adjusted_at?: string
          learning_rate?: number
          link_id?: string | null
          min_score_adjusted?: number
          network_weight?: number
          total_decisions?: number
          updated_at?: string
        }
        Update: {
          automation_weight?: number
          behavior_weight?: number
          block_rate?: number
          created_at?: string
          false_positive_rate?: number
          fingerprint_weight?: number
          id?: string
          last_adjusted_at?: string
          learning_rate?: number
          link_id?: string | null
          min_score_adjusted?: number
          network_weight?: number
          total_decisions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloaker_ml_thresholds_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: true
            referencedRelation: "cloaked_links"
            referencedColumns: ["id"]
          },
        ]
      }
      cloaker_visitors: {
        Row: {
          asn: string | null
          audio_hash: string | null
          canvas_hash: string | null
          city: string | null
          color_depth: number | null
          country_code: string | null
          created_at: string
          decision: string
          detection_details: Json | null
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
          is_blacklisted: boolean | null
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
          processing_time_ms: number | null
          redirect_url: string | null
          referer: string | null
          score: number
          score_automation: number | null
          score_behavior: number | null
          score_device_consistency: number | null
          score_fingerprint: number | null
          score_keyboard: number | null
          score_mouse_pattern: number | null
          score_network: number | null
          score_session_replay: number | null
          score_webrtc: number | null
          screen_resolution: string | null
          scroll_events: number | null
          time_on_page: number | null
          timezone: string | null
          touch_support: boolean | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          webgl_renderer: string | null
          webgl_vendor: string | null
          webrtc_local_ip: string | null
          webrtc_public_ip: string | null
        }
        Insert: {
          asn?: string | null
          audio_hash?: string | null
          canvas_hash?: string | null
          city?: string | null
          color_depth?: number | null
          country_code?: string | null
          created_at?: string
          decision: string
          detection_details?: Json | null
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
          is_blacklisted?: boolean | null
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
          processing_time_ms?: number | null
          redirect_url?: string | null
          referer?: string | null
          score?: number
          score_automation?: number | null
          score_behavior?: number | null
          score_device_consistency?: number | null
          score_fingerprint?: number | null
          score_keyboard?: number | null
          score_mouse_pattern?: number | null
          score_network?: number | null
          score_session_replay?: number | null
          score_webrtc?: number | null
          screen_resolution?: string | null
          scroll_events?: number | null
          time_on_page?: number | null
          timezone?: string | null
          touch_support?: boolean | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webgl_renderer?: string | null
          webgl_vendor?: string | null
          webrtc_local_ip?: string | null
          webrtc_public_ip?: string | null
        }
        Update: {
          asn?: string | null
          audio_hash?: string | null
          canvas_hash?: string | null
          city?: string | null
          color_depth?: number | null
          country_code?: string | null
          created_at?: string
          decision?: string
          detection_details?: Json | null
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
          is_blacklisted?: boolean | null
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
          processing_time_ms?: number | null
          redirect_url?: string | null
          referer?: string | null
          score?: number
          score_automation?: number | null
          score_behavior?: number | null
          score_device_consistency?: number | null
          score_fingerprint?: number | null
          score_keyboard?: number | null
          score_mouse_pattern?: number | null
          score_network?: number | null
          score_session_replay?: number | null
          score_webrtc?: number | null
          screen_resolution?: string | null
          scroll_events?: number | null
          time_on_page?: number | null
          timezone?: string | null
          touch_support?: boolean | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webgl_renderer?: string | null
          webgl_vendor?: string | null
          webrtc_local_ip?: string | null
          webrtc_public_ip?: string | null
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
      cloaker_webhooks_log: {
        Row: {
          event_type: string
          id: string
          link_id: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          sent_at: string | null
          success: boolean | null
          visitor_id: string | null
        }
        Insert: {
          event_type: string
          id?: string
          link_id?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          sent_at?: string | null
          success?: boolean | null
          visitor_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          link_id?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          sent_at?: string | null
          success?: boolean | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cloaker_webhooks_log_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "cloaked_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloaker_webhooks_log_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "cloaker_visitors"
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
      whiteboard_boards: {
        Row: {
          background_color: string | null
          created_at: string
          description: string | null
          id: string
          is_shared: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_shared?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_shared?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whiteboard_cards: {
        Row: {
          assigned_to: string | null
          board_id: string
          color: string | null
          column_id: string
          content: string | null
          created_at: string
          created_by: string
          drawing_data: string | null
          due_date: string | null
          id: string
          position: number
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          board_id: string
          color?: string | null
          column_id: string
          content?: string | null
          created_at?: string
          created_by: string
          drawing_data?: string | null
          due_date?: string | null
          id?: string
          position?: number
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          board_id?: string
          color?: string | null
          column_id?: string
          content?: string | null
          created_at?: string
          created_by?: string
          drawing_data?: string | null
          due_date?: string | null
          id?: string
          position?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whiteboard_cards_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "whiteboard_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whiteboard_cards_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "whiteboard_columns"
            referencedColumns: ["id"]
          },
        ]
      }
      whiteboard_columns: {
        Row: {
          board_id: string
          color: string | null
          created_at: string
          id: string
          position: number
          title: string
        }
        Insert: {
          board_id: string
          color?: string | null
          created_at?: string
          id?: string
          position?: number
          title: string
        }
        Update: {
          board_id?: string
          color?: string | null
          created_at?: string
          id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "whiteboard_columns_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "whiteboard_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      whiteboard_drawings: {
        Row: {
          board_id: string
          created_at: string
          drawing_data: string
          id: string
          thumbnail: string | null
          updated_at: string
        }
        Insert: {
          board_id: string
          created_at?: string
          drawing_data: string
          id?: string
          thumbnail?: string | null
          updated_at?: string
        }
        Update: {
          board_id?: string
          created_at?: string
          drawing_data?: string
          id?: string
          thumbnail?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whiteboard_drawings_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "whiteboard_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      whiteboard_versions: {
        Row: {
          board_id: string
          created_at: string
          created_by: string
          description: string | null
          drawing_data: string
          id: string
          version_number: number
        }
        Insert: {
          board_id: string
          created_at?: string
          created_by: string
          description?: string | null
          drawing_data: string
          id?: string
          version_number?: number
        }
        Update: {
          board_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          drawing_data?: string
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "whiteboard_versions_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "whiteboard_boards"
            referencedColumns: ["id"]
          },
        ]
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
      get_next_version_number: { Args: { p_board_id: string }; Returns: number }
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
      reset_daily_clicks: { Args: never; Returns: undefined }
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
