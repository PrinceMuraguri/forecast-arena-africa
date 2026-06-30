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
      articles: {
        Row: {
          article_type: string
          author: string | null
          body: Json
          byline: string
          category_id: string | null
          country_code: string | null
          created_at: string
          dek: string | null
          hero_image_url: string | null
          id: string
          is_featured: boolean
          is_sample: boolean
          linked_index_slug: string | null
          linked_poll_slug: string | null
          linked_report_slug: string | null
          published_at: string
          read_minutes: number | null
          slug: string
          sponsor_name: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          article_type?: string
          author?: string | null
          body?: Json
          byline?: string
          category_id?: string | null
          country_code?: string | null
          created_at?: string
          dek?: string | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean
          is_sample?: boolean
          linked_index_slug?: string | null
          linked_poll_slug?: string | null
          linked_report_slug?: string | null
          published_at?: string
          read_minutes?: number | null
          slug: string
          sponsor_name?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          article_type?: string
          author?: string | null
          body?: Json
          byline?: string
          category_id?: string | null
          country_code?: string | null
          created_at?: string
          dek?: string | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean
          is_sample?: boolean
          linked_index_slug?: string | null
          linked_poll_slug?: string | null
          linked_report_slug?: string | null
          published_at?: string
          read_minutes?: number | null
          slug?: string
          sponsor_name?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          kind: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          kind?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          kind?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          created_at: string
          flag_emoji: string | null
          id: string
          is_live: boolean
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          is_live?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          is_live?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      daily_questions: {
        Row: {
          active_date: string
          country_code: string | null
          created_at: string
          id: string
          is_sample: boolean
          options: Json
          question: string
          results: Json
        }
        Insert: {
          active_date?: string
          country_code?: string | null
          created_at?: string
          id?: string
          is_sample?: boolean
          options?: Json
          question: string
          results?: Json
        }
        Update: {
          active_date?: string
          country_code?: string | null
          created_at?: string
          id?: string
          is_sample?: boolean
          options?: Json
          question?: string
          results?: Json
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          payload: Json
          updated_at: string
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          payload?: Json
          updated_at?: string
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      index_points: {
        Row: {
          created_at: string
          id: string
          index_id: string
          period: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          index_id: string
          period: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          index_id?: string
          period?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "index_points_index_id_fkey"
            columns: ["index_id"]
            isOneToOne: false
            referencedRelation: "indexes"
            referencedColumns: ["id"]
          },
        ]
      }
      indexes: {
        Row: {
          category_id: string | null
          change_value: number | null
          country_code: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          is_sample: boolean
          latest_value: number | null
          methodology_note: string | null
          name: string
          slug: string
          sort_order: number
          source_standard: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          change_value?: number | null
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          is_sample?: boolean
          latest_value?: number | null
          methodology_note?: string | null
          name: string
          slug: string
          sort_order?: number
          source_standard?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          change_value?: number | null
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          is_sample?: boolean
          latest_value?: number | null
          methodology_note?: string | null
          name?: string
          slug?: string
          sort_order?: number
          source_standard?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indexes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      market_outcomes: {
        Row: {
          created_at: string
          id: string
          implied_probability: number
          is_winning: boolean | null
          label: string
          market_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          implied_probability?: number
          is_winning?: boolean | null
          label: string
          market_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          implied_probability?: number
          is_winning?: boolean | null
          label?: string
          market_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_outcomes_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          category_id: string | null
          closes_at: string | null
          created_at: string
          id: string
          opens_at: string | null
          prize_pool_kes: number
          question: string
          resolution_notes: string | null
          resolution_source: string | null
          resolves_at: string | null
          slug: string
          sponsor_logo_url: string | null
          sponsor_name: string | null
          sponsor_org_id: string | null
          status: Database["public"]["Enums"]["market_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          closes_at?: string | null
          created_at?: string
          id?: string
          opens_at?: string | null
          prize_pool_kes?: number
          question: string
          resolution_notes?: string | null
          resolution_source?: string | null
          resolves_at?: string | null
          slug: string
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          sponsor_org_id?: string | null
          status?: Database["public"]["Enums"]["market_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          closes_at?: string | null
          created_at?: string
          id?: string
          opens_at?: string | null
          prize_pool_kes?: number
          question?: string
          resolution_notes?: string | null
          resolution_source?: string | null
          resolves_at?: string | null
          slug?: string
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          sponsor_org_id?: string | null
          status?: Database["public"]["Enums"]["market_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "markets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markets_sponsor_org_id_fkey"
            columns: ["sponsor_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["org_kind"]
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["org_kind"]
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["org_kind"]
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          admin_notes: string | null
          amount_kes: number
          created_at: string
          id: string
          mpesa_phone: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_kes: number
          created_at?: string
          id?: string
          mpesa_phone: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_kes?: number
          created_at?: string
          id?: string
          mpesa_phone?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      podcast_episodes: {
        Row: {
          audio_url: string | null
          created_at: string
          description: string | null
          duration_label: string | null
          guest_name: string | null
          guest_org: string | null
          guest_title: string | null
          id: string
          is_published: boolean
          linked_market_slug: string | null
          published_at: string
          slug: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          description?: string | null
          duration_label?: string | null
          guest_name?: string | null
          guest_org?: string | null
          guest_title?: string | null
          id?: string
          is_published?: boolean
          linked_market_slug?: string | null
          published_at?: string
          slug: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          description?: string | null
          duration_label?: string | null
          guest_name?: string | null
          guest_org?: string | null
          guest_title?: string | null
          id?: string
          is_published?: boolean
          linked_market_slug?: string | null
          published_at?: string
          slug?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      poll_answers: {
        Row: {
          created_at: string
          id: string
          option_id: string | null
          question_id: string
          response_id: string
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          option_id?: string | null
          question_id: string
          response_id: string
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string | null
          question_id?: string
          response_id?: string
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_answers_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_question_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "poll_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "poll_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_question_options: {
        Row: {
          created_at: string
          id: string
          label: string
          question_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          question_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "poll_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_questions: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["poll_question_kind"]
          poll_id: string
          prompt: string
          required: boolean
          scale_max: number | null
          scale_min: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["poll_question_kind"]
          poll_id: string
          prompt: string
          required?: boolean
          scale_max?: number | null
          scale_min?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["poll_question_kind"]
          poll_id?: string
          prompt?: string
          required?: boolean
          scale_max?: number | null
          scale_min?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_questions_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_responses: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          poll_id: string
          reward_kes: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          poll_id: string
          reward_kes?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          poll_id?: string
          reward_kes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          category_id: string | null
          closes_at: string | null
          completion_reward_kes: number | null
          country_code: string
          created_at: string
          cross_country: Json | null
          description: string | null
          est_minutes: number | null
          id: string
          index_slug: string | null
          kind: string
          methodology_note: string | null
          opens_at: string | null
          preview_enabled: boolean
          purpose: string | null
          question: string
          respondent_count: number
          reward_kes: number
          slug: string
          sponsor_logo_url: string | null
          sponsor_name: string | null
          status: Database["public"]["Enums"]["poll_status"]
          summary: string | null
          title: string
          updated_at: string
          what_it_measures: string | null
        }
        Insert: {
          category_id?: string | null
          closes_at?: string | null
          completion_reward_kes?: number | null
          country_code?: string
          created_at?: string
          cross_country?: Json | null
          description?: string | null
          est_minutes?: number | null
          id?: string
          index_slug?: string | null
          kind?: string
          methodology_note?: string | null
          opens_at?: string | null
          preview_enabled?: boolean
          purpose?: string | null
          question: string
          respondent_count?: number
          reward_kes?: number
          slug: string
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          status?: Database["public"]["Enums"]["poll_status"]
          summary?: string | null
          title: string
          updated_at?: string
          what_it_measures?: string | null
        }
        Update: {
          category_id?: string | null
          closes_at?: string | null
          completion_reward_kes?: number | null
          country_code?: string
          created_at?: string
          cross_country?: Json | null
          description?: string | null
          est_minutes?: number | null
          id?: string
          index_slug?: string | null
          kind?: string
          methodology_note?: string | null
          opens_at?: string | null
          preview_enabled?: boolean
          purpose?: string | null
          question?: string
          respondent_count?: number
          reward_kes?: number
          slug?: string
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          status?: Database["public"]["Enums"]["poll_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          what_it_measures?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "polls_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          confidence: number
          created_at: string
          id: string
          is_resolved: boolean
          market_id: string
          outcome_id: string
          points_awarded: number | null
          stake: number
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence: number
          created_at?: string
          id?: string
          is_resolved?: boolean
          market_id: string
          outcome_id: string
          points_awarded?: number | null
          stake?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          is_resolved?: boolean
          market_id?: string
          outcome_id?: string
          points_awarded?: number | null
          stake?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "market_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          display_name: string | null
          id: string
          locale: string | null
          persona: string | null
          phone: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string | null
          persona?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string | null
          persona?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ranking_entries: {
        Row: {
          change: number | null
          created_at: string
          id: string
          label: string
          logo_url: string | null
          rank: number
          ranking_id: string
          score: number | null
        }
        Insert: {
          change?: number | null
          created_at?: string
          id?: string
          label: string
          logo_url?: string | null
          rank: number
          ranking_id: string
          score?: number | null
        }
        Update: {
          change?: number | null
          created_at?: string
          id?: string
          label?: string
          logo_url?: string | null
          rank?: number
          ranking_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ranking_entries_ranking_id_fkey"
            columns: ["ranking_id"]
            isOneToOne: false
            referencedRelation: "rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      rankings: {
        Row: {
          category_id: string | null
          country_code: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          is_sample: boolean
          methodology_note: string | null
          published_at: string
          sample_size: number | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          is_sample?: boolean
          methodology_note?: string | null
          published_at?: string
          sample_size?: number | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          country_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          is_sample?: boolean
          methodology_note?: string | null
          published_at?: string
          sample_size?: number | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rankings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          access: string
          category_id: string | null
          contents: Json
          country_code: string | null
          cover_url: string | null
          created_at: string
          file_url: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          is_sample: boolean
          price_kes: number
          published_at: string
          sample_url: string | null
          slug: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          access?: string
          category_id?: string | null
          contents?: Json
          country_code?: string | null
          cover_url?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          is_sample?: boolean
          price_kes?: number
          published_at?: string
          sample_url?: string | null
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          access?: string
          category_id?: string | null
          contents?: Json
          country_code?: string | null
          cover_url?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          is_sample?: boolean
          price_kes?: number
          published_at?: string
          sample_url?: string | null
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      wallet_transactions: {
        Row: {
          amount_kes: number
          created_at: string
          id: string
          kind: string
          market_id: string | null
          memo: string | null
          payout_request_id: string | null
          user_id: string
        }
        Insert: {
          amount_kes: number
          created_at?: string
          id?: string
          kind: string
          market_id?: string | null
          memo?: string | null
          payout_request_id?: string | null
          user_id: string
        }
        Update: {
          amount_kes?: number
          created_at?: string
          id?: string
          kind?: string
          market_id?: string | null
          memo?: string | null
          payout_request_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      resolve_market: {
        Args: {
          p_market_id: string
          p_resolution_notes?: string
          p_winning_outcome_id: string
        }
        Returns: undefined
      }
      set_payout_status: {
        Args: {
          p_admin_notes?: string
          p_new_status: string
          p_payout_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "sponsor" | "partner"
      market_status: "draft" | "open" | "closed" | "resolved" | "void"
      org_kind: "sponsor" | "partner" | "media" | "internal"
      org_member_role: "owner" | "admin" | "editor" | "viewer"
      poll_question_kind: "single" | "multi" | "scale" | "text"
      poll_status: "draft" | "open" | "closed"
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
      app_role: ["admin", "moderator", "user", "sponsor", "partner"],
      market_status: ["draft", "open", "closed", "resolved", "void"],
      org_kind: ["sponsor", "partner", "media", "internal"],
      org_member_role: ["owner", "admin", "editor", "viewer"],
      poll_question_kind: ["single", "multi", "scale", "text"],
      poll_status: ["draft", "open", "closed"],
    },
  },
} as const
