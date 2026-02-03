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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ads: {
        Row: {
          ad_angle: string | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          body_text: string | null
          client_id: string
          created_at: string
          cta: string | null
          headline: string | null
          id: string
          is_active: boolean | null
          offer_id: string | null
          script: Json | null
          updated_at: string
        }
        Insert: {
          ad_angle?: string | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          body_text?: string | null
          client_id: string
          created_at?: string
          cta?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean | null
          offer_id?: string | null
          script?: Json | null
          updated_at?: string
        }
        Update: {
          ad_angle?: string | null
          asset_type?: Database["public"]["Enums"]["asset_type"]
          body_text?: string | null
          client_id?: string
          created_at?: string
          cta?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean | null
          offer_id?: string | null
          script?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers_hormozi"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profile: {
        Row: {
          average_ticket: string | null
          benefits: string[] | null
          client_id: string
          created_at: string
          demand_channels: string[] | null
          differentiators: string[] | null
          id: string
          monthly_investment: string | null
          product_description: string | null
          product_name: string | null
          promotions: string | null
          region: string | null
          revenue_goal: string | null
          sales_model: Database["public"]["Enums"]["sales_model"] | null
          sales_team_size: string | null
          updated_at: string
        }
        Insert: {
          average_ticket?: string | null
          benefits?: string[] | null
          client_id: string
          created_at?: string
          demand_channels?: string[] | null
          differentiators?: string[] | null
          id?: string
          monthly_investment?: string | null
          product_description?: string | null
          product_name?: string | null
          promotions?: string | null
          region?: string | null
          revenue_goal?: string | null
          sales_model?: Database["public"]["Enums"]["sales_model"] | null
          sales_team_size?: string | null
          updated_at?: string
        }
        Update: {
          average_ticket?: string | null
          benefits?: string[] | null
          client_id?: string
          created_at?: string
          demand_channels?: string[] | null
          differentiators?: string[] | null
          id?: string
          monthly_investment?: string | null
          product_description?: string | null
          product_name?: string | null
          promotions?: string | null
          region?: string | null
          revenue_goal?: string | null
          sales_model?: Database["public"]["Enums"]["sales_model"] | null
          sales_team_size?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profile_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_promise: {
        Row: {
          client_id: string
          created_at: string
          generated_by_ai: boolean | null
          id: string
          promise_text: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          generated_by_ai?: boolean | null
          id?: string
          promise_text?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          generated_by_ai?: boolean | null
          id?: string
          promise_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_promise_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tokens: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          id: string
          token: string
          type: Database["public"]["Enums"]["token_type"]
          used_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at: string
          id?: string
          token: string
          type?: Database["public"]["Enums"]["token_type"]
          used_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          type?: Database["public"]["Enums"]["token_type"]
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          niche: string | null
          notes: string | null
          phone: string | null
          product_description: string | null
          responsible_cpf: string | null
          responsible_name: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          niche?: string | null
          notes?: string | null
          phone?: string | null
          product_description?: string | null
          responsible_cpf?: string | null
          responsible_name?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          niche?: string | null
          notes?: string | null
          phone?: string | null
          product_description?: string | null
          responsible_cpf?: string | null
          responsible_name?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Relationships: []
      }
      icp_pains: {
        Row: {
          consequence: string | null
          created_at: string
          daily_impacts: string[] | null
          icp_id: string
          id: string
          main_pain: string | null
          updated_at: string
        }
        Insert: {
          consequence?: string | null
          created_at?: string
          daily_impacts?: string[] | null
          icp_id: string
          id?: string
          main_pain?: string | null
          updated_at?: string
        }
        Update: {
          consequence?: string | null
          created_at?: string
          daily_impacts?: string[] | null
          icp_id?: string
          id?: string
          main_pain?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "icp_pains_icp_id_fkey"
            columns: ["icp_id"]
            isOneToOne: false
            referencedRelation: "icps"
            referencedColumns: ["id"]
          },
        ]
      }
      icps: {
        Row: {
          awareness_level: Database["public"]["Enums"]["awareness_level"] | null
          characteristics: string | null
          client_id: string
          created_at: string
          current_situation: string | null
          id: string
          name: string
          segment: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          awareness_level?:
            | Database["public"]["Enums"]["awareness_level"]
            | null
          characteristics?: string | null
          client_id: string
          created_at?: string
          current_situation?: string | null
          id?: string
          name: string
          segment?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          awareness_level?:
            | Database["public"]["Enums"]["awareness_level"]
            | null
          characteristics?: string | null
          client_id?: string
          created_at?: string
          current_situation?: string | null
          id?: string
          name?: string
          segment?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "icps_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_active: boolean | null
          offer_id: string | null
          sections: Json
          updated_at: string
          variant: Database["public"]["Enums"]["lp_variant"]
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          offer_id?: string | null
          sections?: Json
          updated_at?: string
          variant: Database["public"]["Enums"]["lp_variant"]
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          offer_id?: string | null
          sections?: Json
          updated_at?: string
          variant?: Database["public"]["Enums"]["lp_variant"]
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_pages_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers_hormozi"
            referencedColumns: ["id"]
          },
        ]
      }
      offers_hormozi: {
        Row: {
          client_id: string
          created_at: string
          demand_generation_channels: string[] | null
          demand_generation_strategies: Json | null
          generated_options: Json | null
          guarantee: string | null
          icp_id: string | null
          id: string
          is_active: boolean | null
          main_cta: string | null
          promise: string | null
          proof: string | null
          risk_reversal: string | null
          selected_options: Json | null
          unique_mechanism: string | null
          updated_at: string
          value_stack: Json | null
        }
        Insert: {
          client_id: string
          created_at?: string
          demand_generation_channels?: string[] | null
          demand_generation_strategies?: Json | null
          generated_options?: Json | null
          guarantee?: string | null
          icp_id?: string | null
          id?: string
          is_active?: boolean | null
          main_cta?: string | null
          promise?: string | null
          proof?: string | null
          risk_reversal?: string | null
          selected_options?: Json | null
          unique_mechanism?: string | null
          updated_at?: string
          value_stack?: Json | null
        }
        Update: {
          client_id?: string
          created_at?: string
          demand_generation_channels?: string[] | null
          demand_generation_strategies?: Json | null
          generated_options?: Json | null
          guarantee?: string | null
          icp_id?: string | null
          id?: string
          is_active?: boolean | null
          main_cta?: string | null
          promise?: string | null
          proof?: string | null
          risk_reversal?: string | null
          selected_options?: Json | null
          unique_mechanism?: string | null
          updated_at?: string
          value_stack?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_hormozi_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_hormozi_icp_id_fkey"
            columns: ["icp_id"]
            isOneToOne: false
            referencedRelation: "icps"
            referencedColumns: ["id"]
          },
        ]
      }
      versions: {
        Row: {
          client_id: string
          content: Json
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          source: string
        }
        Insert: {
          client_id: string
          content: Json
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          source?: string
        }
        Update: {
          client_id?: string
          content?: Json
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "versions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
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
      asset_type: "landing_page" | "static_ad" | "video_ad"
      awareness_level: "cold" | "warm" | "hot"
      client_status:
        | "draft"
        | "ppp_in_progress"
        | "ppp_completed"
        | "offer_generated"
        | "assets_generated"
        | "archived"
      lp_variant: "direct" | "consultive" | "aggressive"
      sales_model: "b2b" | "b2c" | "recurring" | "project" | "hybrid"
      token_type: "onboarding"
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
      asset_type: ["landing_page", "static_ad", "video_ad"],
      awareness_level: ["cold", "warm", "hot"],
      client_status: [
        "draft",
        "ppp_in_progress",
        "ppp_completed",
        "offer_generated",
        "assets_generated",
        "archived",
      ],
      lp_variant: ["direct", "consultive", "aggressive"],
      sales_model: ["b2b", "b2c", "recurring", "project", "hybrid"],
      token_type: ["onboarding"],
    },
  },
} as const
