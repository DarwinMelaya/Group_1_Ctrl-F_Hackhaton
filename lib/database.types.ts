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
      boats: {
        Row: {
          boatr_no: string | null
          created_at: string
          gross_tons: number | null
          id: string
          name: string
          owner_id: string
          registered_at: string | null
        }
        Insert: {
          boatr_no?: string | null
          created_at?: string
          gross_tons?: number | null
          id?: string
          name: string
          owner_id: string
          registered_at?: string | null
        }
        Update: {
          boatr_no?: string | null
          created_at?: string
          gross_tons?: number | null
          id?: string
          name?: string
          owner_id?: string
          registered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boats_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catches: {
        Row: {
          admin_note: string | null
          boat_id: string | null
          caught_at: string
          client_uuid: string | null
          fisher_id: string
          flag_reasons: string[]
          geom: unknown | null
          id: string
          late_entry_reason: string | null
          logged_at: string
          logged_by: string | null
          photo_url: string | null
          qr_token: string
          recorded_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          size_cm: number | null
          source: Database["public"]["Enums"]["catch_source"]
          species_id: string
          status: Database["public"]["Enums"]["catch_status"]
          weight_kg: number
          zone_id: string | null
          zone_status: Database["public"]["Enums"]["zone_status"]
        }
        Insert: {
          admin_note?: string | null
          boat_id?: string | null
          caught_at?: string
          client_uuid?: string | null
          fisher_id: string
          flag_reasons?: string[]
          geom?: unknown | null
          id?: string
          late_entry_reason?: string | null
          logged_at?: string
          logged_by?: string | null
          photo_url?: string | null
          qr_token: string
          recorded_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_cm?: number | null
          source?: Database["public"]["Enums"]["catch_source"]
          species_id: string
          status?: Database["public"]["Enums"]["catch_status"]
          weight_kg: number
          zone_id?: string | null
          zone_status?: Database["public"]["Enums"]["zone_status"]
        }
        Update: {
          admin_note?: string | null
          boat_id?: string | null
          caught_at?: string
          client_uuid?: string | null
          fisher_id?: string
          flag_reasons?: string[]
          geom?: unknown | null
          id?: string
          late_entry_reason?: string | null
          logged_at?: string
          logged_by?: string | null
          photo_url?: string | null
          qr_token?: string
          recorded_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_cm?: number | null
          source?: Database["public"]["Enums"]["catch_source"]
          species_id?: string
          status?: Database["public"]["Enums"]["catch_status"]
          weight_kg?: number
          zone_id?: string | null
          zone_status?: Database["public"]["Enums"]["zone_status"]
        }
        Relationships: [
          {
            foreignKeyName: "catches_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_fisher_id_fkey"
            columns: ["fisher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_geojson"
            referencedColumns: ["id"]
          },
        ]
      }
      municipalities: {
        Row: {
          name: string
          sort_order: number
        }
        Insert: {
          name: string
          sort_order: number
        }
        Update: {
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          barangay: string | null
          created_at: string
          fishr_no: string | null
          full_name: string
          id: string
          license_expiry: string | null
          municipality: string | null
          onboarded_at: string | null
          phone: string | null
          preferred_language: string | null
          requested_role: Database["public"]["Enums"]["user_role"] | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          barangay?: string | null
          created_at?: string
          fishr_no?: string | null
          full_name?: string
          id: string
          license_expiry?: string | null
          municipality?: string | null
          onboarded_at?: string | null
          phone?: string | null
          preferred_language?: string | null
          requested_role?: Database["public"]["Enums"]["user_role"] | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          barangay?: string | null
          created_at?: string
          fishr_no?: string | null
          full_name?: string
          id?: string
          license_expiry?: string | null
          municipality?: string | null
          onboarded_at?: string | null
          phone?: string | null
          preferred_language?: string | null
          requested_role?: Database["public"]["Enums"]["user_role"] | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_municipality_fkey"
            columns: ["municipality"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["name"]
          },
        ]
      }
      registration_submissions: {
        Row: {
          admin_note: string | null
          boatr_no: string | null
          created_at: string
          fishr_no: string | null
          id: string
          license_expiry: string | null
          profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          admin_note?: string | null
          boatr_no?: string | null
          created_at?: string
          fishr_no?: string | null
          id?: string
          license_expiry?: string | null
          profile_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          admin_note?: string | null
          boatr_no?: string | null
          created_at?: string
          fishr_no?: string | null
          id?: string
          license_expiry?: string | null
          profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_submissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_note: string | null
          created_at: string
          description: string
          geom: unknown | null
          id: string
          photo_url: string | null
          reporter_id: string | null
          status: Database["public"]["Enums"]["report_status"]
          type: Database["public"]["Enums"]["report_type"]
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          description: string
          geom?: unknown | null
          id?: string
          photo_url?: string | null
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          type: Database["public"]["Enums"]["report_type"]
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          description?: string
          geom?: unknown | null
          id?: string
          photo_url?: string | null
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          type?: Database["public"]["Enums"]["report_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      species: {
        Row: {
          closed_season_end: string | null
          closed_season_start: string | null
          english_name: string
          id: string
          local_name: string
          min_legal_size_cm: number | null
          scientific_name: string | null
        }
        Insert: {
          closed_season_end?: string | null
          closed_season_start?: string | null
          english_name: string
          id?: string
          local_name: string
          min_legal_size_cm?: number | null
          scientific_name?: string | null
        }
        Update: {
          closed_season_end?: string | null
          closed_season_start?: string | null
          english_name?: string
          id?: string
          local_name?: string
          min_legal_size_cm?: number | null
          scientific_name?: string | null
        }
        Relationships: []
      }
      spots_gallery: {
        Row: {
          approved: boolean
          created_at: string
          geom: unknown | null
          id: string
          photo_url: string | null
          reef_condition: Database["public"]["Enums"]["reef_condition"] | null
          title: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          geom?: unknown | null
          id?: string
          photo_url?: string | null
          reef_condition?: Database["public"]["Enums"]["reef_condition"] | null
          title: string
          user_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          geom?: unknown | null
          id?: string
          photo_url?: string | null
          reef_condition?: Database["public"]["Enums"]["reef_condition"] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spots_gallery_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          geom: unknown
          id: string
          name: string
          reason: string | null
          type: Database["public"]["Enums"]["zone_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          geom: unknown
          id?: string
          name: string
          reason?: string | null
          type: Database["public"]["Enums"]["zone_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          geom?: unknown
          id?: string
          name?: string
          reason?: string | null
          type?: Database["public"]["Enums"]["zone_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      catch_details: {
        Row: {
          admin_note: string | null
          barangay: string | null
          boat_id: string | null
          boat_name: string | null
          boatr_no: string | null
          caught_at: string | null
          client_uuid: string | null
          fisher_id: string | null
          fisher_name: string | null
          fishr_no: string | null
          flag_reasons: string[] | null
          gross_tons: number | null
          id: string | null
          lat: number | null
          late_entry_reason: string | null
          lng: number | null
          logged_at: string | null
          logged_by: string | null
          municipality: string | null
          photo_url: string | null
          qr_token: string | null
          recorded_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          size_cm: number | null
          source: Database["public"]["Enums"]["catch_source"] | null
          species_english_name: string | null
          species_id: string | null
          species_local_name: string | null
          status: Database["public"]["Enums"]["catch_status"] | null
          weight_kg: number | null
          zone_id: string | null
          zone_name: string | null
          zone_status: Database["public"]["Enums"]["zone_status"] | null
          zone_type: Database["public"]["Enums"]["zone_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "catches_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_fisher_id_fkey"
            columns: ["fisher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_geojson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_municipality_fkey"
            columns: ["municipality"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["name"]
          },
        ]
      }
      gallery_details: {
        Row: {
          approved: boolean | null
          created_at: string | null
          id: string | null
          lat: number | null
          lng: number | null
          photo_url: string | null
          reef_condition: Database["public"]["Enums"]["reef_condition"] | null
          title: string | null
          uploader_municipality: string | null
          uploader_name: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_municipality_fkey"
            columns: ["uploader_municipality"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "spots_gallery_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_trace: {
        Row: {
          caught_on: string | null
          fisher_first_name: string | null
          municipality: string | null
          pollution_advisory: boolean | null
          qr_token: string | null
          source: Database["public"]["Enums"]["catch_source"] | null
          species_english_name: string | null
          species_local_name: string | null
          status: Database["public"]["Enums"]["catch_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_municipality_fkey"
            columns: ["municipality"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["name"]
          },
        ]
      }
      report_details: {
        Row: {
          admin_note: string | null
          created_at: string | null
          description: string | null
          id: string | null
          lat: number | null
          lng: number | null
          photo_url: string | null
          reporter_id: string | null
          reporter_municipality: string | null
          reporter_name: string | null
          status: Database["public"]["Enums"]["report_status"] | null
          type: Database["public"]["Enums"]["report_type"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_municipality_fkey"
            columns: ["reporter_municipality"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zones_geojson: {
        Row: {
          active: boolean | null
          area_ha: number | null
          created_at: string | null
          created_by: string | null
          geojson: Json | null
          id: string | null
          name: string | null
          reason: string | null
          type: Database["public"]["Enums"]["zone_type"] | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          area_ha?: never
          created_at?: string | null
          created_by?: string | null
          geojson?: never
          id?: string | null
          name?: string | null
          reason?: string | null
          type?: Database["public"]["Enums"]["zone_type"] | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          area_ha?: never
          created_at?: string | null
          created_by?: string | null
          geojson?: never
          id?: string | null
          name?: string | null
          reason?: string | null
          type?: Database["public"]["Enums"]["zone_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      anomaly_review: {
        Args: { p_from: string; p_to: string }
        Returns: {
          catch_id: string
          rule: string
          caught_at: string
          qr_token: string
          status: Database["public"]["Enums"]["catch_status"]
          species: string
          fisher_name: string
          municipality: string
          weight_kg: number
          gross_tons: number
          kg_per_ton: number
          zone_name: string
          distance_m: number
          prior_logs: number
          season_start: string
          season_end: string
          license_expiry: string
          days_expired: number
        }[]
      }
      effective_logged_at: {
        Args: { p_caught: string; p_recorded: string; p_logged: string }
        Returns: string
      }
      evaluate_catch: {
        Args: {
          p_id: string
          p_fisher_id: string
          p_boat_id: string
          p_species_id: string
          p_weight_kg: number
          p_size_cm: number
          p_geom: unknown
          p_caught_at: string
          p_logged_at: string
          p_late_entry_reason: string
        }
        Returns: Record<string, unknown>
      }
      get_trace: {
        Args: { p_token: string }
        Returns: {
          caught_on: string | null
          fisher_first_name: string | null
          municipality: string | null
          pollution_advisory: boolean | null
          qr_token: string | null
          source: Database["public"]["Enums"]["catch_source"] | null
          species_english_name: string | null
          species_local_name: string | null
          status: Database["public"]["Enums"]["catch_status"] | null
        }[]
      }
      in_closed_season: {
        Args: { p_start: string; p_end: string; p_day: string }
        Returns: boolean
      }
      ingest_sms_catch: {
        Args: {
          p_secret: string
          p_phone: string
          p_species: string
          p_weight_kg: number
          p_size_cm?: number
        }
        Returns: {
          result: string
          fisher_first_name: string
          species_local_name: string
          weight_kg: number
          size_cm: number
          status: Database["public"]["Enums"]["catch_status"]
          flag_reasons: string[]
          qr_token: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      my_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      new_qr_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      normalize_ph_phone: {
        Args: { p_phone: string }
        Returns: string
      }
      overview_stats: {
        Args: { p_from: string; p_to: string; p_municipality?: string }
        Returns: Json
      }
      upsert_zone: {
        Args: {
          p_id: string
          p_name: string
          p_type: Database["public"]["Enums"]["zone_type"]
          p_reason: string
          p_active: boolean
          p_geojson: Json
        }
        Returns: string
      }
    }
    Enums: {
      catch_source: "app" | "sms" | "pic"
      catch_status: "verified" | "flagged" | "pending" | "reviewed"
      reef_condition: "good" | "fair" | "poor"
      report_status: "received" | "investigating" | "resolved"
      report_type:
        | "illegal_fishing"
        | "destructive_fishing"
        | "commercial_intrusion"
        | "pollution"
        | "habitat_damage"
        | "other"
      user_role: "fisher" | "pic" | "admin"
      zone_status: "ok" | "restricted" | "pollution"
      zone_type: "restricted" | "safe" | "sanctuary" | "pollution"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      catch_source: ["app", "sms", "pic"],
      catch_status: ["verified", "flagged", "pending", "reviewed"],
      reef_condition: ["good", "fair", "poor"],
      report_status: ["received", "investigating", "resolved"],
      report_type: [
        "illegal_fishing",
        "destructive_fishing",
        "commercial_intrusion",
        "pollution",
        "habitat_damage",
        "other",
      ],
      user_role: ["fisher", "pic", "admin"],
      zone_status: ["ok", "restricted", "pollution"],
      zone_type: ["restricted", "safe", "sanctuary", "pollution"],
    },
  },
} as const

