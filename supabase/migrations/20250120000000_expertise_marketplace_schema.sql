-- Expertise Marketplace Schema Migration
-- This migration creates the complete schema for the peer-to-peer expertise marketplace

-- First, update profiles table to match requirements
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('consumer', 'expert', 'both')) DEFAULT 'consumer';

-- Update existing profiles to set full_name from first_name and last_name
UPDATE public.profiles 
SET full_name = CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))
WHERE full_name IS NULL AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- Expert profiles table
CREATE TABLE IF NOT EXISTS public.expert_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  expertise_areas TEXT[] NOT NULL,
  experience_years INTEGER,
  hourly_rate DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  location TEXT,
  languages TEXT[],
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  rating DECIMAL(3,2) DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Availability slots
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES public.expert_profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings (new table for expertise marketplace)
CREATE TABLE IF NOT EXISTS public.expertise_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID REFERENCES public.profiles(id) NOT NULL,
  expert_id UUID REFERENCES public.expert_profiles(id) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'refunded')) DEFAULT 'pending',
  meeting_link TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  expert_payout DECIMAL(10,2) NOT NULL,
  payment_intent_id TEXT,
  consumer_notes TEXT,
  expert_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.expertise_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.expertise_bookings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) NOT NULL,
  expert_id UUID REFERENCES public.expert_profiles(id) NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.expertise_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.expertise_bookings(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert search embeddings (for AI matching)
CREATE TABLE IF NOT EXISTS public.expert_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES public.expert_profiles(id) ON DELETE CASCADE NOT NULL,
  embedding_text TEXT NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expert_id)
);

-- Enable Row Level Security
ALTER TABLE public.expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expertise_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expertise_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expertise_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (update existing)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for expert_profiles
CREATE POLICY "Active expert profiles viewable by all" ON public.expert_profiles 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Experts can update own profile" ON public.expert_profiles 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create expert profile" ON public.expert_profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for bookings
CREATE POLICY "Users can view their bookings" ON public.expertise_bookings 
  FOR SELECT USING (
    auth.uid() = consumer_id OR 
    auth.uid() IN (SELECT user_id FROM public.expert_profiles WHERE id = expert_id)
  );

CREATE POLICY "Consumers can create bookings" ON public.expertise_bookings 
  FOR INSERT WITH CHECK (auth.uid() = consumer_id);

CREATE POLICY "Users can update their bookings" ON public.expertise_bookings 
  FOR UPDATE USING (
    auth.uid() = consumer_id OR 
    auth.uid() IN (SELECT user_id FROM public.expert_profiles WHERE id = expert_id)
  );

-- RLS Policies for availability
CREATE POLICY "Availability viewable by all" ON public.availability_slots 
  FOR SELECT USING (true);

CREATE POLICY "Experts manage own availability" ON public.availability_slots 
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.expert_profiles WHERE id = expert_id)
  );

-- RLS Policies for reviews
CREATE POLICY "Reviews viewable by all" ON public.expertise_reviews 
  FOR SELECT USING (true);

CREATE POLICY "Users can review their bookings" ON public.expertise_reviews 
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT consumer_id FROM public.expertise_bookings WHERE id = booking_id)
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages for their bookings" ON public.expertise_messages 
  FOR SELECT USING (
    auth.uid() = sender_id OR
    auth.uid() IN (
      SELECT consumer_id FROM public.expertise_bookings WHERE id = booking_id
      UNION
      SELECT user_id FROM public.expert_profiles 
      WHERE id IN (SELECT expert_id FROM public.expertise_bookings WHERE id = booking_id)
    )
  );

CREATE POLICY "Users can send messages for their bookings" ON public.expertise_messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT consumer_id FROM public.expertise_bookings WHERE id = booking_id
      UNION
      SELECT user_id FROM public.expert_profiles 
      WHERE id IN (SELECT expert_id FROM public.expertise_bookings WHERE id = booking_id)
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expert_profiles_user_id ON public.expert_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_profiles_verification ON public.expert_profiles(verification_status, is_active);
CREATE INDEX IF NOT EXISTS idx_expertise_bookings_consumer ON public.expertise_bookings(consumer_id);
CREATE INDEX IF NOT EXISTS idx_expertise_bookings_expert ON public.expertise_bookings(expert_id);
CREATE INDEX IF NOT EXISTS idx_expertise_bookings_status ON public.expertise_bookings(status);
CREATE INDEX IF NOT EXISTS idx_availability_expert ON public.availability_slots(expert_id);
CREATE INDEX IF NOT EXISTS idx_expertise_reviews_expert ON public.expertise_reviews(expert_id);

-- Function to update expert rating when review is added
CREATE OR REPLACE FUNCTION public.update_expert_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.expert_profiles
  SET 
    rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.expertise_reviews
      WHERE expert_id = NEW.expert_id
    ),
    total_sessions = (
      SELECT COUNT(*)
      FROM public.expertise_bookings
      WHERE expert_id = NEW.expert_id AND status = 'completed'
    )
  WHERE id = NEW.expert_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update rating on review insert
DROP TRIGGER IF EXISTS trigger_update_expert_rating ON public.expertise_reviews;
CREATE TRIGGER trigger_update_expert_rating
  AFTER INSERT ON public.expertise_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_expert_rating();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for expertise_bookings updated_at
DROP TRIGGER IF EXISTS trigger_update_expertise_bookings_updated_at ON public.expertise_bookings;
CREATE TRIGGER trigger_update_expertise_bookings_updated_at
  BEFORE UPDATE ON public.expertise_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

