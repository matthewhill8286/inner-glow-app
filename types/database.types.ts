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
      activity_logs: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          mood_after: string | null
          mood_before: string | null
          notes: string | null
          points_earned: number
          suggestion_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          mood_after?: string | null
          mood_before?: string | null
          notes?: string | null
          points_earned?: number
          suggestion_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          mood_after?: string | null
          mood_before?: string | null
          notes?: string | null
          points_earned?: number
          suggestion_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "ai_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_suggestions: {
        Row: {
          category: string
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          duration: string | null
          freud_score_id: string | null
          id: string
          points: number
          template_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          category: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration?: string | null
          freud_score_id?: string | null
          id?: string
          points?: number
          template_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration?: string | null
          freud_score_id?: string | null
          id?: string
          points?: number
          template_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_freud_score_id_fkey"
            columns: ["freud_score_id"]
            isOneToOne: false
            referencedRelation: "freud_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "suggestion_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          age: string | null
          created_at: string
          expression_check: Json | null
          gender: string | null
          goal: string | null
          meds: string | null
          mood: string | null
          other_symptoms: string | null
          physical_distress: string | null
          physical_distress_notes: string | null
          sleep_quality: number | null
          sought_help_before: string | null
          sound_check: Json | null
          stress_level: number | null
          taking_meds: string | null
          updated_at: string
          user_id: string
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          age?: string | null
          created_at?: string
          expression_check?: Json | null
          gender?: string | null
          goal?: string | null
          meds?: string | null
          mood?: string | null
          other_symptoms?: string | null
          physical_distress?: string | null
          physical_distress_notes?: string | null
          sleep_quality?: number | null
          sought_help_before?: string | null
          sound_check?: Json | null
          stress_level?: number | null
          taking_meds?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          age?: string | null
          created_at?: string
          expression_check?: Json | null
          gender?: string | null
          goal?: string | null
          meds?: string | null
          mood?: string | null
          other_symptoms?: string | null
          physical_distress?: string | null
          physical_distress_notes?: string | null
          sleep_quality?: number | null
          sought_help_before?: string | null
          sound_check?: Json | null
          stress_level?: number | null
          taking_meds?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: []
      }
      chat_histories: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          issue_key: string
          messages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          issue_key: string
          messages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          issue_key?: string
          messages?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      community_likes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          description: string
          id: string
          post_id: string | null
          read: boolean
          recipient_id: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          description: string
          id?: string
          post_id?: string | null
          read?: boolean
          recipient_id: string
          type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          description?: string
          id?: string
          post_id?: string | null
          read?: boolean
          recipient_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          category: string
          comments_count: number
          content: string
          created_at: string
          id: string
          image_key: string | null
          is_hidden: boolean
          likes_count: number
          post_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          image_key?: string | null
          is_hidden?: boolean
          likes_count?: number
          post_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          image_key?: string | null
          is_hidden?: boolean
          likes_count?: number
          post_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_profiles: {
        Row: {
          avatar: string
          bio: string | null
          created_at: string
          display_name: string
          followers_count: number
          following_count: number
          user_id: string
          verified: boolean
        }
        Insert: {
          avatar?: string
          bio?: string | null
          created_at?: string
          display_name?: string
          followers_count?: number
          following_count?: number
          user_id: string
          verified?: boolean
        }
        Update: {
          avatar?: string
          bio?: string | null
          created_at?: string
          display_name?: string
          followers_count?: number
          following_count?: number
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      freud_scores: {
        Row: {
          breakdown: Json
          created_at: string
          id: string
          label: string
          score: number
          source: string | null
          user_id: string
        }
        Insert: {
          breakdown?: Json
          created_at?: string
          id?: string
          label: string
          score: number
          source?: string | null
          user_id: string
        }
        Update: {
          breakdown?: Json
          created_at?: string
          id?: string
          label?: string
          score?: number
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          audio_url: string | null
          body: string
          created_at: string
          id: string
          is_voice_entry: boolean
          mood: string | null
          mood_log_id: string | null
          prompt_id: string | null
          recording_duration_ms: number | null
          tags: string[] | null
          title: string | null
          topic_context: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          body: string
          created_at?: string
          id?: string
          is_voice_entry?: boolean
          mood?: string | null
          mood_log_id?: string | null
          prompt_id?: string | null
          recording_duration_ms?: number | null
          tags?: string[] | null
          title?: string | null
          topic_context?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          body?: string
          created_at?: string
          id?: string
          is_voice_entry?: boolean
          mood?: string | null
          mood_log_id?: string | null
          prompt_id?: string | null
          recording_duration_ms?: number | null
          tags?: string[] | null
          title?: string | null
          topic_context?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_mood_log_id_fkey"
            columns: ["mood_log_id"]
            isOneToOne: false
            referencedRelation: "mood_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "journal_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_prompts: {
        Row: {
          context_tag: string
          id: string
          phase: Database["public"]["Enums"]["journal_phase"]
          question: string
          topic_id: string | null
        }
        Insert: {
          context_tag: string
          id?: string
          phase?: Database["public"]["Enums"]["journal_phase"]
          question: string
          topic_id?: string | null
        }
        Update: {
          context_tag?: string
          id?: string
          phase?: Database["public"]["Enums"]["journal_phase"]
          question?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_prompts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      mindfulness: {
        Row: {
          created_at: string
          date_iso: string
          id: string
          note: string | null
          seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_iso?: string
          id?: string
          note?: string | null
          seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_iso?: string
          id?: string
          note?: string | null
          seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_logs: {
        Row: {
          emotions: string[] | null
          energy_score: number
          id: string
          logged_at: string
          mood_score: number
          note: string | null
          stress_score: number
          topic_context: string | null
          user_id: string
        }
        Insert: {
          emotions?: string[] | null
          energy_score: number
          id?: string
          logged_at?: string
          mood_score: number
          note?: string | null
          stress_score: number
          topic_context?: string | null
          user_id: string
        }
        Update: {
          emotions?: string[] | null
          energy_score?: number
          id?: string
          logged_at?: string
          mood_score?: number
          note?: string | null
          stress_score?: number
          topic_context?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          intention: string | null
          name: string | null
          routine: string | null
          selected_issues: Json | null
          subscription_expiry: string | null
          subscription_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          intention?: string | null
          name?: string | null
          routine?: string | null
          selected_issues?: Json | null
          subscription_expiry?: string | null
          subscription_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          intention?: string | null
          name?: string | null
          routine?: string | null
          selected_issues?: Json | null
          subscription_expiry?: string | null
          subscription_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sleep: {
        Row: {
          awakenings: number | null
          created_at: string
          duration: number | null
          end_iso: string | null
          id: string
          notes: string | null
          quality: number | null
          start_iso: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          awakenings?: number | null
          created_at?: string
          duration?: number | null
          end_iso?: string | null
          id?: string
          notes?: string | null
          quality?: number | null
          start_iso?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          awakenings?: number | null
          created_at?: string
          duration?: number | null
          end_iso?: string | null
          id?: string
          notes?: string | null
          quality?: number | null
          start_iso?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stress_histories: {
        Row: {
          created_at: string
          date: string
          exercise_id: string | null
          id: string
          title: string | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          exercise_id?: string | null
          id?: string
          title?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          exercise_id?: string | null
          id?: string
          title?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stress_kits: {
        Row: {
          created_at: string
          helpful_actions: Json | null
          last_check_in: string | null
          level: number | null
          notes: string | null
          people: Json | null
          quick_phrase: string | null
          triggers: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          helpful_actions?: Json | null
          last_check_in?: string | null
          level?: number | null
          notes?: string | null
          people?: Json | null
          quick_phrase?: string | null
          triggers?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          helpful_actions?: Json | null
          last_check_in?: string | null
          level?: number | null
          notes?: string | null
          people?: Json | null
          quick_phrase?: string | null
          triggers?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suggestion_templates: {
        Row: {
          active: boolean | null
          category: string
          created_at: string
          description: string | null
          difficulty: string | null
          duration: string | null
          id: string
          max_score: number | null
          min_score: number | null
          points: number
          target_weakness: string | null
          title: string
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration?: string | null
          id?: string
          max_score?: number | null
          min_score?: number | null
          points?: number
          target_weakness?: string | null
          title: string
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration?: string | null
          id?: string
          max_score?: number | null
          min_score?: number | null
          points?: number
          target_weakness?: string | null
          title?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          context_tags: string[] | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          context_tags?: string[] | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          context_tags?: string[] | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      safe_float: { Args: { v: string }; Returns: number }
      safe_int: { Args: { v: string }; Returns: number }
      safe_ts: { Args: { v: string }; Returns: string }
    }
    Enums: {
      journal_phase: "reflection" | "coping" | "awareness" | "general"
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
      journal_phase: ["reflection", "coping", "awareness", "general"],
    },
  },
} as const
