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
      areas: {
        Row: {
          created_at: string
          label: string
          parent_slug: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          label: string
          parent_slug?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          label?: string
          parent_slug?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_parent_slug_fkey"
            columns: ["parent_slug"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["slug"]
          },
        ]
      }
      case_images: {
        Row: {
          alt_ko: string | null
          case_id: string
          created_at: string
          id: string
          is_private: boolean
          must_use: boolean
          phash: string | null
          quality_score: number | null
          role: Database["public"]["Enums"]["image_role_t"]
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_ko?: string | null
          case_id: string
          created_at?: string
          id?: string
          is_private?: boolean
          must_use?: boolean
          phash?: string | null
          quality_score?: number | null
          role?: Database["public"]["Enums"]["image_role_t"]
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_ko?: string | null
          case_id?: string
          created_at?: string
          id?: string
          is_private?: boolean
          must_use?: boolean
          phash?: string | null
          quality_score?: number | null
          role?: Database["public"]["Enums"]["image_role_t"]
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_images_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          area_slug: string | null
          building_type: string | null
          cause: string | null
          cause_observed: boolean
          created_at: string
          duration_note: string | null
          id: string
          judgement: string
          limit_note: string | null
          maintenance: string | null
          materials: string[]
          problem: string
          problem_id: string | null
          result: string
          safety_flags: string[]
          slug: string
          space: string
          status: Database["public"]["Enums"]["case_status_t"]
          target: string
          tools: string[]
          updated_at: string
          work_steps: Json
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          area_slug?: string | null
          building_type?: string | null
          cause?: string | null
          cause_observed?: boolean
          created_at?: string
          duration_note?: string | null
          id?: string
          judgement: string
          limit_note?: string | null
          maintenance?: string | null
          materials?: string[]
          problem: string
          problem_id?: string | null
          result: string
          safety_flags?: string[]
          slug: string
          space: string
          status?: Database["public"]["Enums"]["case_status_t"]
          target: string
          tools?: string[]
          updated_at?: string
          work_steps?: Json
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          area_slug?: string | null
          building_type?: string | null
          cause?: string | null
          cause_observed?: boolean
          created_at?: string
          duration_note?: string | null
          id?: string
          judgement?: string
          limit_note?: string | null
          maintenance?: string | null
          materials?: string[]
          problem?: string
          problem_id?: string | null
          result?: string
          safety_flags?: string[]
          slug?: string
          space?: string
          status?: Database["public"]["Enums"]["case_status_t"]
          target?: string
          tools?: string[]
          updated_at?: string
          work_steps?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cases_area_slug_fkey"
            columns: ["area_slug"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["slug"]
          },
        ]
      }
      company_profiles: {
        Row: {
          business_registration_no: string | null
          company_name: string
          created_at: string | null
          id: string
          operating_hours: string | null
          phone_number: string
          prep_instructions: string | null
          representative_name: string | null
          service_regions: string[] | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          business_registration_no?: string | null
          company_name: string
          created_at?: string | null
          id: string
          operating_hours?: string | null
          phone_number: string
          prep_instructions?: string | null
          representative_name?: string | null
          service_regions?: string[] | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          business_registration_no?: string | null
          company_name?: string
          created_at?: string | null
          id?: string
          operating_hours?: string | null
          phone_number?: string
          prep_instructions?: string | null
          representative_name?: string | null
          service_regions?: string[] | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      consultation_leads: {
        Row: {
          category_slug: string
          content: string
          customer_name: string
          customer_phone: string
          id: string
          image_url: string | null
          region_slug: string
          status: string
          submitted_at: string | null
          utm_source: string | null
        }
        Insert: {
          category_slug: string
          content: string
          customer_name: string
          customer_phone: string
          id: string
          image_url?: string | null
          region_slug: string
          status?: string
          submitted_at?: string | null
          utm_source?: string | null
        }
        Update: {
          category_slug?: string
          content?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          image_url?: string | null
          region_slug?: string
          status?: string
          submitted_at?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      contact_distributions: {
        Row: {
          company_profile_id: string
          created_at: string | null
          id: string
          scope: string
          target_page_id: string | null
          target_site_id: string | null
        }
        Insert: {
          company_profile_id: string
          created_at?: string | null
          id: string
          scope: string
          target_page_id?: string | null
          target_site_id?: string | null
        }
        Update: {
          company_profile_id?: string
          created_at?: string | null
          id?: string
          scope?: string
          target_page_id?: string | null
          target_site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_distributions_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      image_variants: {
        Row: {
          caption_ko: string | null
          created_at: string
          crop: Json | null
          id: string
          image_id: string
          output_path: string | null
          overlays: Json
          page_id: string | null
        }
        Insert: {
          caption_ko?: string | null
          created_at?: string
          crop?: Json | null
          id?: string
          image_id: string
          output_path?: string | null
          overlays?: Json
          page_id?: string | null
        }
        Update: {
          caption_ko?: string | null
          created_at?: string
          crop?: Json | null
          id?: string
          image_id?: string
          output_path?: string | null
          overlays?: Json
          page_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_variants_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "case_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_variants_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_nodes: {
        Row: {
          aliases: string[]
          area_expandable: boolean
          competition_hint: string | null
          dedupe_key: string | null
          evidence_case_ids: string[]
          hold_reason: string | null
          id: string
          intent: string[]
          label: string
          level: number
          merged_into: string | null
          notes: string
          parent_id: string | null
          priority_score: number
          query_ko: string | null
          status: Database["public"]["Enums"]["kw_status_t"]
          suggested_ct: Database["public"]["Enums"]["content_type_t"] | null
          suggested_page_type: Database["public"]["Enums"]["page_type_t"] | null
          target_page_id: string | null
          target_url: string | null
          updated_at: string
          volume_hint: string | null
        }
        Insert: {
          aliases?: string[]
          area_expandable?: boolean
          competition_hint?: string | null
          dedupe_key?: string | null
          evidence_case_ids?: string[]
          hold_reason?: string | null
          id: string
          intent?: string[]
          label: string
          level: number
          merged_into?: string | null
          notes?: string
          parent_id?: string | null
          priority_score?: number
          query_ko?: string | null
          status?: Database["public"]["Enums"]["kw_status_t"]
          suggested_ct?: Database["public"]["Enums"]["content_type_t"] | null
          suggested_page_type?:
            | Database["public"]["Enums"]["page_type_t"]
            | null
          target_page_id?: string | null
          target_url?: string | null
          updated_at?: string
          volume_hint?: string | null
        }
        Update: {
          aliases?: string[]
          area_expandable?: boolean
          competition_hint?: string | null
          dedupe_key?: string | null
          evidence_case_ids?: string[]
          hold_reason?: string | null
          id?: string
          intent?: string[]
          label?: string
          level?: number
          merged_into?: string | null
          notes?: string
          parent_id?: string | null
          priority_score?: number
          query_ko?: string | null
          status?: Database["public"]["Enums"]["kw_status_t"]
          suggested_ct?: Database["public"]["Enums"]["content_type_t"] | null
          suggested_page_type?:
            | Database["public"]["Enums"]["page_type_t"]
            | null
          target_page_id?: string | null
          target_url?: string | null
          updated_at?: string
          volume_hint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_nodes_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "keyword_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keyword_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "keyword_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keyword_nodes_target_page_fk"
            columns: ["target_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_pages: {
        Row: {
          category_slug: string
          consult_page_id: string | null
          id: string
          last_modified: string | null
          region_slug: string
          site_id: string
          status: string
          title: string
        }
        Insert: {
          category_slug: string
          consult_page_id?: string | null
          id: string
          last_modified?: string | null
          region_slug: string
          site_id: string
          status?: string
          title: string
        }
        Update: {
          category_slug?: string
          consult_page_id?: string | null
          id?: string
          last_modified?: string | null
          region_slug?: string
          site_id?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      page_links: {
        Row: {
          anchor_text: string
          from_page_id: string
          relation: string
          to_page_id: string
        }
        Insert: {
          anchor_text: string
          from_page_id: string
          relation?: string
          to_page_id: string
        }
        Update: {
          anchor_text?: string
          from_page_id?: string
          relation?: string
          to_page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_links_from_page_id_fkey"
            columns: ["from_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_links_to_page_id_fkey"
            columns: ["to_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_modules: {
        Row: {
          body: Json
          evidence: Json
          module_code: string
          page_id: string
          position: number
        }
        Insert: {
          body?: Json
          evidence?: Json
          module_code: string
          page_id: string
          position: number
        }
        Update: {
          body?: Json
          evidence?: Json
          module_code?: string
          page_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_modules_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          canonical_page_id: string | null
          content_type: Database["public"]["Enums"]["content_type_t"]
          created_at: string
          decision: Database["public"]["Enums"]["decision_t"]
          decision_reason: string | null
          evidence_ids: Json
          id: string
          image_set: string[]
          keyword_node_id: string | null
          meta_description: string | null
          module_order: string[]
          page_type: Database["public"]["Enums"]["page_type_t"]
          published_at: string | null
          required_modules: string[]
          search_intent: string
          selected_modules: string[]
          slug: string
          source_case_id: string | null
          status: Database["public"]["Enums"]["page_status_t"]
          title: string
          updated_at: string
        }
        Insert: {
          canonical_page_id?: string | null
          content_type: Database["public"]["Enums"]["content_type_t"]
          created_at?: string
          decision?: Database["public"]["Enums"]["decision_t"]
          decision_reason?: string | null
          evidence_ids?: Json
          id?: string
          image_set?: string[]
          keyword_node_id?: string | null
          meta_description?: string | null
          module_order?: string[]
          page_type: Database["public"]["Enums"]["page_type_t"]
          published_at?: string | null
          required_modules?: string[]
          search_intent: string
          selected_modules?: string[]
          slug: string
          source_case_id?: string | null
          status?: Database["public"]["Enums"]["page_status_t"]
          title: string
          updated_at?: string
        }
        Update: {
          canonical_page_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type_t"]
          created_at?: string
          decision?: Database["public"]["Enums"]["decision_t"]
          decision_reason?: string | null
          evidence_ids?: Json
          id?: string
          image_set?: string[]
          keyword_node_id?: string | null
          meta_description?: string | null
          module_order?: string[]
          page_type?: Database["public"]["Enums"]["page_type_t"]
          published_at?: string | null
          required_modules?: string[]
          search_intent?: string
          selected_modules?: string[]
          slug?: string
          source_case_id?: string | null
          status?: Database["public"]["Enums"]["page_status_t"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_canonical_page_id_fkey"
            columns: ["canonical_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_keyword_node_id_fkey"
            columns: ["keyword_node_id"]
            isOneToOne: false
            referencedRelation: "keyword_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_source_case_id_fkey"
            columns: ["source_case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      pseo_content_sections: {
        Row: {
          body_template: string
          created_at: string
          heading_level: string | null
          heading_template: string | null
          id: string
          keyword_id: string | null
          section_type: Database["public"]["Enums"]["pseo_section_type"]
          sort_order: number
          variant_id: string | null
        }
        Insert: {
          body_template: string
          created_at?: string
          heading_level?: string | null
          heading_template?: string | null
          id?: string
          keyword_id?: string | null
          section_type: Database["public"]["Enums"]["pseo_section_type"]
          sort_order?: number
          variant_id?: string | null
        }
        Update: {
          body_template?: string
          created_at?: string
          heading_level?: string | null
          heading_template?: string | null
          id?: string
          keyword_id?: string | null
          section_type?: Database["public"]["Enums"]["pseo_section_type"]
          sort_order?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pseo_content_sections_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "pseo_keywords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pseo_content_sections_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "pseo_keyword_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      pseo_keyword_variants: {
        Row: {
          created_at: string
          h1_template: string
          id: string
          keyword_id: string
          meta_description_template: string
          sort_order: number
          title_template: string
          variant_key: string
        }
        Insert: {
          created_at?: string
          h1_template: string
          id?: string
          keyword_id: string
          meta_description_template: string
          sort_order?: number
          title_template: string
          variant_key: string
        }
        Update: {
          created_at?: string
          h1_template?: string
          id?: string
          keyword_id?: string
          meta_description_template?: string
          sort_order?: number
          title_template?: string
          variant_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "pseo_keyword_variants_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "pseo_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      pseo_keywords: {
        Row: {
          created_at: string
          display_name: string
          h1_template: string
          id: string
          is_active: boolean
          menu_group: string | null
          menu_order: number
          meta_description_template: string
          phone: string
          slug: string
          title_template: string
        }
        Insert: {
          created_at?: string
          display_name: string
          h1_template?: string
          id?: string
          is_active?: boolean
          menu_group?: string | null
          menu_order?: number
          meta_description_template?: string
          phone?: string
          slug: string
          title_template?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          h1_template?: string
          id?: string
          is_active?: boolean
          menu_group?: string | null
          menu_order?: number
          meta_description_template?: string
          phone?: string
          slug?: string
          title_template?: string
        }
        Relationships: []
      }
      pseo_page_listings: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          keyword_id: string
          phone_override: string | null
          region_id: string
          thumbnail_phone: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          keyword_id: string
          phone_override?: string | null
          region_id: string
          thumbnail_phone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          keyword_id?: string
          phone_override?: string | null
          region_id?: string
          thumbnail_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pseo_page_listings_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "pseo_keywords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pseo_page_listings_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "pseo_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      pseo_regions: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          parent_id: string | null
          slug: string
          type: Database["public"]["Enums"]["pseo_region_type"]
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          type: Database["public"]["Enums"]["pseo_region_type"]
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          type?: Database["public"]["Enums"]["pseo_region_type"]
        }
        Relationships: [
          {
            foreignKeyName: "pseo_regions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "pseo_regions"
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
      case_status_t: "draft" | "review" | "approved"
      content_type_t: "CT1" | "CT2" | "CT3" | "CT4" | "CT5" | "CT6"
      decision_t: "CREATE" | "UPDATE" | "MERGE" | "HOLD"
      image_role_t:
        | "BEFORE"
        | "PROCESS"
        | "AFTER"
        | "MATERIAL"
        | "TOOL"
        | "DETAIL"
        | "EXCLUDE"
      kw_status_t: "OPEN" | "CLAIMED" | "PUBLISHED" | "HOLD" | "MERGED"
      page_status_t: "draft" | "review" | "published" | "hold"
      page_type_t: "CATEGORY" | "TOPIC" | "CASE" | "WIKI" | "AREA" | "LANDING"
      pseo_region_type: "SIDO" | "SIGUNGU" | "DONG" | "APT"
      pseo_section_type: "INTRO" | "BODY" | "CONCLUSION"
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
      case_status_t: ["draft", "review", "approved"],
      content_type_t: ["CT1", "CT2", "CT3", "CT4", "CT5", "CT6"],
      decision_t: ["CREATE", "UPDATE", "MERGE", "HOLD"],
      image_role_t: [
        "BEFORE",
        "PROCESS",
        "AFTER",
        "MATERIAL",
        "TOOL",
        "DETAIL",
        "EXCLUDE",
      ],
      kw_status_t: ["OPEN", "CLAIMED", "PUBLISHED", "HOLD", "MERGED"],
      page_status_t: ["draft", "review", "published", "hold"],
      page_type_t: ["CATEGORY", "TOPIC", "CASE", "WIKI", "AREA", "LANDING"],
      pseo_region_type: ["SIDO", "SIGUNGU", "DONG", "APT"],
      pseo_section_type: ["INTRO", "BODY", "CONCLUSION"],
    },
  },
} as const

// ---------------------------------------------------------------------------
// 프로젝트 편의 별칭 (기존 코드가 import 하던 이름 유지)
// ---------------------------------------------------------------------------
export type PageRecord = Database["public"]["Tables"]["pages"]["Row"]
export type CaseRecord = Database["public"]["Tables"]["cases"]["Row"]
export type CaseImageRecord = Database["public"]["Tables"]["case_images"]["Row"]
export type KeywordNodeRecord =
  Database["public"]["Tables"]["keyword_nodes"]["Row"]
export type PageModuleRecord =
  Database["public"]["Tables"]["page_modules"]["Row"]
export type ImageVariantRecord =
  Database["public"]["Tables"]["image_variants"]["Row"]
export type PageLinkRecord = Database["public"]["Tables"]["page_links"]["Row"]
export type AreaRecord = Database["public"]["Tables"]["areas"]["Row"]
