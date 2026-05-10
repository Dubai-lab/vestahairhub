export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:            string
          full_name:     string | null
          avatar_url:    string | null
          role:          string
          phone:         string | null
          country:       string | null
          is_banned:     boolean
          banned_reason: string | null
          banned_at:     string | null
          created_at:    string
          updated_at:    string
        }
        Insert: {
          id:             string
          full_name?:     string | null
          avatar_url?:    string | null
          role?:          string
          phone?:         string | null
          country?:       string | null
          is_banned?:     boolean
          banned_reason?: string | null
          banned_at?:     string | null
          created_at?:    string
          updated_at?:    string
        }
        Update: {
          full_name?:     string | null
          avatar_url?:    string | null
          role?:          string
          phone?:         string | null
          country?:       string | null
          is_banned?:     boolean
          banned_reason?: string | null
          banned_at?:     string | null
          updated_at?:    string
        }
        Relationships: []
      }
      reports: {
        Row: {
          id:                string
          reporter_id:       string | null
          reported_user_id:  string | null
          reported_shop_id:  string | null
          reported_order_id: string | null
          reason:            string
          details:           string | null
          evidence_url:      string | null
          status:            string
          admin_notes:       string | null
          created_at:        string
          resolved_at:       string | null
          resolved_by:       string | null
        }
        Insert: {
          id?:                string
          reporter_id?:       string | null
          reported_user_id?:  string | null
          reported_shop_id?:  string | null
          reported_order_id?: string | null
          reason:             string
          details?:           string | null
          evidence_url?:      string | null
          status?:            string
          admin_notes?:       string | null
          created_at?:        string
          resolved_at?:       string | null
          resolved_by?:       string | null
        }
        Update: {
          status?:       string
          admin_notes?:  string | null
          resolved_at?:  string | null
          resolved_by?:  string | null
        }
        Relationships: []
      }
      shops: {
        Row: {
          id:          string
          seller_id:   string
          name:        string
          slug:        string
          description: string | null
          logo_url:    string | null
          banner_url:  string | null
          theme_color: string
          country:     string | null
          city:             string | null
          whatsapp_number:  string | null
          status:           string
          created_at:       string
          updated_at:       string
        }
        Insert: {
          id?:              string
          seller_id:        string
          name:             string
          slug:             string
          description?:     string | null
          logo_url?:        string | null
          banner_url?:      string | null
          theme_color?:     string
          country?:         string | null
          city?:            string | null
          whatsapp_number?: string | null
          status?:          string
          created_at?:      string
          updated_at?:      string
        }
        Update: {
          name?:            string
          slug?:            string
          description?:     string | null
          logo_url?:        string | null
          banner_url?:      string | null
          theme_color?:     string
          country?:         string | null
          city?:            string | null
          whatsapp_number?: string | null
          status?:          string
          updated_at?:      string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id:          string
          name:        string
          slug:        string
          description: string | null
          icon:        string | null
          created_at:  string
        }
        Insert: {
          id?:          string
          name:         string
          slug:         string
          description?: string | null
          icon?:        string | null
          created_at?:  string
        }
        Update: {
          name?:        string
          slug?:        string
          description?: string | null
          icon?:        string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id:            string
          shop_id:       string
          category_id:   string
          name:          string
          slug:          string
          description:   string | null
          price:         number
          compare_price: number | null
          stock:         number
          images:        string[]
          video_url:     string | null
          tags:          string[]
          status:        string
          created_at:    string
          updated_at:    string
        }
        Insert: {
          id?:            string
          shop_id:        string
          category_id:    string
          name:           string
          slug:           string
          description?:   string | null
          price:          number
          compare_price?: number | null
          stock?:         number
          images?:        string[]
          video_url?:     string | null
          tags?:          string[]
          status?:        string
          created_at?:    string
          updated_at?:    string
        }
        Update: {
          category_id?:   string
          name?:          string
          slug?:          string
          description?:   string | null
          price?:         number
          compare_price?: number | null
          stock?:         number
          images?:        string[]
          video_url?:     string | null
          tags?:          string[]
          status?:        string
          updated_at?:    string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id:                string
          buyer_id:          string | null
          shop_id:           string
          status:            string
          total_amount:      number
          payment_method:    string | null
          payment_reference: string | null
          payment_proof_url: string | null
          shipping_name:     string | null
          shipping_phone:    string | null
          shipping_address:  string | null
          shipping_city:     string | null
          shipping_country:  string | null
          notes:             string | null
          created_at:        string
          updated_at:        string
        }
        Insert: {
          id?:                string
          buyer_id?:          string | null
          shop_id:            string
          status?:            string
          total_amount:       number
          payment_method?:    string | null
          payment_reference?: string | null
          payment_proof_url?: string | null
          shipping_name?:     string | null
          shipping_phone?:    string | null
          shipping_address?:  string | null
          shipping_city?:     string | null
          shipping_country?:  string | null
          notes?:             string | null
          created_at?:        string
          updated_at?:        string
        }
        Update: {
          status?:            string
          payment_method?:    string | null
          payment_reference?: string | null
          payment_proof_url?: string | null
          shipping_name?:     string | null
          shipping_phone?:    string | null
          shipping_address?:  string | null
          shipping_city?:     string | null
          shipping_country?:  string | null
          notes?:             string | null
          updated_at?:        string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id:            string
          order_id:      string
          product_id:    string
          product_name:  string
          product_image: string | null
          quantity:      number
          unit_price:    number
          created_at:    string
        }
        Insert: {
          id?:            string
          order_id:       string
          product_id:     string
          product_name:   string
          product_image?: string | null
          quantity:       number
          unit_price:     number
          created_at?:    string
        }
        Update: {
          [_ in never]: never
        }
        Relationships: []
      }
      shop_payment_methods: {
        Row: {
          id:             string
          shop_id:        string
          method_type:    string
          account_name:   string
          account_number: string
          bank_name:      string | null
          is_active:      boolean
          created_at:     string
        }
        Insert: {
          id?:             string
          shop_id:         string
          method_type:     string
          account_name:    string
          account_number:  string
          bank_name?:      string | null
          is_active?:      boolean
          created_at?:     string
        }
        Update: {
          method_type?:    string
          account_name?:   string
          account_number?: string
          bank_name?:      string | null
          is_active?:      boolean
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id:         string
          buyer_id:   string
          product_id: string
          rating:     number
          comment:    string | null
          created_at: string
        }
        Insert: {
          id?:         string
          buyer_id:    string
          product_id:  string
          rating:      number
          comment?:    string | null
          created_at?: string
        }
        Update: {
          rating?:  number
          comment?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id:                   string
          buyer_id:             string
          seller_id:            string
          shop_id:              string
          product_id:           string | null
          buyer_name:           string | null
          seller_name:          string | null
          last_message_preview: string | null
          last_message_at:      string
          unread_seller:        number
          unread_buyer:         number
          created_at:           string
          updated_at:           string
        }
        Insert: {
          id?:                   string
          buyer_id:              string
          seller_id:             string
          shop_id:               string
          product_id?:           string | null
          buyer_name?:           string | null
          seller_name?:          string | null
          last_message_preview?: string | null
          last_message_at?:      string
          unread_seller?:        number
          unread_buyer?:         number
          created_at?:           string
          updated_at?:           string
        }
        Update: {
          last_message_preview?: string | null
          last_message_at?:      string
          unread_seller?:        number
          unread_buyer?:         number
          updated_at?:           string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id:              string
          conversation_id: string
          sender_id:       string
          content:         string
          message_type:    string
          attachment_url:  string | null
          attachment_meta: Record<string, unknown> | null
          is_read:         boolean
          created_at:      string
        }
        Insert: {
          id?:              string
          conversation_id:  string
          sender_id:        string
          content:          string
          message_type?:    string
          attachment_url?:  string | null
          attachment_meta?: Record<string, unknown> | null
          is_read?:         boolean
          created_at?:      string
        }
        Update: {
          is_read?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience row types
export type ProfileRow       = Database['public']['Tables']['profiles']['Row']
export type ShopRow          = Database['public']['Tables']['shops']['Row']
export type CategoryRow      = Database['public']['Tables']['categories']['Row']
export type ProductRow       = Database['public']['Tables']['products']['Row']
export type OrderRow         = Database['public']['Tables']['orders']['Row']
export type OrderItemRow     = Database['public']['Tables']['order_items']['Row']
export type ShopPaymentRow   = Database['public']['Tables']['shop_payment_methods']['Row']
export type ReviewRow        = Database['public']['Tables']['reviews']['Row']
export type ConversationRow  = Database['public']['Tables']['conversations']['Row']
export type MessageRow       = Database['public']['Tables']['messages']['Row']
export type ReportRow        = Database['public']['Tables']['reports']['Row']
