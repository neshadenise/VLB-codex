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
      admin_security_events: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          id: string
          ip: string | null
          metadata: Json
          success: boolean
          target_email: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          success?: boolean
          target_email?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          success?: boolean
          target_email?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      closet_items: {
        Row: {
          back_url: string | null
          brand: string | null
          category: string
          closet_id: string | null
          color: string | null
          created_at: string
          custom_fields: Json
          favorite: boolean
          gender: string | null
          id: string
          image_url: string
          name: string
          notes: string | null
          price: number | null
          season: string | null
          source: string | null
          subcategory: string | null
          tags: string[]
          user_id: string
        }
        Insert: {
          back_url?: string | null
          brand?: string | null
          category: string
          closet_id?: string | null
          color?: string | null
          created_at?: string
          custom_fields?: Json
          favorite?: boolean
          gender?: string | null
          id?: string
          image_url: string
          name: string
          notes?: string | null
          price?: number | null
          season?: string | null
          source?: string | null
          subcategory?: string | null
          tags?: string[]
          user_id: string
        }
        Update: {
          back_url?: string | null
          brand?: string | null
          category?: string
          closet_id?: string | null
          color?: string | null
          created_at?: string
          custom_fields?: Json
          favorite?: boolean
          gender?: string | null
          id?: string
          image_url?: string
          name?: string
          notes?: string | null
          price?: number | null
          season?: string | null
          source?: string | null
          subcategory?: string | null
          tags?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "closet_items_closet_id_fkey"
            columns: ["closet_id"]
            isOneToOne: false
            referencedRelation: "closets"
            referencedColumns: ["id"]
          },
        ]
      }
      closet_subcategories: {
        Row: {
          category: string
          closet_id: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          category: string
          closet_id?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          category?: string
          closet_id?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "closet_subcategories_closet_id_fkey"
            columns: ["closet_id"]
            isOneToOne: false
            referencedRelation: "closets"
            referencedColumns: ["id"]
          },
        ]
      }
      closets: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          cover: string | null
          created_at: string
          description: string | null
          id: string
          look_ids: Json
          name: string
          user_id: string
        }
        Insert: {
          cover?: string | null
          created_at?: string
          description?: string | null
          id?: string
          look_ids?: Json
          name: string
          user_id: string
        }
        Update: {
          cover?: string | null
          created_at?: string
          description?: string | null
          id?: string
          look_ids?: Json
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_packs: {
        Row: {
          active: boolean
          badge: string | null
          bonus_credits: number
          created_at: string
          credits: number
          currency: string
          highlight: boolean
          icon: string
          id: string
          name: string
          price_cents: number
          sort_order: number
          tagline: string | null
          theme: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge?: string | null
          bonus_credits?: number
          created_at?: string
          credits: number
          currency?: string
          highlight?: boolean
          icon?: string
          id: string
          name: string
          price_cents: number
          sort_order?: number
          tagline?: string | null
          theme?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge?: string | null
          bonus_credits?: number
          created_at?: string
          credits?: number
          currency?: string
          highlight?: boolean
          icon?: string
          id?: string
          name?: string
          price_cents?: number
          sort_order?: number
          tagline?: string | null
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_purchases: {
        Row: {
          amount_cents: number
          created_at: string
          credits: number
          currency: string
          id: string
          pack_id: string
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          credits: number
          currency?: string
          id?: string
          pack_id: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          credits?: number
          currency?: string
          id?: string
          pack_id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      looks: {
        Row: {
          created_at: string
          id: string
          image_url: string
          item_ids: Json
          model_id: string | null
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          item_ids?: Json
          model_id?: string | null
          name: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          item_ids?: Json
          model_id?: string | null
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      master_admin_recovery_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          revoked_at: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          revoked_at?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          revoked_at?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      master_admin_settings: {
        Row: {
          recovery_email: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          recovery_email?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          recovery_email?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      models: {
        Row: {
          base_image_url: string
          created_at: string
          current_image_url: string
          history: Json
          id: string
          is_child: boolean
          is_infant: boolean
          name: string
          pose: string
          prompt: string
          user_id: string
          worn_item_ids: Json
        }
        Insert: {
          base_image_url: string
          created_at?: string
          current_image_url: string
          history?: Json
          id?: string
          is_child?: boolean
          is_infant?: boolean
          name: string
          pose: string
          prompt: string
          user_id: string
          worn_item_ids?: Json
        }
        Update: {
          base_image_url?: string
          created_at?: string
          current_image_url?: string
          history?: Json
          id?: string
          is_child?: boolean
          is_infant?: boolean
          name?: string
          pose?: string
          prompt?: string
          user_id?: string
          worn_item_ids?: Json
        }
        Relationships: []
      }
      moodboards: {
        Row: {
          created_at: string
          id: string
          name: string
          palette: Json
          pins: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          palette?: Json
          pins?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          palette?: Json
          pins?: Json
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          generations_used: number
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          generations_used?: number
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          generations_used?: number
          tier?: string
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
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      am_i_master_admin: { Args: never; Returns: boolean }
      apply_credit_purchase: {
        Args: { _payment_intent: string; _session_id: string }
        Returns: undefined
      }
      consume_credit: {
        Args: { _cost?: number; _user_id: string }
        Returns: number
      }
      consume_credit_smart: {
        Args: { _cost?: number; _user_id: string }
        Returns: number
      }
      consume_master_recovery_code: {
        Args: {
          _code_hash: string
          _ip?: string
          _new_master_email: string
          _recovery_email: string
          _ua?: string
        }
        Returns: string
      }
      get_master_recovery_email: { Args: never; Returns: string }
      grant_admin_by_email: { Args: { _email: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_master_admin: { Args: { _user_id: string }; Returns: boolean }
      list_admin_security_events: {
        Args: { _limit?: number }
        Returns: {
          action: string
          actor_email: string
          created_at: string
          id: string
          ip: string
          metadata: Json
          success: boolean
          target_email: string
          user_agent: string
        }[]
      }
      list_admins: {
        Args: never
        Returns: {
          created_at: string
          email: string
          user_id: string
        }[]
      }
      list_master_recovery_codes_meta: {
        Args: never
        Returns: {
          active: number
          last_generated: string
          total: number
          used: number
        }[]
      }
      log_admin_event: {
        Args: {
          _action: string
          _ip?: string
          _metadata?: Json
          _success?: boolean
          _target_email?: string
          _user_agent?: string
        }
        Returns: undefined
      }
      register_master_recovery_codes: {
        Args: { _hashes: string[]; _ip?: string; _ua?: string }
        Returns: number
      }
      revoke_admin_by_email: { Args: { _email: string }; Returns: string }
      revoke_master_recovery_codes: {
        Args: { _ip?: string; _ua?: string }
        Returns: number
      }
      set_master_recovery_email: {
        Args: { _email: string; _ip?: string; _ua?: string }
        Returns: string
      }
      transfer_master_admin: {
        Args: {
          _confirm_phrase: string
          _ip?: string
          _keep_old_as_admin?: boolean
          _target_email: string
          _ua?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "user" | "admin" | "master_admin"
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
      app_role: ["user", "admin", "master_admin"],
    },
  },
} as const
