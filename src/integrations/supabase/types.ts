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
      badges: {
        Row: {
          badge_key: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_key: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          ai_feedback: Json | null
          category: Database["public"]["Enums"]["habit_category"]
          check_date: string
          confidence_score: number | null
          created_at: string
          credits_awarded: number
          habit_id: string
          id: string
          proof_data: Json | null
          proof_image_url: string | null
          status: Database["public"]["Enums"]["checkin_status"]
          user_id: string
          verification_score: number | null
        }
        Insert: {
          ai_feedback?: Json | null
          category: Database["public"]["Enums"]["habit_category"]
          check_date?: string
          confidence_score?: number | null
          created_at?: string
          credits_awarded?: number
          habit_id: string
          id?: string
          proof_data?: Json | null
          proof_image_url?: string | null
          status?: Database["public"]["Enums"]["checkin_status"]
          user_id: string
          verification_score?: number | null
        }
        Update: {
          ai_feedback?: Json | null
          category?: Database["public"]["Enums"]["habit_category"]
          check_date?: string
          confidence_score?: number | null
          created_at?: string
          credits_awarded?: number
          habit_id?: string
          id?: string
          proof_data?: Json | null
          proof_image_url?: string | null
          status?: Database["public"]["Enums"]["checkin_status"]
          user_id?: string
          verification_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_balances: {
        Row: {
          balance: number
          category: Database["public"]["Enums"]["habit_category"]
          lifetime_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          category: Database["public"]["Enums"]["habit_category"]
          lifetime_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          category?: Database["public"]["Enums"]["habit_category"]
          lifetime_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["habit_category"]
          created_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["habit_category"]
          created_at?: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["habit_category"]
          created_at?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      habits: {
        Row: {
          archived: boolean
          category: Database["public"]["Enums"]["habit_category"]
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          category: Database["public"]["Enums"]["habit_category"]
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          category?: Database["public"]["Enums"]["habit_category"]
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          consistency_score: number
          created_at: string
          current_streak: number
          display_name: string | null
          id: string
          level: number
          longest_streak: number
          updated_at: string
          username: string
          verification_accuracy: number
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          consistency_score?: number
          created_at?: string
          current_streak?: number
          display_name?: string | null
          id: string
          level?: number
          longest_streak?: number
          updated_at?: string
          username: string
          verification_accuracy?: number
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          consistency_score?: number
          created_at?: string
          current_streak?: number
          display_name?: string | null
          id?: string
          level?: number
          longest_streak?: number
          updated_at?: string
          username?: string
          verification_accuracy?: number
          xp?: number
        }
        Relationships: []
      }
      shields: {
        Row: {
          category: Database["public"]["Enums"]["habit_category"]
          cost: number
          expires_at: string
          id: string
          protects_days: number
          purchased_at: string
          status: Database["public"]["Enums"]["shield_status"]
          tier: Database["public"]["Enums"]["shield_tier"]
          used_at: string | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["habit_category"]
          cost: number
          expires_at: string
          id?: string
          protects_days: number
          purchased_at?: string
          status?: Database["public"]["Enums"]["shield_status"]
          tier: Database["public"]["Enums"]["shield_tier"]
          used_at?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["habit_category"]
          cost?: number
          expires_at?: string
          id?: string
          protects_days?: number
          purchased_at?: string
          status?: Database["public"]["Enums"]["shield_status"]
          tier?: Database["public"]["Enums"]["shield_tier"]
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_credits: {
        Args: {
          _amount: number
          _category: Database["public"]["Enums"]["habit_category"]
          _reason: string
          _user_id: string
        }
        Returns: undefined
      }
      expire_old_shields: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      checkin_status: "pending" | "verified" | "rejected"
      habit_category:
        | "coding"
        | "reading"
        | "gym"
        | "running"
        | "meditation"
        | "fasting"
        | "custom"
      shield_status: "active" | "used" | "expired"
      shield_tier: "bronze" | "silver" | "gold"
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
      checkin_status: ["pending", "verified", "rejected"],
      habit_category: [
        "coding",
        "reading",
        "gym",
        "running",
        "meditation",
        "fasting",
        "custom",
      ],
      shield_status: ["active", "used", "expired"],
      shield_tier: ["bronze", "silver", "gold"],
    },
  },
} as const
