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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      daily_tracks: {
        Row: {
          created_at: string
          frequency_description: string | null
          frequency_level: number
          guide_id: string | null
          health_event_id: string
          id: string
          life_context: Json
          notes: string | null
          severity: number
          subjective_change: string
          suggestion_execution: Json
          track_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency_description?: string | null
          frequency_level: number
          guide_id?: string | null
          health_event_id: string
          id?: string
          life_context: Json
          notes?: string | null
          severity: number
          subjective_change: string
          suggestion_execution?: Json
          track_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency_description?: string | null
          frequency_level?: number
          guide_id?: string | null
          health_event_id?: string
          id?: string
          life_context?: Json
          notes?: string | null
          severity?: number
          subjective_change?: string
          suggestion_execution?: Json
          track_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_tracks_event_owner_fk"
            columns: ["health_event_id", "user_id"]
            isOneToOne: false
            referencedRelation: "health_events"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "daily_tracks_guide_same_event_fk"
            columns: ["guide_id", "health_event_id", "user_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id", "health_event_id", "user_id"]
          },
        ]
      }
      guides: {
        Row: {
          content_snapshot: Json
          created_at: string
          health_event_id: string
          id: string
          record_revision: number
          safety_assessment_id: string
          suggestions_snapshot: Json
          template_code: string
          template_version: string
          user_id: string
          version_number: number
        }
        Insert: {
          content_snapshot: Json
          created_at?: string
          health_event_id: string
          id?: string
          record_revision: number
          safety_assessment_id: string
          suggestions_snapshot: Json
          template_code: string
          template_version: string
          user_id: string
          version_number: number
        }
        Update: {
          content_snapshot?: Json
          created_at?: string
          health_event_id?: string
          id?: string
          record_revision?: number
          safety_assessment_id?: string
          suggestions_snapshot?: Json
          template_code?: string
          template_version?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "guides_event_owner_fk"
            columns: ["health_event_id", "user_id"]
            isOneToOne: false
            referencedRelation: "health_events"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "guides_safety_same_event_fk"
            columns: ["safety_assessment_id", "health_event_id", "user_id"]
            isOneToOne: false
            referencedRelation: "safety_assessments"
            referencedColumns: ["id", "health_event_id", "user_id"]
          },
        ]
      }
      health_events: {
        Row: {
          closed_at: string | null
          created_at: string
          custom_primary_symptom: string | null
          id: string
          primary_symptom_id: string
          started_on: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          custom_primary_symptom?: string | null
          id?: string
          primary_symptom_id: string
          started_on?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          custom_primary_symptom?: string | null
          id?: string
          primary_symptom_id?: string
          started_on?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_events_primary_symptom_id_fkey"
            columns: ["primary_symptom_id"]
            isOneToOne: false
            referencedRelation: "symptom_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      health_summaries: {
        Row: {
          confirmed_at: string | null
          created_at: string
          health_event_id: string
          id: string
          latest_track_date: string | null
          snapshot_content: Json
          source_data_updated_at: string
          source_record_revision: number
          status: string
          summary_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          health_event_id: string
          id?: string
          latest_track_date?: string | null
          snapshot_content: Json
          source_data_updated_at: string
          source_record_revision: number
          status?: string
          summary_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          health_event_id?: string
          id?: string
          latest_track_date?: string | null
          snapshot_content?: Json
          source_data_updated_at?: string
          source_record_revision?: number
          status?: string
          summary_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_summaries_event_owner_fk"
            columns: ["health_event_id", "user_id"]
            isOneToOne: false
            referencedRelation: "health_events"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      initial_records: {
        Row: {
          associated_symptoms: Json
          created_at: string
          duration_unit: string
          duration_value: number
          frequency_description: string | null
          frequency_level: number
          health_event_id: string
          id: string
          life_context: Json
          revision: number
          severity: number
          supplemental_description: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          associated_symptoms?: Json
          created_at?: string
          duration_unit: string
          duration_value: number
          frequency_description?: string | null
          frequency_level: number
          health_event_id: string
          id?: string
          life_context: Json
          revision?: number
          severity: number
          supplemental_description?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          associated_symptoms?: Json
          created_at?: string
          duration_unit?: string
          duration_value?: number
          frequency_description?: string | null
          frequency_level?: number
          health_event_id?: string
          id?: string
          life_context?: Json
          revision?: number
          severity?: number
          supplemental_description?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "initial_records_event_owner_fk"
            columns: ["health_event_id", "user_id"]
            isOneToOne: false
            referencedRelation: "health_events"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      navigation_templates: {
        Row: {
          code: string
          content: Json
          created_at: string
          id: string
          is_active: boolean
          is_fallback: boolean
          navigation_type: string
          safety_context: string
          sources: Json
          symptom_id: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          code: string
          content: Json
          created_at?: string
          id?: string
          is_active?: boolean
          is_fallback?: boolean
          navigation_type: string
          safety_context: string
          sources?: Json
          symptom_id?: string | null
          title: string
          updated_at?: string
          version: number
        }
        Update: {
          code?: string
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          is_fallback?: boolean
          navigation_type?: string
          safety_context?: string
          sources?: Json
          symptom_id?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "navigation_templates_symptom_id_fkey"
            columns: ["symptom_id"]
            isOneToOne: false
            referencedRelation: "symptom_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_year: number | null
          created_at: string
          display_name: string | null
          gender: string | null
          health_background: Json
          id: string
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          updated_at: string
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          health_background?: Json
          id: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          updated_at?: string
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          health_background?: Json
          id?: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      safety_assessments: {
        Row: {
          answers_snapshot: Json
          assessment_status: string
          created_at: string
          failure_reason: string | null
          health_event_id: string
          id: string
          record_revision: number
          resolved_at: string | null
          result: string | null
          rule_version: string
          source_daily_track_id: string | null
          trigger_type: string
          user_id: string
        }
        Insert: {
          answers_snapshot?: Json
          assessment_status?: string
          created_at?: string
          failure_reason?: string | null
          health_event_id: string
          id?: string
          record_revision: number
          resolved_at?: string | null
          result?: string | null
          rule_version: string
          source_daily_track_id?: string | null
          trigger_type: string
          user_id: string
        }
        Update: {
          answers_snapshot?: Json
          assessment_status?: string
          created_at?: string
          failure_reason?: string | null
          health_event_id?: string
          id?: string
          record_revision?: number
          resolved_at?: string | null
          result?: string | null
          rule_version?: string
          source_daily_track_id?: string | null
          trigger_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_assessments_event_owner_fk"
            columns: ["health_event_id", "user_id"]
            isOneToOne: false
            referencedRelation: "health_events"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "safety_assessments_source_track_same_event_fk"
            columns: ["source_daily_track_id", "health_event_id", "user_id"]
            isOneToOne: false
            referencedRelation: "daily_tracks"
            referencedColumns: ["id", "health_event_id", "user_id"]
          },
        ]
      }
      symptom_catalog: {
        Row: {
          category_code: string
          category_name: string
          code: string
          created_at: string
          description: string | null
          display_name: string
          display_order: number
          id: string
          is_active: boolean
          is_hero_group: boolean
          is_other: boolean
          is_primary_enabled: boolean
          updated_at: string
        }
        Insert: {
          category_code: string
          category_name: string
          code: string
          created_at?: string
          description?: string | null
          display_name: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_hero_group?: boolean
          is_other?: boolean
          is_primary_enabled?: boolean
          updated_at?: string
        }
        Update: {
          category_code?: string
          category_name?: string
          code?: string
          created_at?: string
          description?: string | null
          display_name?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_hero_group?: boolean
          is_other?: boolean
          is_primary_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_health_event: {
        Args: {
          p_associated_symptoms?: Json
          p_custom_primary_symptom?: string
          p_duration_unit: string
          p_duration_value: number
          p_frequency_description?: string
          p_frequency_level: number
          p_life_context: Json
          p_primary_symptom_id: string
          p_severity: number
          p_started_on: string
          p_supplemental_description?: string
        }
        Returns: {
          health_event_id: string
          initial_record_id: string
        }[]
      }
      run_safety_assessment: {
        Args: {
          p_answers: Json
          p_health_event_id: string
          p_trigger_type?: string
        }
        Returns: {
          assessment_status: string
          record_revision: number
          result: string
          rule_version: string
          safety_assessment_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
