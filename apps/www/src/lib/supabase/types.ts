export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          billing_email: string
          address: string | null
          logo: string | null
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id: string
          billing_email: string
          address?: string | null
          logo?: string | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string
          billing_email?: string
          address?: string | null
          logo?: string | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          slug: string
          organization_id: string
          active: boolean
          custom_domain: string | null
          settings: Json | null
          theme: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          organization_id: string
          active?: boolean
          custom_domain?: string | null
          settings?: Json | null
          theme?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          organization_id?: string
          active?: boolean
          custom_domain?: string | null
          settings?: Json | null
          theme?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      user_projects: {
        Row: {
          id: string
          user_id: string
          project_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          role?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          supabase_user_id: string | null
          name: string | null
          image: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          supabase_user_id?: string | null
          name?: string | null
          image?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          supabase_user_id?: string | null
          name?: string | null
          image?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_project_permissions: {
        Args: {
          p_user_id: string
          p_project_id: string
          p_role?: string
        }
        Returns: boolean
      }
      check_user_has_project_access: {
        Args: {
          p_user_id: string
          p_project_id: string
        }
        Returns: boolean
      }
      get_project_tenant_id: {
        Args: {
          p_project_id: string
        }
        Returns: string
      }
      get_user_projects: {
        Args: {
          p_user_id: string
        }
        Returns: {
          project_id: string
          role: string
        }[]
      }
    }
    Enums: {
      user_role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
      currency: "USD" | "EUR" | "GBP" | "SGD" | "INR" | "AUD" | "CAD" | "JPY" | "CNY" | "MYR"
      reward_type: "POINTS" | "DISCOUNT" | "FREEBIE" | "CASH_BACK" | "TIER_UPGRADE" | "CUSTOM"
    }
  }
}