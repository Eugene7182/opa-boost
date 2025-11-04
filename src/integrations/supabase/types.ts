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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bonus_schemes: {
        Row: {
          active: boolean
          bonus_percent: number
          created_at: string
          end_date: string | null
          id: string
          min_quantity: number
          name: string
          product_id: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          bonus_percent: number
          created_at?: string
          end_date?: string | null
          id?: string
          min_quantity?: number
          name: string
          product_id?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          bonus_percent?: number
          created_at?: string
          end_date?: string | null
          id?: string
          min_quantity?: number
          name?: string
          product_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_schemes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_bonus_rules: {
        Row: {
          campaign_id: string
          created_at: string
          extra_per_sale: number
          id: string
          product_variant_id: string
          threshold_qty: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          extra_per_sale: number
          id?: string
          product_variant_id: string
          threshold_qty: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          extra_per_sale?: number
          id?: string
          product_variant_id?: string
          threshold_qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_bonus_rules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_bonus_rules_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          end_at: string
          id: string
          name: string
          network_id: string
          start_at: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          end_at: string
          id?: string
          name: string
          network_id: string
          start_at: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          end_at?: string
          id?: string
          name?: string
          network_id?: string
          start_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          audience: Json | null
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          message_type: string
          pinned: boolean
          sender_id: string
          updated_at: string
        }
        Insert: {
          audience?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          message_type?: string
          pinned?: boolean
          sender_id: string
          updated_at?: string
        }
        Update: {
          audience?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          message_type?: string
          pinned?: boolean
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_products: {
        Row: {
          active: boolean
          category: string | null
          competitor_id: string
          created_at: string
          estimated_price: number | null
          id: string
          product_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          competitor_id: string
          created_at?: string
          estimated_price?: number | null
          id?: string
          product_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          competitor_id?: string
          created_at?: string
          estimated_price?: number | null
          id?: string
          product_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_products_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_tracking: {
        Row: {
          competitor_id: string
          created_at: string
          id: string
          last_seen: string | null
          notes: string | null
          presence_type: string
          promoter_count: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          competitor_id: string
          created_at?: string
          id?: string
          last_seen?: string | null
          notes?: string | null
          presence_type: string
          promoter_count?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          competitor_id?: string
          created_at?: string
          id?: string
          last_seen?: string | null
          notes?: string | null
          presence_type?: string
          promoter_count?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_tracking_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_tracking_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          active: boolean
          brand: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          enabled: boolean
          flag_name: string
          id: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          flag_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          flag_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      focus_campaigns: {
        Row: {
          created_at: string
          created_by: string
          end_date: string
          goal_amount: number | null
          goal_qty: number | null
          id: string
          product_id: string
          start_date: string
          title: string
          updated_at: string
          variant_required: boolean
        }
        Insert: {
          created_at?: string
          created_by: string
          end_date: string
          goal_amount?: number | null
          goal_qty?: number | null
          id?: string
          product_id: string
          start_date: string
          title: string
          updated_at?: string
          variant_required?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string
          end_date?: string
          goal_amount?: number | null
          goal_qty?: number | null
          id?: string
          product_id?: string
          start_date?: string
          title?: string
          updated_at?: string
          variant_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "focus_campaigns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventories: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          product_id: string
          product_variant_id: string | null
          quantity: number
          status: string
          store_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          product_id: string
          product_variant_id?: string | null
          quantity?: number
          status?: string
          store_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          product_id?: string
          product_variant_id?: string | null
          quantity?: number
          status?: string
          store_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventories_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      kef_endings: {
        Row: {
          created_at: string
          end_date: string
          ended_by: string | null
          id: string
          kef_scheme_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          end_date: string
          ended_by?: string | null
          id?: string
          kef_scheme_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          ended_by?: string | null
          id?: string
          kef_scheme_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kef_endings_kef_scheme_id_fkey"
            columns: ["kef_scheme_id"]
            isOneToOne: false
            referencedRelation: "kef_schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      kef_schemes: {
        Row: {
          active: boolean
          coefficient: number
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          product_id: string | null
          region_id: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          coefficient: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          product_id?: string | null
          region_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          coefficient?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          product_id?: string | null
          region_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kef_schemes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kef_schemes_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      market_shares: {
        Row: {
          competitor_sales: number
          created_at: string
          id: string
          market_share_percent: number | null
          our_sales: number
          period_end: string
          period_start: string
          product_id: string
          region_id: string | null
          store_id: string | null
          updated_at: string
        }
        Insert: {
          competitor_sales?: number
          created_at?: string
          id?: string
          market_share_percent?: number | null
          our_sales?: number
          period_end: string
          period_start: string
          product_id: string
          region_id?: string | null
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          competitor_sales?: number
          created_at?: string
          id?: string
          market_share_percent?: number | null
          our_sales?: number
          period_end?: string
          period_start?: string
          product_id?: string
          region_id?: string | null
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_shares_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_shares_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_shares_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          attendance_status: string
          id: string
          meeting_id: string
          user_id: string
        }
        Insert: {
          attendance_status?: string
          id?: string
          meeting_id: string
          user_id: string
        }
        Update: {
          attendance_status?: string
          id?: string
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          location: string | null
          meeting_type: string
          online_link: string | null
          organizer_id: string
          region_id: string | null
          scheduled_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          location?: string | null
          meeting_type: string
          online_link?: string | null
          organizer_id: string
          region_id?: string | null
          scheduled_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          location?: string | null
          meeting_type?: string
          online_link?: string | null
          organizer_id?: string
          region_id?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      message_receipts: {
        Row: {
          created_at: string
          delivered_at: string | null
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      motivation_rules: {
        Row: {
          bonus: number
          created_at: string
          id: string
          min_qty: number
          motivation_id: string
        }
        Insert: {
          bonus: number
          created_at?: string
          id?: string
          min_qty: number
          motivation_id: string
        }
        Update: {
          bonus?: number
          created_at?: string
          id?: string
          min_qty?: number
          motivation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "motivation_rules_motivation_id_fkey"
            columns: ["motivation_id"]
            isOneToOne: false
            referencedRelation: "motivations"
            referencedColumns: ["id"]
          },
        ]
      }
      motivations: {
        Row: {
          active: boolean
          bonus_extra: number
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          start_date: string
          target_sales_amount: number | null
          target_sales_count: number | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          bonus_extra: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date: string
          target_sales_amount?: number | null
          target_sales_count?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          bonus_extra?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string
          target_sales_amount?: number | null
          target_sales_count?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      network_product_bonuses: {
        Row: {
          active: boolean
          base_bonus: number
          created_at: string
          id: string
          network_id: string
          product_variant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_bonus: number
          created_at?: string
          id?: string
          network_id: string
          product_variant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_bonus?: number
          created_at?: string
          id?: string
          network_id?: string
          product_variant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_product_bonuses_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_product_bonuses_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      networks: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      offices: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          region_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          region_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          region_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offices_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_bonus_tiers: {
        Row: {
          bonus_amount: number
          created_at: string
          id: string
          max_percent: number | null
          min_percent: number
          network_id: string
        }
        Insert: {
          bonus_amount: number
          created_at?: string
          id?: string
          max_percent?: number | null
          min_percent: number
          network_id: string
        }
        Update: {
          bonus_amount?: number
          created_at?: string
          id?: string
          max_percent?: number | null
          min_percent?: number
          network_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_bonus_tiers_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          active: boolean
          created_at: string
          id: string
          memory_gb: number
          product_id: string
          sku: string | null
          storage_gb: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          memory_gb?: number
          product_id: string
          sku?: string | null
          storage_gb?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          memory_gb?: number
          product_id?: string
          sku?: string | null
          storage_gb?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          name: string
          price: number
          storage_capacity: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          id?: string
          name: string
          price: number
          storage_capacity?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          name?: string
          price?: number
          storage_capacity?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          full_name: string
          id: string
          patronymic: string | null
          phone: string | null
          region_id: string | null
          store_id: string | null
          suggestions_enabled: boolean
          trainer_region_ids: string[] | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          full_name: string
          id: string
          patronymic?: string | null
          phone?: string | null
          region_id?: string | null
          store_id?: string | null
          suggestions_enabled?: boolean
          trainer_region_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          full_name?: string
          id?: string
          patronymic?: string | null
          phone?: string | null
          region_id?: string | null
          store_id?: string | null
          suggestions_enabled?: boolean
          trainer_region_ids?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_plans: {
        Row: {
          created_at: string
          id: string
          month_start: string
          network_id: string
          promoter_id: string
          store_id: string | null
          target_qty: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_start: string
          network_id: string
          promoter_id: string
          store_id?: string | null
          target_qty: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          month_start?: string
          network_id?: string
          promoter_id?: string
          store_id?: string | null
          target_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoter_plans_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_plans_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_plans_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          network_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          network_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          network_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
        ]
      }
      retail_prices: {
        Row: {
          active: boolean
          created_at: string
          end_date: string | null
          id: string
          price: number
          product_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          price: number
          product_id: string
          start_date?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          price?: number
          product_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retail_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          bonus_amount: number
          bonus_extra: number
          created_at: string
          id: string
          product_id: string
          product_variant_id: string | null
          promoter_id: string
          quantity: number
          store_id: string | null
          synced: boolean
          total_amount: number
          updated_at: string
          uuid_client: string | null
        }
        Insert: {
          bonus_amount?: number
          bonus_extra?: number
          created_at?: string
          id?: string
          product_id: string
          product_variant_id?: string | null
          promoter_id: string
          quantity: number
          store_id?: string | null
          synced?: boolean
          total_amount: number
          updated_at?: string
          uuid_client?: string | null
        }
        Update: {
          bonus_amount?: number
          bonus_extra?: number
          created_at?: string
          id?: string
          product_id?: string
          product_variant_id?: string | null
          promoter_id?: string
          quantity?: number
          store_id?: string | null
          synced?: boolean
          total_amount?: number
          updated_at?: string
          uuid_client?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_plans: {
        Row: {
          created_at: string
          created_by: string
          id: string
          period_end: string
          period_start: string
          promoter_id: string
          region_id: string | null
          target_amount: number
          target_qty: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          period_end: string
          period_start: string
          promoter_id: string
          region_id?: string | null
          target_amount?: number
          target_qty?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          period_end?: string
          period_start?: string
          promoter_id?: string
          region_id?: string | null
          target_amount?: number
          target_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_plans_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reminders: {
        Row: {
          created_at: string
          due_at: string
          id: string
          status: string
          store_id: string
        }
        Insert: {
          created_at?: string
          due_at: string
          id?: string
          status?: string
          store_id: string
        }
        Update: {
          created_at?: string
          due_at?: string
          id?: string
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_reminders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          active: boolean
          address: string | null
          city: string
          code: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          office_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          city: string
          code: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          office_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string
          code?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          office_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          region_id: string | null
          status: string
          store_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          region_id?: string | null
          status?: string
          store_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          region_id?: string | null
          status?: string
          store_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      test_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          id: string
          score: number | null
          status: string
          test_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          id?: string
          score?: number | null
          status?: string
          test_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          id?: string
          score?: number | null
          status?: string
          test_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_assignments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          answer: string
          body: string
          created_at: string
          id: string
          options: Json
          test_id: string
        }
        Insert: {
          answer: string
          body: string
          created_at?: string
          id?: string
          options: Json
          test_id: string
        }
        Update: {
          answer?: string
          body?: string
          created_at?: string
          id?: string
          options?: Json
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          answers: Json
          created_at: string
          id: string
          passed: boolean
          score: number
          test_id: string
          user_id: string
        }
        Insert: {
          answers: Json
          created_at?: string
          id?: string
          passed: boolean
          score: number
          test_id: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          passed?: boolean
          score?: number
          test_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          region_ids: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          region_ids?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          region_ids?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_materials: {
        Row: {
          active: boolean
          category: string | null
          content_type: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          file_url: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          content_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          file_url?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          file_url?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_materials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_materials_new: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          file_path: string | null
          id: string
          region_ids: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          region_ids?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          region_ids?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_participants: {
        Row: {
          attendance_status: string
          attended_at: string | null
          completed_at: string | null
          completion_percentage: number | null
          created_at: string
          feedback: string | null
          id: string
          quiz_score: number | null
          session_id: string
          user_id: string
        }
        Insert: {
          attendance_status?: string
          attended_at?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          feedback?: string | null
          id?: string
          quiz_score?: number | null
          session_id: string
          user_id: string
        }
        Update: {
          attendance_status?: string
          attended_at?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          feedback?: string | null
          id?: string
          quiz_score?: number | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          last_accessed_at: string | null
          material_id: string
          progress_percentage: number
          time_spent_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          material_id: string
          progress_percentage?: number
          time_spent_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          material_id?: string
          progress_percentage?: number
          time_spent_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_progress_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "training_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          location: string | null
          material_id: string | null
          max_participants: number | null
          online_link: string | null
          region_id: string | null
          scheduled_at: string
          status: string
          title: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          location?: string | null
          material_id?: string | null
          max_participants?: number | null
          online_link?: string | null
          region_id?: string | null
          scheduled_at: string
          status?: string
          title: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          location?: string | null
          material_id?: string | null
          max_participants?: number | null
          online_link?: string | null
          region_id?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "training_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invites: {
        Row: {
          accepted: boolean
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          phone: string | null
          region_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          store_id: string | null
          token: string
        }
        Insert: {
          accepted?: boolean
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          phone?: string | null
          region_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          token: string
        }
        Update: {
          accepted?: boolean
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          phone?: string | null
          region_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invites_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invites_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_region_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "office" | "supervisor" | "trainer" | "promoter"
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
      app_role: ["admin", "office", "supervisor", "trainer", "promoter"],
    },
  },
} as const
