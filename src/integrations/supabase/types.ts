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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          date_achieved: string | null
          description: string | null
          id: string
          proof_url: string | null
          speaker_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          date_achieved?: string | null
          description?: string | null
          id?: string
          proof_url?: string | null
          speaker_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          date_achieved?: string | null
          description?: string | null
          id?: string
          proof_url?: string | null
          speaker_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          is_recurring: boolean | null
          created_at: string | null
          day_of_week: number | null
          end_time: string | null
          expert_id: string | null
          id: string
          start_time: string | null
        }
        Insert: {
          is_recurring?: boolean | null
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string | null
          expert_id?: string | null
          id?: string
          start_time?: string | null
        }
        Update: {
          is_recurring?: boolean | null
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string | null
          expert_id?: string | null
          id?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          duration_hours: number | null
          duration_minutes: number | null
          event_date: string | null
          event_name: string
          id: string
          notes: string | null
          organizer_id: string | null
          scheduled_at: string | null
          speaker_id: string | null
          status: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          duration_hours?: number | null
          duration_minutes?: number | null
          event_date?: string | null
          event_name: string
          id?: string
          notes?: string | null
          organizer_id?: string | null
          scheduled_at?: string | null
          speaker_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          duration_hours?: number | null
          duration_minutes?: number | null
          event_date?: string | null
          event_name?: string
          id?: string
          notes?: string | null
          organizer_id?: string | null
          scheduled_at?: string | null
          speaker_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      expert_badges: {
        Row: {
          badge_category: string
          badge_icon: string
          badge_key: string
          badge_name: string
          earned_at: string | null
          expert_id: string
          id: string
        }
        Insert: {
          badge_category?: string
          badge_icon: string
          badge_key: string
          badge_name: string
          earned_at?: string | null
          expert_id: string
          id?: string
        }
        Update: {
          badge_category?: string
          badge_icon?: string
          badge_key?: string
          badge_name?: string
          earned_at?: string | null
          expert_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_badges_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_categories: {
        Row: {
          category_id: string
          expert_id: string
        }
        Insert: {
          category_id: string
          expert_id: string
        }
        Update: {
          category_id?: string
          expert_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_categories_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_embeddings: {
        Row: {
          embedding_text: string
          expert_id: string
          id: string
          last_updated: string | null
        }
        Insert: {
          embedding_text: string
          expert_id: string
          id?: string
          last_updated?: string | null
        }
        Update: {
          embedding_text?: string
          expert_id?: string
          id?: string
          last_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_embeddings_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: true
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_profiles: {
        Row: {
          availability_timezone: string | null
          bio: string
          commission_rate: number | null
          created_at: string | null
          expertise_areas: string[] | null
          full_name: string
          hourly_rate: number | null
          id: string
          industry_expertise: string[] | null
          intro_video_url: string | null
          is_active: boolean | null
          is_instant_available: boolean | null
          kyc_documents: Json | null
          languages: string[] | null
          location: string | null
          rating: number | null
          status: Database["public"]["Enums"]["expert_status"] | null
          title: string | null
          total_sessions: number | null
          updated_at: string | null
          user_id: string | null
          verification_level: Database["public"]["Enums"]["verification_level"] | null
          verification_status: string | null
          years_experience: number | null
        }
        Insert: {
          availability_timezone?: string | null
          bio: string
          commission_rate?: number | null
          created_at?: string | null
          expertise_areas?: string[] | null
          full_name: string
          hourly_rate?: number | null
          id?: string
          industry_expertise?: string[] | null
          intro_video_url?: string | null
          is_active?: boolean | null
          is_instant_available?: boolean | null
          kyc_documents?: Json | null
          languages?: string[] | null
          location?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["expert_status"] | null
          title?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_level?: Database["public"]["Enums"]["verification_level"] | null
          verification_status?: string | null
          years_experience?: number | null
        }
        Update: {
          availability_timezone?: string | null
          bio?: string
          commission_rate?: number | null
          created_at?: string | null
          expertise_areas?: string[] | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          industry_expertise?: string[] | null
          intro_video_url?: string | null
          is_active?: boolean | null
          is_instant_available?: boolean | null
          kyc_documents?: Json | null
          languages?: string[] | null
          location?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["expert_status"] | null
          title?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_level?: Database["public"]["Enums"]["verification_level"] | null
          verification_status?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      expert_reports: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          description: string
          expert_id: string
          id: string
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          description: string
          expert_id: string
          id?: string
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string
          expert_id?: string
          id?: string
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_reports_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          expert_id: string | null
          id: string
          rating: number | null
          seeker_id: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          expert_id?: string | null
          id?: string
          rating?: number | null
          seeker_id?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          expert_id?: string | null
          id?: string
          rating?: number | null
          seeker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_reviews_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_stats: {
        Row: {
          attendance_rate: number | null
          avg_rating: number | null
          avg_response_minutes: number | null
          best_streak_weeks: number | null
          cancellation_count: number | null
          completed_sessions: number | null
          current_streak_weeks: number | null
          current_tier: number | null
          expert_id: string
          no_show_count: number | null
          on_time_rate: number | null
          repeat_client_rate: number | null
          response_rate: number | null
          sessions_this_month: number | null
          total_reviews: number | null
          total_sessions: number | null
          total_xp: number | null
          updated_at: string | null
        }
        Insert: {
          attendance_rate?: number | null
          avg_rating?: number | null
          avg_response_minutes?: number | null
          best_streak_weeks?: number | null
          cancellation_count?: number | null
          completed_sessions?: number | null
          current_streak_weeks?: number | null
          current_tier?: number | null
          expert_id: string
          no_show_count?: number | null
          on_time_rate?: number | null
          repeat_client_rate?: number | null
          response_rate?: number | null
          sessions_this_month?: number | null
          total_reviews?: number | null
          total_sessions?: number | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Update: {
          attendance_rate?: number | null
          avg_rating?: number | null
          avg_response_minutes?: number | null
          best_streak_weeks?: number | null
          cancellation_count?: number | null
          completed_sessions?: number | null
          current_streak_weeks?: number | null
          current_tier?: number | null
          expert_id?: string
          no_show_count?: number | null
          on_time_rate?: number | null
          repeat_client_rate?: number | null
          response_rate?: number | null
          sessions_this_month?: number | null
          total_reviews?: number | null
          total_sessions?: number | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_stats_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: true
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_xp_log: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          expert_id: string
          id: string
          xp_change: number
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          expert_id: string
          id?: string
          xp_change: number
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          expert_id?: string
          id?: string
          xp_change?: number
        }
        Relationships: [
          {
            foreignKeyName: "expert_xp_log_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      expertise_bookings: {
        Row: {
          currency: string | null
          notes: string | null
          customer_phone: string | null
          customer_email: string | null
          customer_name: string | null
          event_name: string | null
          user_id: string | null
          consumer_id: string
          consumer_notes: string | null
          created_at: string | null
          duration_hours: number | null
          duration_minutes: number | null
          event_date: string | null
          expert_id: string
          expert_payout: number | null
          id: string
          meeting_link: string | null
          original_duration_minutes: number | null
          original_scheduled_at: string | null
          payment_intent_id: string | null
          platform_fee: number | null
          scheduled_at: string
          status: string | null
          total_amount: number
        }
        Insert: {
          currency?: string | null
          notes?: string | null
          customer_phone?: string | null
          customer_email?: string | null
          customer_name?: string | null
          event_name?: string | null
          user_id?: string | null
          consumer_id: string
          consumer_notes?: string | null
          created_at?: string | null
          duration_hours?: number | null
          duration_minutes?: number | null
          event_date?: string | null
          expert_id: string
          expert_payout?: number | null
          id?: string
          meeting_link?: string | null
          original_duration_minutes?: number | null
          original_scheduled_at?: string | null
          payment_intent_id?: string | null
          platform_fee?: number | null
          scheduled_at: string
          status?: string | null
          total_amount: number
        }
        Update: {
          currency?: string | null
          notes?: string | null
          customer_phone?: string | null
          customer_email?: string | null
          customer_name?: string | null
          event_name?: string | null
          user_id?: string | null
          consumer_id?: string
          consumer_notes?: string | null
          created_at?: string | null
          duration_hours?: number | null
          duration_minutes?: number | null
          event_date?: string | null
          expert_id?: string
          expert_payout?: number | null
          id?: string
          meeting_link?: string | null
          original_duration_minutes?: number | null
          original_scheduled_at?: string | null
          payment_intent_id?: string | null
          platform_fee?: number | null
          scheduled_at?: string
          status?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "expertise_bookings_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expertise_bookings_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      expertise_messages: {
        Row: {
          booking_id: string
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          booking_id: string
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          booking_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expertise_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "expertise_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expertise_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expertise_reviews: {
        Row: {
          expert_id: string
          id: string
        }
        Insert: {
          expert_id: string
          id?: string
        }
        Update: {
          expert_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expertise_reviews_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_profiles: {
        Row: {
          approved_at: string | null
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string | null
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          company?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          status?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_booking_confirmed: boolean
          email_expert_application: boolean
          email_expert_approved: boolean
          in_app_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_booking_confirmed?: boolean
          email_expert_application?: boolean
          email_expert_approved?: boolean
          in_app_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_booking_confirmed?: boolean
          email_expert_application?: boolean
          email_expert_approved?: boolean
          in_app_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number | null
          booking_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          status: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount?: number | null
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number | null
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_violations: {
        Row: {
          action_taken: string | null
          booking_id: string | null
          created_at: string | null
          description: string | null
          id: string
          severity: string
          subject_id: string
          subject_type: string
          violation_type: string
        }
        Insert: {
          action_taken?: string | null
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          severity?: string
          subject_id: string
          subject_type: string
          violation_type: string
        }
        Update: {
          action_taken?: string | null
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          severity?: string
          subject_id?: string
          subject_type?: string
          violation_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          referred_by: string | null
          referral_code: string | null
          attendance_rate: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          loyalty_tier: number | null
          no_show_count: number | null
          phone: string | null
          rookee_points: number | null
          total_sessions: number | null
          updated_at: string
          user_type: string | null
        }
        Insert: {
          referred_by?: string | null
          referral_code?: string | null
          attendance_rate?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          loyalty_tier?: number | null
          no_show_count?: number | null
          phone?: string | null
          rookee_points?: number | null
          total_sessions?: number | null
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          referred_by?: string | null
          referral_code?: string | null
          attendance_rate?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          loyalty_tier?: number | null
          no_show_count?: number | null
          phone?: string | null
          rookee_points?: number | null
          total_sessions?: number | null
          updated_at?: string
          user_type?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          reviewer_name: string | null
          booking_id: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number | null
          reviewer_id: string | null
          speaker_id: string | null
          updated_at: string
        }
        Insert: {
          reviewer_name?: string | null
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          reviewer_id?: string | null
          speaker_id?: string | null
          updated_at?: string
        }
        Update: {
          reviewer_name?: string | null
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          reviewer_id?: string | null
          speaker_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      rookee_points_log: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          points: number
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          points: number
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          points?: number
          user_id?: string
        }
        Relationships: []
      }
      seeker_profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          location: string | null
          preferred_languages: string[] | null
          total_bookings: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          location?: string | null
          preferred_languages?: string[] | null
          total_bookings?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          location?: string | null
          preferred_languages?: string[] | null
          total_bookings?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      speaker_availability: {
        Row: {
          created_at: string
          date_end: string | null
          date_start: string | null
          id: string
          speaker_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          date_end?: string | null
          date_start?: string | null
          id?: string
          speaker_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          date_end?: string | null
          date_start?: string | null
          id?: string
          speaker_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speaker_availability_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      speaker_categories: {
        Row: {
          category_id: string
          speaker_id: string
        }
        Insert: {
          category_id: string
          speaker_id: string
        }
        Update: {
          category_id?: string
          speaker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "speaker_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaker_categories_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      speakers: {
        Row: {
          total_reviews: number | null
          full_name: string | null
          expertise_areas: string[] | null
          category_id: string | null
          attendance_rate: number | null
          badges: string[] | null
          bio: string | null
          company: string | null
          created_at: string
          currency: string | null
          current_streak: number | null
          current_tier: number | null
          email: string | null
          experience_years: number | null
          expertise: string[] | null
          hourly_rate: number | null
          id: string
          image_url: string | null
          is_verified: boolean | null
          languages: string[] | null
          linkedin_url: string | null
          location: string | null
          name: string
          on_time_rate: number | null
          past_events: number | null
          phone: string | null
          profile_photo_url: string | null
          rating: number | null
          repeat_client_rate: number | null
          response_rate: number | null
          suspended_at: string | null
          suspension_history: Json | null
          suspension_reason: string | null
          title: string
          topics: string[] | null
          total_xp: number | null
          updated_at: string
          user_id: string | null
          verification_documents: Json | null
          verification_status: string | null
          video_url: string | null
          website_url: string | null
        }
        Insert: {
          total_reviews?: number | null
          full_name?: string | null
          expertise_areas?: string[] | null
          category_id?: string | null
          attendance_rate?: number | null
          badges?: string[] | null
          bio?: string | null
          company?: string | null
          created_at?: string
          currency?: string | null
          current_streak?: number | null
          current_tier?: number | null
          email?: string | null
          experience_years?: number | null
          expertise?: string[] | null
          hourly_rate?: number | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          languages?: string[] | null
          linkedin_url?: string | null
          location?: string | null
          name: string
          on_time_rate?: number | null
          past_events?: number | null
          phone?: string | null
          profile_photo_url?: string | null
          rating?: number | null
          repeat_client_rate?: number | null
          response_rate?: number | null
          suspended_at?: string | null
          suspension_history?: Json | null
          suspension_reason?: string | null
          title: string
          topics?: string[] | null
          total_xp?: number | null
          updated_at?: string
          user_id?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
          video_url?: string | null
          website_url?: string | null
        }
        Update: {
          total_reviews?: number | null
          full_name?: string | null
          expertise_areas?: string[] | null
          category_id?: string | null
          attendance_rate?: number | null
          badges?: string[] | null
          bio?: string | null
          company?: string | null
          created_at?: string
          currency?: string | null
          current_streak?: number | null
          current_tier?: number | null
          email?: string | null
          experience_years?: number | null
          expertise?: string[] | null
          hourly_rate?: number | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          languages?: string[] | null
          linkedin_url?: string | null
          location?: string | null
          name?: string
          on_time_rate?: number | null
          past_events?: number | null
          phone?: string | null
          profile_photo_url?: string | null
          rating?: number | null
          repeat_client_rate?: number | null
          response_rate?: number | null
          suspended_at?: string | null
          suspension_history?: Json | null
          suspension_reason?: string | null
          title?: string
          topics?: string[] | null
          total_xp?: number | null
          updated_at?: string
          user_id?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
          video_url?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_company: string | null
          author_name: string
          author_title: string | null
          content: string
          created_at: string
          id: string
          is_featured: boolean | null
          speaker_id: string | null
        }
        Insert: {
          author_company?: string | null
          author_name: string
          author_title?: string | null
          content: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          speaker_id?: string | null
        }
        Update: {
          author_company?: string | null
          author_name?: string
          author_title?: string | null
          content?: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          speaker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_icon: string
          badge_key: string
          badge_name: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_icon: string
          badge_key: string
          badge_name: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_icon?: string
          badge_key?: string
          badge_name?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          bio: string | null
          company: string | null
          created_at: string | null
          email: string
          full_name: string
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          full_name: string
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      user_stats: {
        Row: {
          attendance_rate: number | null
          cancellation_count: number | null
          categories_explored: number | null
          current_streak_weeks: number | null
          current_tier: number | null
          no_show_count: number | null
          on_time_rate: number | null
          referrals_converted: number | null
          referrals_sent: number | null
          reviews_left: number | null
          total_rookee_points: number | null
          total_sessions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attendance_rate?: number | null
          cancellation_count?: number | null
          categories_explored?: number | null
          current_streak_weeks?: number | null
          current_tier?: number | null
          no_show_count?: number | null
          on_time_rate?: number | null
          referrals_converted?: number | null
          referrals_sent?: number | null
          reviews_left?: number | null
          total_rookee_points?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attendance_rate?: number | null
          cancellation_count?: number | null
          categories_explored?: number | null
          current_streak_weeks?: number | null
          current_tier?: number | null
          no_show_count?: number | null
          on_time_rate?: number | null
          referrals_converted?: number | null
          referrals_sent?: number | null
          reviews_left?: number | null
          total_rookee_points?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          documents: Json | null
          id: string
          notes: string | null
          reviewed_at: string | null
          speaker_id: string | null
          status: string | null
          submitted_at: string
        }
        Insert: {
          documents?: Json | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          speaker_id?: string | null
          status?: string | null
          submitted_at?: string
        }
        Update: {
          documents?: Json | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          speaker_id?: string | null
          status?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_account: {
        Args: {
          target_user_id?: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      recalculate_expert_stats: {
        Args: {
          target_expert_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      booking_status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"
      communication_mode: "chat" | "voice" | "video"
      expert_status: "pending" | "approved" | "rejected" | "suspended"
      session_type: "instant" | "scheduled"
      verification_level: "basic" | "premium" | "verified"
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
      app_role: ["admin", "moderator", "user"],
      booking_status: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
      communication_mode: ["chat", "voice", "video"],
      expert_status: ["pending", "approved", "rejected", "suspended"],
      session_type: ["instant", "scheduled"],
      verification_level: ["basic", "premium", "verified"],
    },
  },
} as const
