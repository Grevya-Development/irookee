
export interface Expert {
  id: string;
  user_id: string;
  name: string;
  title: string;
  bio: string | null;
  expertise: string[];
  image_url: string | null;
  rating: number;
  hourly_rate: number;
  currency: string;
  availability_start: string | null;
  availability_end: string | null;
  location: string | null;
  languages: string[];
  past_events: number;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  badges: string[];
  social_links: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    [key: string]: string | undefined;
  };
  video_url: string | null;
  topics: string[];
  preferred_audience: string[];
  speaking_fees: {
    virtual: number;
    in_person: number;
  };
  travel_preferences: {
    willing_to_travel?: boolean;
    preferred_regions?: string[];
    passport_countries?: string[];
    visa_requirements?: string[];
    [key: string]: unknown;
  };
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  expert_id: string;
  organizer_id: string;
  event_name: string;
  event_date: string;
  duration_hours: number;
  total_amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  expert_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  name: string;
  category: string;
  created_at: string;
}

export interface ExpertAvailability {
  id: string;
  expert_id: string;
  date_start: string;
  date_end: string;
  status: 'available' | 'tentative' | 'unavailable';
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  expert_id: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  documents: {
    id_proof?: string;
    credentials?: string[];
    certificates?: string[];
    [key: string]: unknown;
  };
  notes: string | null;
}

export interface Testimonial {
  id: string;
  expert_id: string;
  author_name: string;
  author_title: string | null;
  author_company: string | null;
  content: string;
  is_featured: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  expert_id: string;
  title: string;
  description: string | null;
  date_achieved: string;
  proof_url: string | null;
  created_at: string;
}
