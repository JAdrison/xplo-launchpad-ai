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
      activities: {
        Row: {
          attachments: Json
          auto_generated: boolean
          checkpoint_code: string | null
          checkpoint_label: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          deal_id: string
          description: string | null
          duration_minutes: number | null
          id: string
          recurrence_days: number | null
          required_bonus: Database["public"]["Enums"]["xplo_bonus"] | null
          required_function: Database["public"]["Enums"]["job_function"] | null
          required_plan: Database["public"]["Enums"]["xplo_plan"] | null
          responsible_id: string | null
          scheduled_at: string | null
          source_automation_id: string | null
          status: Database["public"]["Enums"]["crm_activity_status"]
          subject: string
          template_key: string | null
          type: Database["public"]["Enums"]["crm_activity_type"]
          updated_at: string
        }
        Insert: {
          attachments?: Json
          auto_generated?: boolean
          checkpoint_code?: string | null
          checkpoint_label?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          deal_id: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          recurrence_days?: number | null
          required_bonus?: Database["public"]["Enums"]["xplo_bonus"] | null
          required_function?: Database["public"]["Enums"]["job_function"] | null
          required_plan?: Database["public"]["Enums"]["xplo_plan"] | null
          responsible_id?: string | null
          scheduled_at?: string | null
          source_automation_id?: string | null
          status?: Database["public"]["Enums"]["crm_activity_status"]
          subject: string
          template_key?: string | null
          type: Database["public"]["Enums"]["crm_activity_type"]
          updated_at?: string
        }
        Update: {
          attachments?: Json
          auto_generated?: boolean
          checkpoint_code?: string | null
          checkpoint_label?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          deal_id?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          recurrence_days?: number | null
          required_bonus?: Database["public"]["Enums"]["xplo_bonus"] | null
          required_function?: Database["public"]["Enums"]["job_function"] | null
          required_plan?: Database["public"]["Enums"]["xplo_plan"] | null
          responsible_id?: string | null
          scheduled_at?: string | null
          source_automation_id?: string | null
          status?: Database["public"]["Enums"]["crm_activity_status"]
          subject?: string
          template_key?: string | null
          type?: Database["public"]["Enums"]["crm_activity_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_source_automation_id_fkey"
            columns: ["source_automation_id"]
            isOneToOne: false
            referencedRelation: "column_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_templates: {
        Row: {
          created_at: string
          default_description: string | null
          default_duration_minutes: number | null
          default_subject: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["crm_activity_type"]
        }
        Insert: {
          created_at?: string
          default_description?: string | null
          default_duration_minutes?: number | null
          default_subject?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["crm_activity_type"]
        }
        Update: {
          created_at?: string
          default_description?: string | null
          default_duration_minutes?: number | null
          default_subject?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["crm_activity_type"]
        }
        Relationships: []
      }
      ads: {
        Row: {
          ad_angle: string | null
          angle: string | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          body_text: string | null
          client_id: string
          created_at: string
          cta: string | null
          eliminators: string[] | null
          focus: string | null
          headline: string | null
          id: string
          is_active: boolean | null
          offer_id: string | null
          script: Json | null
          subheadline: string | null
          updated_at: string
          video_cta: string | null
          video_duration: string | null
          video_hook: string | null
          video_problem: string | null
          video_proof: string | null
          video_solution: string | null
          video_type: string | null
          video_visual_notes: string | null
          video_why_bad: string | null
          visual_suggestion: string | null
        }
        Insert: {
          ad_angle?: string | null
          angle?: string | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          body_text?: string | null
          client_id: string
          created_at?: string
          cta?: string | null
          eliminators?: string[] | null
          focus?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean | null
          offer_id?: string | null
          script?: Json | null
          subheadline?: string | null
          updated_at?: string
          video_cta?: string | null
          video_duration?: string | null
          video_hook?: string | null
          video_problem?: string | null
          video_proof?: string | null
          video_solution?: string | null
          video_type?: string | null
          video_visual_notes?: string | null
          video_why_bad?: string | null
          visual_suggestion?: string | null
        }
        Update: {
          ad_angle?: string | null
          angle?: string | null
          asset_type?: Database["public"]["Enums"]["asset_type"]
          body_text?: string | null
          client_id?: string
          created_at?: string
          cta?: string | null
          eliminators?: string[] | null
          focus?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean | null
          offer_id?: string | null
          script?: Json | null
          subheadline?: string | null
          updated_at?: string
          video_cta?: string | null
          video_duration?: string | null
          video_hook?: string | null
          video_problem?: string | null
          video_proof?: string | null
          video_solution?: string | null
          video_type?: string | null
          video_visual_notes?: string | null
          video_why_bad?: string | null
          visual_suggestion?: string | null
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
      client_icp: {
        Row: {
          bloco1_data: Json | null
          bloco2_data: Json | null
          bloco3_data: Json | null
          client_id: string
          created_at: string
          generated_at: string | null
          generated_by_ai: boolean | null
          generated_icp_text: string | null
          id: string
          updated_at: string
        }
        Insert: {
          bloco1_data?: Json | null
          bloco2_data?: Json | null
          bloco3_data?: Json | null
          client_id: string
          created_at?: string
          generated_at?: string | null
          generated_by_ai?: boolean | null
          generated_icp_text?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          bloco1_data?: Json | null
          bloco2_data?: Json | null
          bloco3_data?: Json | null
          client_id?: string
          created_at?: string
          generated_at?: string | null
          generated_by_ai?: boolean | null
          generated_icp_text?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_icp_documents: {
        Row: {
          client_id: string
          created_at: string
          generated_at: string | null
          generated_by_ai: boolean | null
          generated_icp_text: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          generated_at?: string | null
          generated_by_ai?: boolean | null
          generated_icp_text?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          generated_at?: string | null
          generated_by_ai?: boolean | null
          generated_icp_text?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      client_offer_documents: {
        Row: {
          client_id: string
          created_at: string
          generated_at: string | null
          generated_by_ai: boolean | null
          generated_text: string | null
          id: string
          name: string
          offer_states: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          generated_at?: string | null
          generated_by_ai?: boolean | null
          generated_text?: string | null
          id?: string
          name?: string
          offer_states?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          generated_at?: string | null
          generated_by_ai?: boolean | null
          generated_text?: string | null
          id?: string
          name?: string
          offer_states?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      client_profile: {
        Row: {
          average_ticket: string | null
          benefits: string[] | null
          client_id: string
          created_at: string
          current_revenue: string | null
          daily_impacts: string[] | null
          demand_channels: string[] | null
          desire_1: string | null
          desire_2: string | null
          differentiators: string[] | null
          facebook_login: string | null
          facebook_password: string | null
          google_my_business: string | null
          id: string
          initial_traffic_investment: string | null
          inspiration_company_1: Json | null
          inspiration_company_2: Json | null
          instagram_link: string | null
          instagram_login: string | null
          instagram_password: string | null
          local_competitor_1: Json | null
          local_competitor_2: Json | null
          main_pain: string | null
          market_data: Json | null
          monthly_investment: string | null
          product_description: string | null
          product_name: string | null
          profile_data: Json | null
          promotions: string | null
          region: string[] | null
          revenue_goal: string | null
          sales_model: Database["public"]["Enums"]["sales_model"] | null
          sales_team_size: string | null
          secondary_pain: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          average_ticket?: string | null
          benefits?: string[] | null
          client_id: string
          created_at?: string
          current_revenue?: string | null
          daily_impacts?: string[] | null
          demand_channels?: string[] | null
          desire_1?: string | null
          desire_2?: string | null
          differentiators?: string[] | null
          facebook_login?: string | null
          facebook_password?: string | null
          google_my_business?: string | null
          id?: string
          initial_traffic_investment?: string | null
          inspiration_company_1?: Json | null
          inspiration_company_2?: Json | null
          instagram_link?: string | null
          instagram_login?: string | null
          instagram_password?: string | null
          local_competitor_1?: Json | null
          local_competitor_2?: Json | null
          main_pain?: string | null
          market_data?: Json | null
          monthly_investment?: string | null
          product_description?: string | null
          product_name?: string | null
          profile_data?: Json | null
          promotions?: string | null
          region?: string[] | null
          revenue_goal?: string | null
          sales_model?: Database["public"]["Enums"]["sales_model"] | null
          sales_team_size?: string | null
          secondary_pain?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          average_ticket?: string | null
          benefits?: string[] | null
          client_id?: string
          created_at?: string
          current_revenue?: string | null
          daily_impacts?: string[] | null
          demand_channels?: string[] | null
          desire_1?: string | null
          desire_2?: string | null
          differentiators?: string[] | null
          facebook_login?: string | null
          facebook_password?: string | null
          google_my_business?: string | null
          id?: string
          initial_traffic_investment?: string | null
          inspiration_company_1?: Json | null
          inspiration_company_2?: Json | null
          instagram_link?: string | null
          instagram_login?: string | null
          instagram_password?: string | null
          local_competitor_1?: Json | null
          local_competitor_2?: Json | null
          main_pain?: string | null
          market_data?: Json | null
          monthly_investment?: string | null
          product_description?: string | null
          product_name?: string | null
          profile_data?: Json | null
          promotions?: string | null
          region?: string[] | null
          revenue_goal?: string | null
          sales_model?: Database["public"]["Enums"]["sales_model"] | null
          sales_team_size?: string | null
          secondary_pain?: string | null
          updated_at?: string
          whatsapp_number?: string | null
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
      client_swot: {
        Row: {
          client_id: string
          created_at: string
          forcas_ambiente_tags: string[] | null
          forcas_ambiente_text: string | null
          forcas_internas_tags: string[] | null
          forcas_internas_text: string | null
          fraquezas_ambiente_tags: string[] | null
          fraquezas_ambiente_text: string | null
          fraquezas_internas_tags: string[] | null
          fraquezas_internas_text: string | null
          generated_by_ai: boolean | null
          id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          forcas_ambiente_tags?: string[] | null
          forcas_ambiente_text?: string | null
          forcas_internas_tags?: string[] | null
          forcas_internas_text?: string | null
          fraquezas_ambiente_tags?: string[] | null
          fraquezas_ambiente_text?: string | null
          fraquezas_internas_tags?: string[] | null
          fraquezas_internas_text?: string | null
          generated_by_ai?: boolean | null
          id?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          forcas_ambiente_tags?: string[] | null
          forcas_ambiente_text?: string | null
          forcas_internas_tags?: string[] | null
          forcas_internas_text?: string | null
          fraquezas_ambiente_tags?: string[] | null
          fraquezas_ambiente_text?: string | null
          fraquezas_internas_tags?: string[] | null
          fraquezas_internas_text?: string | null
          generated_by_ai?: boolean | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_tokens: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          id: string
          token: string
          token_hash: string | null
          type: Database["public"]["Enums"]["token_type"]
          used_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at: string
          id?: string
          token: string
          token_hash?: string | null
          type?: Database["public"]["Enums"]["token_type"]
          used_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          token_hash?: string | null
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
      client_traffic_plan_documents: {
        Row: {
          client_id: string
          created_at: string
          generated_at: string | null
          generated_by_ai: boolean | null
          generated_text: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          generated_at?: string | null
          generated_by_ai?: boolean | null
          generated_text?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          generated_at?: string | null
          generated_by_ai?: boolean | null
          generated_text?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          niche: string | null
          niche_label: string | null
          niche_type: Database["public"]["Enums"]["niche_type"] | null
          notes: string | null
          phone: string | null
          product_description: string | null
          responsible_cpf: string | null
          responsible_name: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          xplo_bonuses: Database["public"]["Enums"]["xplo_bonus"][]
          xplo_lab_login: string | null
          xplo_lab_password: string | null
          xplo_plan: Database["public"]["Enums"]["xplo_plan"]
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          niche?: string | null
          niche_label?: string | null
          niche_type?: Database["public"]["Enums"]["niche_type"] | null
          notes?: string | null
          phone?: string | null
          product_description?: string | null
          responsible_cpf?: string | null
          responsible_name?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          xplo_bonuses?: Database["public"]["Enums"]["xplo_bonus"][]
          xplo_lab_login?: string | null
          xplo_lab_password?: string | null
          xplo_plan?: Database["public"]["Enums"]["xplo_plan"]
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          niche?: string | null
          niche_label?: string | null
          niche_type?: Database["public"]["Enums"]["niche_type"] | null
          notes?: string | null
          phone?: string | null
          product_description?: string | null
          responsible_cpf?: string | null
          responsible_name?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          xplo_bonuses?: Database["public"]["Enums"]["xplo_bonus"][]
          xplo_lab_login?: string | null
          xplo_lab_password?: string | null
          xplo_plan?: Database["public"]["Enums"]["xplo_plan"]
        }
        Relationships: []
      }
      column_automations: {
        Row: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          column_id: string
          created_at: string
          days_after_entry: number
          default_duration_minutes: number | null
          default_responsible_id: string | null
          description: string | null
          id: string
          sort_order: number
          subject: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          column_id: string
          created_at?: string
          days_after_entry?: number
          default_duration_minutes?: number | null
          default_responsible_id?: string | null
          description?: string | null
          id?: string
          sort_order?: number
          subject: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["crm_activity_type"]
          column_id?: string
          created_at?: string
          days_after_entry?: number
          default_duration_minutes?: number | null
          default_responsible_id?: string | null
          description?: string | null
          id?: string
          sort_order?: number
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "column_automations_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "pipeline_columns"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          created_at: string
          entity_type: Database["public"]["Enums"]["crm_entity_type"]
          field_type: Database["public"]["Enums"]["crm_custom_field_type"]
          id: string
          name: string
          options: Json
          required: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string
          entity_type: Database["public"]["Enums"]["crm_entity_type"]
          field_type: Database["public"]["Enums"]["crm_custom_field_type"]
          id?: string
          name: string
          options?: Json
          required?: boolean
          sort_order?: number
        }
        Update: {
          created_at?: string
          entity_type?: Database["public"]["Enums"]["crm_entity_type"]
          field_type?: Database["public"]["Enums"]["crm_custom_field_type"]
          id?: string
          name?: string
          options?: Json
          required?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      deal_history: {
        Row: {
          actor_id: string | null
          created_at: string
          deal_id: string
          event_data: Json
          event_type: Database["public"]["Enums"]["crm_event_type"]
          id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          deal_id: string
          event_data?: Json
          event_type: Database["public"]["Enums"]["crm_event_type"]
          id?: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          deal_id?: string
          event_data?: Json
          event_type?: Database["public"]["Enums"]["crm_event_type"]
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_tags: {
        Row: {
          deal_id: string
          tag_id: string
        }
        Insert: {
          deal_id: string
          tag_id: string
        }
        Update: {
          deal_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_tags_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          client_id: string
          closed_at: string | null
          closed_reason: string | null
          column_id: string
          created_at: string
          custom_fields: Json
          entered_current_column_at: string
          id: string
          name: string
          pipeline_id: string
          responsible_id: string | null
          sort_order: number
          status: Database["public"]["Enums"]["crm_deal_status"]
          updated_at: string
          value_cents: number
        }
        Insert: {
          client_id: string
          closed_at?: string | null
          closed_reason?: string | null
          column_id: string
          created_at?: string
          custom_fields?: Json
          entered_current_column_at?: string
          id?: string
          name: string
          pipeline_id: string
          responsible_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["crm_deal_status"]
          updated_at?: string
          value_cents?: number
        }
        Update: {
          client_id?: string
          closed_at?: string | null
          closed_reason?: string | null
          column_id?: string
          created_at?: string
          custom_fields?: Json
          entered_current_column_at?: string
          id?: string
          name?: string
          pipeline_id?: string
          responsible_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["crm_deal_status"]
          updated_at?: string
          value_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "pipeline_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      icp_pains: {
        Row: {
          consequence: string | null
          created_at: string
          daily_impacts: string[] | null
          desire_1: string | null
          desire_2: string | null
          icp_id: string
          id: string
          main_pain: string | null
          secondary_pain: string | null
          updated_at: string
        }
        Insert: {
          consequence?: string | null
          created_at?: string
          daily_impacts?: string[] | null
          desire_1?: string | null
          desire_2?: string | null
          icp_id: string
          id?: string
          main_pain?: string | null
          secondary_pain?: string | null
          updated_at?: string
        }
        Update: {
          consequence?: string | null
          created_at?: string
          daily_impacts?: string[] | null
          desire_1?: string | null
          desire_2?: string | null
          icp_id?: string
          id?: string
          main_pain?: string | null
          secondary_pain?: string | null
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
          age: string | null
          awareness_level: Database["public"]["Enums"]["awareness_level"] | null
          characteristics: string | null
          client_id: string
          created_at: string
          current_situation: string | null
          gender: string | null
          id: string
          is_ideal: string | null
          name: string
          profession: string | null
          reason_needs_solution: string | null
          segment: string | null
          sort_order: number
          updated_at: string
          when_seeks: string | null
          who_is: string | null
        }
        Insert: {
          age?: string | null
          awareness_level?:
            | Database["public"]["Enums"]["awareness_level"]
            | null
          characteristics?: string | null
          client_id: string
          created_at?: string
          current_situation?: string | null
          gender?: string | null
          id?: string
          is_ideal?: string | null
          name: string
          profession?: string | null
          reason_needs_solution?: string | null
          segment?: string | null
          sort_order?: number
          updated_at?: string
          when_seeks?: string | null
          who_is?: string | null
        }
        Update: {
          age?: string | null
          awareness_level?:
            | Database["public"]["Enums"]["awareness_level"]
            | null
          characteristics?: string | null
          client_id?: string
          created_at?: string
          current_situation?: string | null
          gender?: string | null
          id?: string
          is_ideal?: string | null
          name?: string
          profession?: string | null
          reason_needs_solution?: string | null
          segment?: string | null
          sort_order?: number
          updated_at?: string
          when_seeks?: string | null
          who_is?: string | null
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
      notes: {
        Row: {
          attachments: Json
          author_id: string
          content: string
          created_at: string
          deal_id: string
          id: string
        }
        Insert: {
          attachments?: Json
          author_id: string
          content: string
          created_at?: string
          deal_id: string
          id?: string
        }
        Update: {
          attachments?: Json
          author_id?: string
          content?: string
          created_at?: string
          deal_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
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
      pipeline_columns: {
        Row: {
          automation_enabled: boolean
          checkpoint_code: string | null
          color: string
          column_type: Database["public"]["Enums"]["crm_column_type"]
          created_at: string
          id: string
          name: string
          pipeline_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          automation_enabled?: boolean
          checkpoint_code?: string | null
          color?: string
          column_type?: Database["public"]["Enums"]["crm_column_type"]
          created_at?: string
          id?: string
          name: string
          pipeline_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          automation_enabled?: boolean
          checkpoint_code?: string | null
          color?: string
          column_type?: Database["public"]["Enums"]["crm_column_type"]
          created_at?: string
          id?: string
          name?: string
          pipeline_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_columns_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          pipeline_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          pipeline_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          pipeline_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          label: string | null
          model: string | null
          provider: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          label?: string | null
          model?: string | null
          provider: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          label?: string | null
          model?: string | null
          provider?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_job_functions: {
        Row: {
          created_at: string
          id: string
          job_function: Database["public"]["Enums"]["job_function"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_function: Database["public"]["Enums"]["job_function"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_function?: Database["public"]["Enums"]["job_function"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      apply_column_automations: {
        Args: { _column_id: string; _deal_id: string }
        Returns: undefined
      }
      client_id_from_request_token: { Args: never; Returns: string }
      current_request_client_token: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_crm_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "pending"
      asset_type: "landing_page" | "static_ad" | "video_ad"
      awareness_level: "cold" | "warm" | "hot"
      client_status:
        | "draft"
        | "ppp_in_progress"
        | "ppp_completed"
        | "offer_generated"
        | "assets_generated"
        | "archived"
      crm_activity_status: "pending" | "completed"
      crm_activity_type: "lembrete" | "mensagem" | "ligacao" | "email"
      crm_column_type: "normal" | "won" | "lost"
      crm_custom_field_type:
        | "text"
        | "number"
        | "select"
        | "multi_select"
        | "date"
        | "checkbox"
      crm_deal_status: "active" | "won" | "lost"
      crm_entity_type: "deal" | "client"
      crm_event_type:
        | "created"
        | "moved"
        | "tag_added"
        | "tag_removed"
        | "activity_created"
        | "activity_completed"
        | "value_changed"
        | "responsible_changed"
        | "status_changed"
        | "note_added"
        | "custom_field_changed"
      job_function:
        | "gestor_trafego"
        | "designer"
        | "copywriter"
        | "sdr"
        | "vendedor"
        | "contato_cliente"
        | "gestor_projetos"
        | "ia_specialist"
      lp_variant: "direct" | "consultive" | "aggressive"
      niche_type: "hospedagem" | "saude" | "generico"
      sales_model: "b2b" | "b2c" | "recurring" | "project" | "hybrid"
      token_type: "onboarding"
      xplo_bonus: "google_my_business" | "instagram_showcase"
      xplo_plan: "basic" | "pro"
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
      app_role: ["admin", "user", "pending"],
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
      crm_activity_status: ["pending", "completed"],
      crm_activity_type: ["lembrete", "mensagem", "ligacao", "email"],
      crm_column_type: ["normal", "won", "lost"],
      crm_custom_field_type: [
        "text",
        "number",
        "select",
        "multi_select",
        "date",
        "checkbox",
      ],
      crm_deal_status: ["active", "won", "lost"],
      crm_entity_type: ["deal", "client"],
      crm_event_type: [
        "created",
        "moved",
        "tag_added",
        "tag_removed",
        "activity_created",
        "activity_completed",
        "value_changed",
        "responsible_changed",
        "status_changed",
        "note_added",
        "custom_field_changed",
      ],
      job_function: [
        "gestor_trafego",
        "designer",
        "copywriter",
        "sdr",
        "vendedor",
        "contato_cliente",
        "gestor_projetos",
        "ia_specialist",
      ],
      lp_variant: ["direct", "consultive", "aggressive"],
      niche_type: ["hospedagem", "saude", "generico"],
      sales_model: ["b2b", "b2c", "recurring", "project", "hybrid"],
      token_type: ["onboarding"],
      xplo_bonus: ["google_my_business", "instagram_showcase"],
      xplo_plan: ["basic", "pro"],
    },
  },
} as const
