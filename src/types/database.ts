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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          user_role: 'customer' | 'admin'
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          user_role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          user_role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Relationships: []
      }
      villas: {
        Row: {
          id: string
          name: string
          description: string
          location: string
          country: string
          max_guests: number
          bedrooms: number
          bathrooms: number
          images: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          location: string
          country: string
          max_guests: number
          bedrooms: number
          bathrooms: number
          images?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          location?: string
          country?: string
          max_guests?: number
          bedrooms?: number
          bathrooms?: number
          images?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      villa_packages: {
        Row: {
          id: string
          villa_id: string
          package_name: string
          package_tier: 'basic' | 'premium' | 'luxury'
          price_per_night: number
          description: string
          amenities: string[]
          included_services: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          villa_id: string
          package_name: string
          package_tier: 'basic' | 'premium' | 'luxury'
          price_per_night: number
          description: string
          amenities?: string[]
          included_services?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          villa_id?: string
          package_name?: string
          package_tier?: 'basic' | 'premium' | 'luxury'
          price_per_night?: number
          description?: string
          amenities?: string[]
          included_services?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "villa_packages_villa_id_fkey"
            columns: ["villa_id"]
            isOneToOne: false
            referencedRelation: "villas"
            referencedColumns: ["id"]
          }
        ]
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          villa_id: string
          package_id: string
          start_date: string
          end_date: string
          guests: number
          total_amount: number
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          stripe_payment_intent_id: string | null
          special_requests: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          villa_id: string
          package_id: string
          start_date: string
          end_date: string
          guests: number
          total_amount: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          stripe_payment_intent_id?: string | null
          special_requests?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          villa_id?: string
          package_id?: string
          start_date?: string
          end_date?: string
          guests?: number
          total_amount?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          stripe_payment_intent_id?: string | null
          special_requests?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_villa_id_fkey"
            columns: ["villa_id"]
            isOneToOne: false
            referencedRelation: "villas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "villa_packages"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_booking_availability: {
        Args: {
          p_villa_id: string
          p_package_id: string
          p_start_date: string
          p_end_date: string
          p_exclude_booking_id?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role_enum: 'customer' | 'admin'
      package_tier_enum: 'basic' | 'premium' | 'luxury'
      booking_status_enum: 'pending' | 'confirmed' | 'cancelled' | 'completed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}