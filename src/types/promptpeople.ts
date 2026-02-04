
export type ExpertStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type SessionType = 'instant' | 'scheduled';
export type CommunicationMode = 'chat' | 'voice' | 'video';
export type VerificationLevel = 'basic' | 'premium' | 'verified';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface ExpertProfile {
  id: string;
  user_id: string;
  full_name: string;
  bio: string;
  industry_expertise: string[];
  years_experience: number | null;
  location: string | null;
  languages: string[];
  hourly_rate: number | null;
  status: ExpertStatus;
  verification_level: VerificationLevel;
  rating: number;
  total_sessions: number;
  intro_video_url: string | null;
  kyc_documents: Record<string, unknown> | null;
  availability_timezone: string | null;
  is_instant_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  seeker_id: string;
  expert_id: string;
  session_type: SessionType;
  communication_mode: CommunicationMode;
  scheduled_at: string | null;
  duration_minutes: number | null;
  total_amount: number | null;
  platform_commission: number | null;
  expert_payout: number | null;
  status: BookingStatus;
  seeker_prompt: string | null;
  notes: string | null;
  meeting_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpertReview {
  id: string;
  booking_id: string;
  seeker_id: string;
  expert_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface SeekerProfile {
  id: string;
  user_id: string;
  full_name: string;
  preferred_languages: string[];
  location: string | null;
  total_bookings: number;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  id: string;
  expert_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface SearchFilters {
  category?: string;
  location?: string;
  language?: string;
  minRating?: number;
  maxPrice?: number;
  experienceLevel?: string;
  isInstantAvailable?: boolean;
}
