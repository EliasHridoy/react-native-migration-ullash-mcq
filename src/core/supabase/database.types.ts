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
      bkash_transactions: {
        Row: {
          amount: number
          bkash_url: string | null
          created_at: string
          currency: string
          id: string
          ipn_verified: boolean
          merchant_invoice_number: string
          payment_id: string | null
          plan_id: string | null
          raw_create_response: Json | null
          raw_execute_response: Json | null
          status: string
          trx_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bkash_url?: string | null
          created_at?: string
          currency?: string
          id?: string
          ipn_verified?: boolean
          merchant_invoice_number: string
          payment_id?: string | null
          plan_id?: string | null
          raw_create_response?: Json | null
          raw_execute_response?: Json | null
          status?: string
          trx_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bkash_url?: string | null
          created_at?: string
          currency?: string
          id?: string
          ipn_verified?: boolean
          merchant_invoice_number?: string
          payment_id?: string | null
          plan_id?: string | null
          raw_create_response?: Json | null
          raw_execute_response?: Json | null
          status?: string
          trx_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bkash_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          category: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chapters: {
        Row: {
          created_at: string | null
          id: string
          name: string
          serial_no: number
          subject_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          serial_no?: number
          subject_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          serial_no?: number
          subject_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_question_list: {
        Row: {
          exam_id: string
          marks_weight: number | null
          question_id: string
        }
        Insert: {
          exam_id: string
          marks_weight?: number | null
          question_id: string
        }
        Update: {
          exam_id?: string
          marks_weight?: number | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_question_list_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_question_list_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string | null
          duration_minutes: number
          end_time: string
          exam_type: Database["public"]["Enums"]["exam_type"]
          id: string
          negative_marking_value: number | null
          start_time: string
          status: string
          subject_id: string | null
          title: string
          total_marks: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number
          end_time: string
          exam_type: Database["public"]["Enums"]["exam_type"]
          id?: string
          negative_marking_value?: number | null
          start_time: string
          status?: string
          subject_id?: string | null
          title: string
          total_marks?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number
          end_time?: string
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          negative_marking_value?: number | null
          start_time?: string
          status?: string
          subject_id?: string | null
          title?: string
          total_marks?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      hint_usage: {
        Row: {
          created_at: string
          hint_count: number
          id: string
          last_hint_at: string
          question_id: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          hint_count?: number
          id?: string
          last_hint_at?: string
          question_id: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          hint_count?: number
          id?: string
          last_hint_at?: string
          question_id?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hint_usage_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hint_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_snapshots: {
        Row: {
          exam_id: string
          id: string
          rank: number
          score: number
          snapshot_at: string | null
          user_id: string
        }
        Insert: {
          exam_id: string
          id?: string
          rank: number
          score: number
          snapshot_at?: string | null
          user_id: string
        }
        Update: {
          exam_id?: string
          id?: string
          rank?: number
          score?: number
          snapshot_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_snapshots_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      material_topic_map: {
        Row: {
          material_id: string
          topic_id: string
        }
        Insert: {
          material_id: string
          topic_id: string
        }
        Update: {
          material_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_topic_map_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_topic_map_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_practice_queue: {
        Row: {
          completed_at: string | null
          created_at: string | null
          gap_id: string
          id: string
          priority: number
          question_count: number
          score: number | null
          status: string
          topic_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          gap_id: string
          id?: string
          priority?: number
          question_count?: number
          score?: number | null
          status?: string
          topic_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          gap_id?: string
          id?: string
          priority?: number
          question_count?: number
          score?: number | null
          status?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "micro_practice_queue_gap_id_fkey"
            columns: ["gap_id"]
            isOneToOne: false
            referencedRelation: "user_weakness_gaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "micro_practice_queue_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      options: {
        Row: {
          id: string
          is_correct: boolean
          option_text: string
          question_id: string
          serial_no: number
        }
        Insert: {
          id?: string
          is_correct?: boolean
          option_text: string
          question_id: string
          serial_no?: number
        }
        Update: {
          id?: string
          is_correct?: boolean
          option_text?: string
          question_id?: string
          serial_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          board_id: string | null
          created_at: string | null
          email: string | null
          entitlement_expires_at: string | null
          full_name: string | null
          grace_period_ends_at: string | null
          id: string
          phone_number: string | null
          revenuecat_customer_id: string | null
          subscription_status: string
          subscription_tier: string | null
          subscription_updated_at: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          board_id?: string | null
          created_at?: string | null
          email?: string | null
          entitlement_expires_at?: string | null
          full_name?: string | null
          grace_period_ends_at?: string | null
          id: string
          phone_number?: string | null
          revenuecat_customer_id?: string | null
          subscription_status?: string
          subscription_tier?: string | null
          subscription_updated_at?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          board_id?: string | null
          created_at?: string | null
          email?: string | null
          entitlement_expires_at?: string | null
          full_name?: string | null
          grace_period_ends_at?: string | null
          id?: string
          phone_number?: string | null
          revenuecat_customer_id?: string | null
          subscription_status?: string
          subscription_tier?: string | null
          subscription_updated_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_board"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      question_hierarchy_map: {
        Row: {
          chapter_id: string | null
          question_id: string
          subject_id: string | null
          topic_id: string | null
        }
        Insert: {
          chapter_id?: string | null
          question_id: string
          subject_id?: string | null
          topic_id?: string | null
        }
        Update: {
          chapter_id?: string | null
          question_id?: string
          subject_id?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_hierarchy_map_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_hierarchy_map_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_hierarchy_map_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_hierarchy_map_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      question_origin_map: {
        Row: {
          board_id: string
          exam_type: string | null
          exam_year: number
          id: string
          question_id: string
        }
        Insert: {
          board_id: string
          exam_type?: string | null
          exam_year: number
          id?: string
          question_id: string
        }
        Update: {
          board_id?: string
          exam_type?: string | null
          exam_year?: number
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_origin_map_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_origin_map_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_status: {
        Row: {
          id: string
          is_completed: boolean
          question_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_completed?: boolean
          question_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_completed?: boolean
          question_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_status_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string | null
          created_by: string | null
          difficulty_level: Database["public"]["Enums"]["difficulty_level"]
          explanation_text: string | null
          explanation_video_url: string | null
          id: string
          is_active: boolean | null
          text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"]
          explanation_text?: string | null
          explanation_video_url?: string | null
          id?: string
          is_active?: boolean | null
          text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"]
          explanation_text?: string | null
          explanation_video_url?: string | null
          id?: string
          is_active?: boolean | null
          text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      redis_sorted_sets: {
        Row: {
          key: string
          member: string
          score: number
        }
        Insert: {
          key: string
          member: string
          score: number
        }
        Update: {
          key?: string
          member?: string
          score?: number
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          created_at: string | null
          description: string | null
          embedding: string | null
          id: string
          is_premium: boolean | null
          material_type: string
          thumbnail_url: string | null
          title: string
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          is_premium?: boolean | null
          material_type: string
          thumbnail_url?: string | null
          title: string
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          is_premium?: boolean | null
          material_type?: string
          thumbnail_url?: string | null
          title?: string
          url?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string | null
          icon_url: string | null
          id: string
          name: string
          subject_code: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon_url?: string | null
          id?: string
          name: string
          subject_code?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          subject_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          processed_at: string
          product_id: string | null
          raw_payload: Json | null
          revenuecat_event_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          processed_at?: string
          product_id?: string | null
          raw_payload?: Json | null
          revenuecat_event_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          processed_at?: string
          product_id?: string | null
          raw_payload?: Json | null
          revenuecat_event_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          chapter_id: string
          created_at: string | null
          id: string
          name: string
          serial_no: number
          updated_at: string | null
        }
        Insert: {
          chapter_id: string
          created_at?: string | null
          id?: string
          name: string
          serial_no?: number
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string
          created_at?: string | null
          id?: string
          name?: string
          serial_no?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_exam_results: {
        Row: {
          completed_at: string | null
          correct_answers: number
          exam_id: string
          final_rank_value: number
          id: string
          rank: number | null
          score: number
          skipped_questions: number
          time_taken_seconds: number
          topic_results: Json
          total_questions: number
          user_id: string
          wrong_answers: number
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number
          exam_id: string
          final_rank_value?: number
          id?: string
          rank?: number | null
          score?: number
          skipped_questions?: number
          time_taken_seconds?: number
          topic_results?: Json
          total_questions?: number
          user_id: string
          wrong_answers?: number
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number
          exam_id?: string
          final_rank_value?: number
          id?: string
          rank?: number | null
          score?: number
          skipped_questions?: number
          time_taken_seconds?: number
          topic_results?: Json
          total_questions?: number
          user_id?: string
          wrong_answers?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_exam_sessions: {
        Row: {
          client_offset_ms: number | null
          entered_at: string | null
          exam_id: string
          id: string
          is_submitted: boolean
          question_order: Json
          selected_answers: Json
          shuffle_seed: number
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_offset_ms?: number | null
          entered_at?: string | null
          exam_id: string
          id?: string
          is_submitted?: boolean
          question_order?: Json
          selected_answers?: Json
          shuffle_seed: number
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_offset_ms?: number | null
          entered_at?: string | null
          exam_id?: string
          id?: string
          is_submitted?: boolean
          question_order?: Json
          selected_answers?: Json
          shuffle_seed?: number
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exam_sessions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_weakness_gaps: {
        Row: {
          accuracy: number
          created_at: string | null
          id: string
          is_remediated: boolean
          source_exam_id: string | null
          topic_id: string
          total_attempted: number
          total_correct: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accuracy?: number
          created_at?: string | null
          id?: string
          is_remediated?: boolean
          source_exam_id?: string | null
          topic_id: string
          total_attempted?: number
          total_correct?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accuracy?: number
          created_at?: string | null
          id?: string
          is_remediated?: boolean
          source_exam_id?: string | null
          topic_id?: string
          total_attempted?: number
          total_correct?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_weakness_gaps_source_exam_id_fkey"
            columns: ["source_exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_weakness_gaps_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_exam_score: {
        Args: {
          p_answers: Json
          p_end_time: string
          p_entered_at: string
          p_exam_id: string
          p_negative_mark: number
        }
        Returns: {
          correct_count: number
          final_rank_value: number
          score: number
          skipped_count: number
          time_taken_seconds: number
          topic_results_json: Json
          total_count: number
          wrong_count: number
        }[]
      }
      dearmor: { Args: { "": string }; Returns: string }
      gen_random_uuid: { Args: never; Returns: string }
      gen_salt: { Args: { "": string }; Returns: string }
      get_bkash_transactions: {
        Args: never
        Returns: {
          amount: number
          created_at: string
          currency: string
          id: string
          ipn_verified: boolean
          merchant_invoice_number: string
          payment_id: string
          plan_id: string
          status: string
          trx_id: string
        }[]
      }
      get_entitlement_status: {
        Args: never
        Returns: {
          entitlement_expires_at: string
          grace_period_ends_at: string
          has_premium_access: boolean
          is_in_grace_period: boolean
          subscription_status: string
          subscription_tier: string
        }[]
      }
      get_exam_leaderboard: {
        Args: { p_exam_id: string }
        Returns: {
          avatar_url: string
          completed_at: string
          full_name: string
          rank: number
          score: number
          time_taken_seconds: number
          user_id: string
        }[]
      }
      get_global_leaderboard: {
        Args: never
        Returns: {
          avatar_url: string
          exams_completed: number
          full_name: string
          rank: number
          total_score: number
          user_id: string
        }[]
      }
      get_server_time: { Args: never; Returns: string }
      get_weakness_heatmap: { Args: { p_user_id: string }; Returns: Json }
      pgp_armor_headers: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
      semantic_search_materials: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_topic_id?: string
          query_embedding: string
        }
        Returns: {
          description: string
          id: string
          is_premium: boolean
          material_type: string
          similarity: number
          title: string
          topic_id: string
          url: string
        }[]
      }
      submit_exam_session: {
        Args: { p_answers: Json; p_session_id: string }
        Returns: undefined
      }
      sync_leaderboard_snapshots: { Args: never; Returns: undefined }
      upsert_bkash_payment: {
        Args: {
          p_amount: number
          p_bkash_url?: string
          p_ipn_verified?: boolean
          p_merchant_invoice_number: string
          p_payment_id?: string
          p_plan_id: string
          p_raw_create_response?: Json
          p_raw_execute_response?: Json
          p_status: string
          p_trx_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
      upsert_subscription: {
        Args: {
          p_entitlement_expires_at: string
          p_event_type: string
          p_grace_period_ends_at: string
          p_product_id: string
          p_raw_payload: Json
          p_revenuecat_customer_id: string
          p_revenuecat_event_id: string
          p_subscription_status: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      difficulty_level: "easy" | "medium" | "hard"
      exam_type: "model_test" | "past_paper" | "practice_quiz"
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
      difficulty_level: ["easy", "medium", "hard"],
      exam_type: ["model_test", "past_paper", "practice_quiz"],
    },
  },
} as const

