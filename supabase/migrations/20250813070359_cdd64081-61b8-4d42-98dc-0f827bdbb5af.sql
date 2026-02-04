
-- Create enum types for better data consistency
CREATE TYPE expert_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE session_type AS ENUM ('instant', 'scheduled');
CREATE TYPE communication_mode AS ENUM ('chat', 'voice', 'video');
CREATE TYPE verification_level AS ENUM ('basic', 'premium', 'verified');

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expert profiles table
CREATE TABLE expert_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  bio TEXT NOT NULL,
  industry_expertise TEXT[],
  years_experience INTEGER,
  location TEXT,
  languages TEXT[],
  hourly_rate DECIMAL(10,2),
  status expert_status DEFAULT 'pending',
  verification_level verification_level DEFAULT 'basic',
  rating DECIMAL(3,2) DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  intro_video_url TEXT,
  kyc_documents JSONB,
  availability_timezone TEXT,
  is_instant_available BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expert categories junction table
CREATE TABLE expert_categories (
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (expert_id, category_id)
);

-- Create availability slots table
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0-6 (Sunday-Saturday)
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
  session_type session_type,
  communication_mode communication_mode,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  total_amount DECIMAL(10,2),
  platform_commission DECIMAL(10,2),
  expert_payout DECIMAL(10,2),
  status booking_status DEFAULT 'pending',
  seeker_prompt TEXT,
  notes TEXT,
  meeting_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE expert_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  seeker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create seeker profiles table
CREATE TABLE seeker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  preferred_languages TEXT[],
  location TEXT,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'INR',
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, description, icon) VALUES
('Career & Job Transition', 'Career guidance and job transition support', '💼'),
('Industry Mentors', 'Industry-specific mentorship and advice', '🎯'),
('Study Abroad Guidance', 'International education and study abroad support', '🎓'),
('Travel & Tourism Guides', 'Local travel guides and tourism experts', '✈️'),
('Local Help', 'Interpreters, culture guides, and local assistance', '🗺️'),
('Business & Startup Advisors', 'Business strategy and startup guidance', '🚀'),
('Personal Skills Coaching', 'Personal development and skill enhancement', '📈'),
('Health & Wellness Advisors', 'Non-medical health and wellness guidance', '🧘');

-- Enable Row Level Security
ALTER TABLE expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for expert_profiles
CREATE POLICY "Public can view approved expert profiles" 
  ON expert_profiles FOR SELECT 
  USING (status = 'approved');

CREATE POLICY "Users can create their expert profile" 
  ON expert_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expert profile" 
  ON expert_profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for bookings
CREATE POLICY "Users can view their own bookings" 
  ON bookings FOR SELECT 
  USING (auth.uid() = seeker_id OR expert_id IN (
    SELECT id FROM expert_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Seekers can create bookings" 
  ON bookings FOR INSERT 
  WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Users can update their bookings" 
  ON bookings FOR UPDATE 
  USING (auth.uid() = seeker_id OR expert_id IN (
    SELECT id FROM expert_profiles WHERE user_id = auth.uid()
  ));

-- Create RLS policies for reviews
CREATE POLICY "Public can view reviews" 
  ON expert_reviews FOR SELECT 
  USING (true);

CREATE POLICY "Seekers can create reviews" 
  ON expert_reviews FOR INSERT 
  WITH CHECK (auth.uid() = seeker_id);

-- Create RLS policies for seeker_profiles
CREATE POLICY "Users can view their own seeker profile" 
  ON seeker_profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their seeker profile" 
  ON seeker_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seeker profile" 
  ON seeker_profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for other tables (basic access)
CREATE POLICY "Public can view categories" 
  ON categories FOR SELECT 
  USING (true);

CREATE POLICY "Public can view expert categories" 
  ON expert_categories FOR SELECT 
  USING (true);

CREATE POLICY "Experts can manage their availability" 
  ON availability_slots FOR ALL 
  USING (expert_id IN (
    SELECT id FROM expert_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their payments" 
  ON payments FOR SELECT 
  USING (booking_id IN (
    SELECT id FROM bookings WHERE seeker_id = auth.uid() OR expert_id IN (
      SELECT id FROM expert_profiles WHERE user_id = auth.uid()
    )
  ));

-- Create function to update expert rating
CREATE OR REPLACE FUNCTION update_expert_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE expert_profiles 
  SET rating = (
    SELECT AVG(rating)::DECIMAL(3,2) 
    FROM expert_reviews 
    WHERE expert_id = NEW.expert_id
  )
  WHERE id = NEW.expert_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update expert rating when review is added
CREATE TRIGGER update_expert_rating_trigger
  AFTER INSERT ON expert_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_expert_rating();
