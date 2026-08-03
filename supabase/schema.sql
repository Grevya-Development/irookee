-- ============================================================================
-- irookee — consolidated database schema
-- Generated 2026-08-03 by concatenating all 26 migrations in timestamp order.
-- Running this file top-to-bottom on a fresh database reproduces the full
-- schema (tables, RLS policies, functions, triggers, storage buckets).
-- ============================================================================

-- ============================================================================
-- Migration: 20250812182531_1bd0c7d7-0352-4825-a736-938772171075.sql
-- ============================================================================


-- Create speakers table with all necessary fields
CREATE TABLE public.speakers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  expertise TEXT[] DEFAULT '{}',
  image_url TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  availability_start TEXT,
  availability_end TEXT,
  location TEXT,
  languages TEXT[] DEFAULT '{}',
  past_events INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  badges TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  video_url TEXT,
  topics TEXT[] DEFAULT '{}',
  preferred_audience TEXT[] DEFAULT '{}',
  speaking_fees JSONB DEFAULT '{"virtual": 0, "in_person": 0}',
  travel_preferences JSONB DEFAULT '{}'
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create speaker_categories junction table
CREATE TABLE public.speaker_categories (
  speaker_id UUID REFERENCES public.speakers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (speaker_id, category_id)
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  speaker_id UUID REFERENCES public.speakers(id),
  organizer_id UUID REFERENCES auth.users,
  event_name TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE,
  duration_hours NUMERIC,
  total_amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id),
  reviewer_id UUID REFERENCES auth.users,
  speaker_id UUID REFERENCES public.speakers(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create topics table
CREATE TABLE public.topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create speaker_availability table
CREATE TABLE public.speaker_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  speaker_id UUID REFERENCES public.speakers(id),
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create verification_requests table
CREATE TABLE public.verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  speaker_id UUID REFERENCES public.speakers(id),
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  documents JSONB DEFAULT '{}',
  notes TEXT
);

-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  speaker_id UUID REFERENCES public.speakers(id),
  author_name TEXT NOT NULL,
  author_title TEXT,
  author_company TEXT,
  content TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  speaker_id UUID REFERENCES public.speakers(id),
  title TEXT NOT NULL,
  description TEXT,
  date_achieved TIMESTAMP WITH TIME ZONE,
  proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create guest_profiles table
CREATE TABLE public.guest_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert sample categories
INSERT INTO public.categories (name, description) VALUES
('Technology', 'Speakers specializing in technology and innovation'),
('Business', 'Business leaders and entrepreneurs'),
('Health & Wellness', 'Health, wellness, and lifestyle experts'),
('Education', 'Educational and academic speakers'),
('Entertainment', 'Entertainment and media personalities'),
('Science', 'Scientists and researchers'),
('Arts & Culture', 'Artists, writers, and cultural figures'),
('Sports', 'Athletes and sports personalities');

-- Insert 20 diverse speaker profiles
INSERT INTO public.speakers (name, title, bio, expertise, image_url, rating, hourly_rate, currency, location, languages, past_events, is_verified, badges, social_links, topics, preferred_audience, speaking_fees, travel_preferences) VALUES

('Dr. Sarah Chen', 'AI Ethics Researcher & Technology Speaker', 'Leading expert in artificial intelligence ethics with over 10 years of experience in tech policy and machine learning applications.', ARRAY['AI Ethics', 'Machine Learning', 'Tech Policy', 'Future of Work'], 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.9, 750, 'USD', 'San Francisco, CA', ARRAY['English', 'Mandarin'], 85, true, ARRAY['AI Expert', 'TEDx Speaker'], '{"linkedin": "https://linkedin.com/in/sarahchen", "twitter": "@sarahchen_ai", "website": "https://sarahchen.ai"}', ARRAY['Artificial Intelligence', 'Ethics in Technology', 'Future of Work'], ARRAY['Corporate', 'Academic', 'Tech Conferences'], '{"virtual": 500, "in_person": 750}', '{"willing_to_travel": true, "preferred_regions": ["North America", "Europe", "Asia"]}'),

('Marcus Rodriguez', 'Serial Entrepreneur & Business Strategist', 'Three-time successful startup founder with expertise in scaling businesses from idea to IPO. Former VP at Fortune 500 companies.', ARRAY['Entrepreneurship', 'Business Strategy', 'Leadership', 'Venture Capital'], 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.8, 600, 'USD', 'Austin, TX', ARRAY['English', 'Spanish'], 120, true, ARRAY['Startup Founder', 'Best-Selling Author'], '{"linkedin": "https://linkedin.com/in/marcusrodriguez", "website": "https://marcusrodriguez.com"}', ARRAY['Entrepreneurship', 'Startup Growth', 'Investment Strategies'], ARRAY['Business', 'Startup', 'Corporate'], '{"virtual": 400, "in_person": 600}', '{"willing_to_travel": true, "preferred_regions": ["Americas", "Europe"]}'),

('Dr. Amara Okafor', 'Neuroscientist & Wellness Expert', 'Harvard-trained neuroscientist specializing in brain health, mindfulness, and peak performance optimization for high achievers.', ARRAY['Neuroscience', 'Wellness', 'Peak Performance', 'Mindfulness'], 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.9, 550, 'USD', 'Boston, MA', ARRAY['English', 'French'], 95, true, ARRAY['Harvard Alumni', 'Wellness Expert'], '{"linkedin": "https://linkedin.com/in/amaraokafor", "website": "https://brainhealthsolutions.com"}', ARRAY['Brain Health', 'Stress Management', 'Peak Performance'], ARRAY['Corporate', 'Healthcare', 'Wellness'], '{"virtual": 350, "in_person": 550}', '{"willing_to_travel": true, "preferred_regions": ["Global"]}'),

('James Thompson', 'Former NASA Engineer & Space Technology Expert', 'Spent 15 years at NASA working on Mars missions. Now speaks about innovation, space technology, and pushing boundaries.', ARRAY['Space Technology', 'Innovation', 'Engineering', 'Problem Solving'], 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.7, 700, 'USD', 'Houston, TX', ARRAY['English'], 75, true, ARRAY['NASA Veteran', 'Innovation Expert'], '{"linkedin": "https://linkedin.com/in/jamesthompson", "website": "https://spaceinnovation.com"}', ARRAY['Space Exploration', 'Innovation Mindset', 'Engineering Excellence'], ARRAY['STEM', 'Corporate', 'Educational'], '{"virtual": 500, "in_person": 700}', '{"willing_to_travel": true, "preferred_regions": ["North America", "Europe"]}'),

('Maria Gonzalez', 'Digital Marketing Pioneer & Social Media Strategist', 'Built and scaled social media strategies for Fortune 100 companies. Expert in digital transformation and brand building.', ARRAY['Digital Marketing', 'Social Media', 'Brand Strategy', 'Digital Transformation'], 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.8, 450, 'USD', 'Miami, FL', ARRAY['English', 'Spanish', 'Portuguese'], 110, true, ARRAY['Marketing Expert', 'Brand Strategist'], '{"linkedin": "https://linkedin.com/in/mariagonzalez", "twitter": "@mariamktg", "website": "https://digitalmarketingpro.com"}', ARRAY['Digital Marketing', 'Social Media Strategy', 'Brand Building'], ARRAY['Marketing', 'Business', 'Startup'], '{"virtual": 300, "in_person": 450}', '{"willing_to_travel": true, "preferred_regions": ["Americas", "Europe"]}'),

('Dr. Raj Patel', 'Climate Scientist & Sustainability Expert', 'Leading climate researcher with 20+ years studying climate change impacts. Advisor to governments and NGOs worldwide.', ARRAY['Climate Science', 'Sustainability', 'Environmental Policy', 'Green Technology'], 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.9, 650, 'USD', 'Seattle, WA', ARRAY['English', 'Hindi', 'Gujarati'], 90, true, ARRAY['Climate Expert', 'UN Advisor'], '{"linkedin": "https://linkedin.com/in/rajpatel", "website": "https://climatesolutions.org"}', ARRAY['Climate Change', 'Sustainability', 'Environmental Solutions'], ARRAY['Environmental', 'Academic', 'Policy'], '{"virtual": 450, "in_person": 650}', '{"willing_to_travel": true, "preferred_regions": ["Global"]}'),

('Lisa Wang', 'Cybersecurity Expert & Former FBI Agent', 'Former FBI cybercrime investigator now helping organizations protect against digital threats and data breaches.', ARRAY['Cybersecurity', 'Data Protection', 'Risk Management', 'Digital Forensics'], 'https://images.unsplash.com/photo-1494790108755-2616c06a77f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.8, 800, 'USD', 'Washington, DC', ARRAY['English', 'Mandarin'], 65, true, ARRAY['Former FBI', 'Security Expert'], '{"linkedin": "https://linkedin.com/in/lisawang", "website": "https://cybersecuritysolutions.com"}', ARRAY['Cybersecurity', 'Data Protection', 'Digital Threats'], ARRAY['Corporate', 'Government', 'Tech'], '{"virtual": 600, "in_person": 800}', '{"willing_to_travel": true, "preferred_regions": ["North America", "Europe", "Asia"]}'),

('David Kim', 'Olympic Athlete & Performance Coach', 'Two-time Olympic medalist in swimming. Now coaches executives and athletes on mental toughness and peak performance.', ARRAY['Peak Performance', 'Mental Toughness', 'Leadership', 'Goal Achievement'], 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.9, 500, 'USD', 'Los Angeles, CA', ARRAY['English', 'Korean'], 150, true, ARRAY['Olympic Medalist', 'Performance Coach'], '{"linkedin": "https://linkedin.com/in/davidkim", "instagram": "@davidkim_performance"}', ARRAY['Peak Performance', 'Mental Resilience', 'Goal Setting'], ARRAY['Sports', 'Corporate', 'Motivational'], '{"virtual": 350, "in_person": 500}', '{"willing_to_travel": true, "preferred_regions": ["Global"]}'),

('Dr. Elena Vasquez', 'Behavioral Psychologist & Team Dynamics Expert', 'PhD in Psychology with specialization in workplace behavior, team building, and organizational culture transformation.', ARRAY['Psychology', 'Team Building', 'Organizational Behavior', 'Leadership Development'], 'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.7, 475, 'USD', 'Denver, CO', ARRAY['English', 'Spanish'], 105, true, ARRAY['PhD Psychology', 'Team Expert'], '{"linkedin": "https://linkedin.com/in/elenavasquez", "website": "https://teamdynamics.com"}', ARRAY['Team Building', 'Workplace Psychology', 'Leadership'], ARRAY['Corporate', 'HR', 'Management'], '{"virtual": 325, "in_person": 475}', '{"willing_to_travel": true, "preferred_regions": ["Americas", "Europe"]}'),

('Ahmed Hassan', 'FinTech Innovator & Blockchain Expert', 'Pioneer in cryptocurrency and blockchain technology. Founded three successful FinTech companies and advised central banks.', ARRAY['Blockchain', 'Cryptocurrency', 'FinTech', 'Financial Innovation'], 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.8, 725, 'USD', 'New York, NY', ARRAY['English', 'Arabic'], 80, true, ARRAY['Blockchain Pioneer', 'FinTech Expert'], '{"linkedin": "https://linkedin.com/in/ahmedhassan", "twitter": "@ahmed_fintech"}', ARRAY['Blockchain Technology', 'Cryptocurrency', 'Financial Innovation'], ARRAY['Financial', 'Tech', 'Banking'], '{"virtual": 525, "in_person": 725}', '{"willing_to_travel": true, "preferred_regions": ["North America", "Europe", "Middle East"]}'),

('Dr. Grace Liu', 'Biotech Researcher & Medical Innovation Speaker', 'Leading researcher in gene therapy and personalized medicine. Published 100+ papers and holds 15 patents.', ARRAY['Biotechnology', 'Gene Therapy', 'Medical Innovation', 'Pharmaceutical Research'], 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.9, 675, 'USD', 'San Diego, CA', ARRAY['English', 'Mandarin'], 70, true, ARRAY['Medical Expert', 'Patent Holder'], '{"linkedin": "https://linkedin.com/in/graceliu", "website": "https://biomedresearch.com"}', ARRAY['Gene Therapy', 'Medical Innovation', 'Biotechnology'], ARRAY['Medical', 'Academic', 'Pharmaceutical'], '{"virtual": 475, "in_person": 675}', '{"willing_to_travel": true, "preferred_regions": ["North America", "Europe", "Asia"]}'),

('Robert Johnson', 'Award-Winning Chef & Hospitality Expert', 'Michelin-starred chef and restaurant owner. Expert in hospitality excellence, customer experience, and culinary innovation.', ARRAY['Hospitality', 'Customer Experience', 'Culinary Arts', 'Business Excellence'], 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.7, 400, 'USD', 'New Orleans, LA', ARRAY['English', 'French'], 125, true, ARRAY['Michelin Star', 'Hospitality Expert'], '{"linkedin": "https://linkedin.com/in/robertjohnson", "instagram": "@chef_robert"}', ARRAY['Hospitality Excellence', 'Customer Service', 'Culinary Innovation'], ARRAY['Hospitality', 'Business', 'Food Industry'], '{"virtual": 275, "in_person": 400}', '{"willing_to_travel": true, "preferred_regions": ["Americas", "Europe"]}'),

('Dr. Fatima Al-Zahra', 'Renewable Energy Engineer & Green Tech Advocate', 'Leading engineer in solar and wind technology. Designed renewable energy systems for 50+ countries.', ARRAY['Renewable Energy', 'Green Technology', 'Sustainable Engineering', 'Clean Energy'], 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.8, 625, 'USD', 'Phoenix, AZ', ARRAY['English', 'Arabic'], 85, true, ARRAY['Green Tech Pioneer', 'Sustainability Expert'], '{"linkedin": "https://linkedin.com/in/fatimaazahra", "website": "https://renewabletech.com"}', ARRAY['Renewable Energy', 'Sustainability', 'Green Technology'], ARRAY['Environmental', 'Engineering', 'Energy'], '{"virtual": 425, "in_person": 625}', '{"willing_to_travel": true, "preferred_regions": ["Global"]}'),

('Michael O''Connor', 'Former Military General & Leadership Expert', '30-year military career including combat leadership and strategic planning. Now teaches leadership and crisis management.', ARRAY['Leadership', 'Crisis Management', 'Strategic Planning', 'Team Building'], 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.9, 550, 'USD', 'Atlanta, GA', ARRAY['English'], 95, true, ARRAY['Military Veteran', 'Leadership Expert'], '{"linkedin": "https://linkedin.com/in/michaeloconnor"}', ARRAY['Military Leadership', 'Crisis Management', 'Strategic Planning'], ARRAY['Corporate', 'Government', 'Leadership'], '{"virtual": 375, "in_person": 550}', '{"willing_to_travel": true, "preferred_regions": ["North America", "Europe"]}'),

('Dr. Priya Sharma', 'AI Healthcare Researcher & Digital Health Expert', 'Pioneer in applying AI to healthcare diagnostics. Leading researcher in telemedicine and digital health solutions.', ARRAY['AI in Healthcare', 'Digital Health', 'Telemedicine', 'Medical Technology'], 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.8, 700, 'USD', 'Chicago, IL', ARRAY['English', 'Hindi'], 75, true, ARRAY['AI Healthcare Expert', 'Digital Health Pioneer'], '{"linkedin": "https://linkedin.com/in/priyasharma", "website": "https://aihealthcare.com"}', ARRAY['AI in Healthcare', 'Digital Transformation', 'Medical Technology'], ARRAY['Healthcare', 'Tech', 'Medical'], '{"virtual": 500, "in_person": 700}', '{"willing_to_travel": true, "preferred_regions": ["North America", "Asia", "Europe"]}'),

('Carlos Silva', 'Social Impact Entrepreneur & Nonprofit Leader', 'Founded multiple nonprofits serving underserved communities. Expert in social entrepreneurship and impact measurement.', ARRAY['Social Entrepreneurship', 'Nonprofit Management', 'Impact Measurement', 'Community Development'], 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.7, 375, 'USD', 'Portland, OR', ARRAY['English', 'Spanish'], 140, true, ARRAY['Social Entrepreneur', 'Community Leader'], '{"linkedin": "https://linkedin.com/in/carlossilva", "website": "https://socialimpact.org"}', ARRAY['Social Entrepreneurship', 'Nonprofit Leadership', 'Community Impact'], ARRAY['Nonprofit', 'Social Impact', 'Community'], '{"virtual": 250, "in_person": 375}', '{"willing_to_travel": true, "preferred_regions": ["Americas"]}'),

('Dr. Yuki Tanaka', 'Robotics Engineer & Automation Expert', 'Leading robotics researcher with expertise in industrial automation and human-robot interaction. 20+ patents in robotics.', ARRAY['Robotics', 'Automation', 'Manufacturing', 'Human-Robot Interaction'], 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.9, 650, 'USD', 'Detroit, MI', ARRAY['English', 'Japanese'], 60, true, ARRAY['Robotics Expert', 'Patent Holder'], '{"linkedin": "https://linkedin.com/in/yukitanaka", "website": "https://roboticsolutions.com"}', ARRAY['Robotics', 'Industrial Automation', 'Future of Manufacturing'], ARRAY['Manufacturing', 'Tech', 'Engineering'], '{"virtual": 450, "in_person": 650}', '{"willing_to_travel": true, "preferred_regions": ["North America", "Asia"]}'),

('Isabella Romano', 'Fashion Industry Expert & Sustainability Advocate', 'Former fashion executive turned sustainability consultant. Expert in ethical fashion and circular economy principles.', ARRAY['Fashion Industry', 'Sustainability', 'Circular Economy', 'Ethical Business'], 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.6, 425, 'USD', 'Nashville, TN', ARRAY['English', 'Italian'], 100, true, ARRAY['Fashion Expert', 'Sustainability Advocate'], '{"linkedin": "https://linkedin.com/in/isabellaromano", "instagram": "@isabella_sustainable"}', ARRAY['Sustainable Fashion', 'Circular Economy', 'Ethical Business'], ARRAY['Fashion', 'Sustainability', 'Business'], '{"virtual": 300, "in_person": 425}', '{"willing_to_travel": true, "preferred_regions": ["Americas", "Europe"]}'),

('Dr. Benjamin Wright', 'Space Medicine Researcher & Human Performance Expert', 'NASA space medicine researcher studying human adaptation to extreme environments and optimizing performance under pressure.', ARRAY['Space Medicine', 'Human Performance', 'Extreme Environments', 'Aerospace Medicine'], 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.8, 775, 'USD', 'Cape Canaveral, FL', ARRAY['English'], 55, true, ARRAY['NASA Researcher', 'Space Medicine Expert'], '{"linkedin": "https://linkedin.com/in/benjaminwright", "website": "https://spacemedicine.org"}', ARRAY['Space Medicine', 'Human Performance', 'Extreme Environment Adaptation'], ARRAY['Medical', 'Aerospace', 'Research'], '{"virtual": 575, "in_person": 775}', '{"willing_to_travel": true, "preferred_regions": ["North America", "Europe"]}'),

('Samantha Lee', 'EdTech Pioneer & Learning Innovation Expert', 'Founded multiple educational technology companies. Expert in online learning, educational innovation, and digital pedagogy.', ARRAY['Educational Technology', 'Online Learning', 'Digital Pedagogy', 'Learning Innovation'], 'https://images.unsplash.com/photo-1494790108755-2616c06a77f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80', 4.7, 500, 'USD', 'Raleigh, NC', ARRAY['English', 'Korean'], 115, true, ARRAY['EdTech Pioneer', 'Learning Expert'], '{"linkedin": "https://linkedin.com/in/samanthalee", "website": "https://edtechinnovation.com"}', ARRAY['Educational Technology', 'Online Learning', 'Digital Education'], ARRAY['Education', 'Tech', 'Academic'], '{"virtual": 350, "in_person": 500}', '{"willing_to_travel": true, "preferred_regions": ["North America", "Asia"]}');

-- Enable Row Level Security
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaker_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaker_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to speakers and categories
CREATE POLICY "Allow public read access to speakers" ON public.speakers FOR SELECT USING (true);
CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to speaker_categories" ON public.speaker_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Allow public read access to testimonials" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Allow public read access to achievements" ON public.achievements FOR SELECT USING (true);

-- Create policies for guest profiles
CREATE POLICY "Allow public insert to guest_profiles" ON public.guest_profiles FOR INSERT WITH CHECK (true);

-- Create policies for authenticated users
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Users can view their bookings" ON public.bookings FOR SELECT USING (auth.uid() = organizer_id OR speaker_id IN (SELECT id FROM public.speakers WHERE user_id = auth.uid()));
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);

-- Create policies for speaker management
CREATE POLICY "Users can create speaker profiles" ON public.speakers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their speaker profiles" ON public.speakers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their availability" ON public.speaker_availability FOR ALL USING (speaker_id IN (SELECT id FROM public.speakers WHERE user_id = auth.uid()));
CREATE POLICY "Users can submit verification requests" ON public.verification_requests FOR INSERT WITH CHECK (speaker_id IN (SELECT id FROM public.speakers WHERE user_id = auth.uid()));

-- ============================================================================
-- Migration: 20250813070359_cdd64081-61b8-4d42-98dc-0f827bdbb5af.sql
-- ============================================================================


-- Create enum types for better data consistency
CREATE TYPE expert_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE session_type AS ENUM ('instant', 'scheduled');
CREATE TYPE communication_mode AS ENUM ('chat', 'voice', 'video');
CREATE TYPE verification_level AS ENUM ('basic', 'premium', 'verified');

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expert profiles table
CREATE TABLE IF NOT EXISTS expert_profiles (
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
CREATE TABLE IF NOT EXISTS expert_categories (
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (expert_id, category_id)
);

-- Create availability slots table
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0-6 (Sunday-Saturday)
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
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
CREATE TABLE IF NOT EXISTS expert_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  seeker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create seeker profiles table
CREATE TABLE IF NOT EXISTS seeker_profiles (
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
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'INR',
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure icon column exists
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;

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
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
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

-- -- Create RLS policies for bookings
-- CREATE POLICY "Users can view their own bookings" 
--   ON bookings FOR SELECT 
--   USING (auth.uid() = seeker_id OR expert_id IN (
--     SELECT id FROM expert_profiles WHERE user_id = auth.uid()
--   ));
-- 
-- CREATE POLICY "Seekers can create bookings" 
--   ON bookings FOR INSERT 
--   WITH CHECK (auth.uid() = seeker_id);
-- 
-- CREATE POLICY "Users can update their bookings" 
--   ON bookings FOR UPDATE 
--   USING (auth.uid() = seeker_id OR expert_id IN (
--     SELECT id FROM expert_profiles WHERE user_id = auth.uid()
--   ));

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

-- CREATE POLICY "Users can view their payments" 
--   ON payments FOR SELECT 
--   USING (booking_id IN (
--     SELECT id FROM bookings WHERE seeker_id = auth.uid() OR expert_id IN (
--       SELECT id FROM expert_profiles WHERE user_id = auth.uid()
--     )
--   ));

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

-- ============================================================================
-- Migration: 20250813070945_e74f6d89-47df-4e8d-a170-5d30221efb1e.sql
-- ============================================================================


-- Add the missing icon column to the categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;

-- Update existing categories with their icons
UPDATE categories SET icon = '💼' WHERE name = 'Career & Job Transition';
UPDATE categories SET icon = '🎯' WHERE name = 'Industry Mentors';
UPDATE categories SET icon = '🎓' WHERE name = 'Study Abroad Guidance';
UPDATE categories SET icon = '✈️' WHERE name = 'Travel & Tourism Guides';
UPDATE categories SET icon = '🗺️' WHERE name = 'Local Help';
UPDATE categories SET icon = '🚀' WHERE name = 'Business & Startup Advisors';
UPDATE categories SET icon = '📈' WHERE name = 'Personal Skills Coaching';
UPDATE categories SET icon = '🧘' WHERE name = 'Health & Wellness Advisors';

-- ============================================================================
-- Migration: 20250917055318_5d70a386-5cca-4a6c-9b0e-410ff73e630b.sql
-- ============================================================================

-- Add status column to guest_profiles to track approval status
ALTER TABLE public.guest_profiles 
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add approved_at timestamp
ALTER TABLE public.guest_profiles 
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Create user_profiles table for approved users
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  bio TEXT,
  hourly_rate NUMERIC DEFAULT 100,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
CREATE POLICY "Users can view all profiles" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update bookings table to reference user_profiles instead
ALTER TABLE public.bookings 
ADD COLUMN expert_profile_id UUID REFERENCES user_profiles(id);

-- Add customer information to bookings
ALTER TABLE public.bookings 
ADD COLUMN customer_name TEXT,
ADD COLUMN customer_email TEXT,
ADD COLUMN customer_phone TEXT;

-- Update RLS policies for bookings to work with new structure
DROP POLICY IF EXISTS "Users can view their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;

CREATE POLICY "Users can view their bookings as customer" ON public.bookings
  FOR SELECT USING (auth.uid() = organizer_id);

CREATE POLICY "Experts can view their bookings" ON public.bookings
  FOR SELECT USING (expert_profile_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

-- Allow admins to view guest profiles for approval
CREATE POLICY "Allow admin read access to guest_profiles" ON public.guest_profiles
  FOR SELECT USING (true);

-- Allow admins to update guest profiles
CREATE POLICY "Allow admin update access to guest_profiles" ON public.guest_profiles
  FOR UPDATE USING (true);
-- ============================================================================
-- Migration: 20250921102746_b90ecc85-76ac-432c-b230-dd48ef6c28cf.sql
-- ============================================================================

-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Check if this is the admin email and assign admin role
  IF NEW.email = 'nrkavin005@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;
-- ============================================================================
-- Migration: 20250922000000_expertise_marketplace_schema.sql
-- ============================================================================

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

-- Ensure all expected columns exist in expert_profiles for downstream policies and triggers
ALTER TABLE public.expert_profiles 
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS expertise_areas TEXT[],
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 15.00,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

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


-- ============================================================================
-- Migration: 20260419000000_full_platform_upgrade.sql
-- ============================================================================

-- =============================================
-- IROOKEE PLATFORM UPGRADE MIGRATION
-- Free platform, verification docs, categories,
-- no-show tracking, dummy experts
-- =============================================

-- 1. Add new columns to speakers table for verification documents
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending';
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS verification_documents jsonb DEFAULT '{}';
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS experience_years integer;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS profile_photo_url text;

-- 2. Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'consumer';

-- 3. Add no_show status to bookings
-- bookings.status already accepts text, so 'no_show' is valid

-- 4. Add meeting_link to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_link text;

-- 5. Clear existing categories and insert comprehensive ones
DELETE FROM speaker_categories;
DELETE FROM categories;

INSERT INTO categories (id, name, description, icon) VALUES
  (gen_random_uuid(), 'Finance & Accounting', 'Financial planning, investment strategy, tax advisory, and accounting services', 'DollarSign'),
  (gen_random_uuid(), 'Startup & Entrepreneurship', 'Business ideation, fundraising, scaling, and startup mentorship', 'Rocket'),
  (gen_random_uuid(), 'Marketing & Growth', 'Digital marketing, SEO, content strategy, brand building, and growth hacking', 'TrendingUp'),
  (gen_random_uuid(), 'Tourism & Travel Guide', 'Travel planning, local guides, cultural experiences, and tourism consulting', 'Plane'),
  (gen_random_uuid(), 'Technology & Engineering', 'Software development, AI/ML, cloud architecture, and tech consulting', 'Code'),
  (gen_random_uuid(), 'Design & Creative', 'UI/UX design, graphic design, product design, and creative direction', 'Palette'),
  (gen_random_uuid(), 'Health & Wellness', 'Nutrition, fitness coaching, mental health, yoga, and holistic wellness', 'Heart'),
  (gen_random_uuid(), 'Education & Tutoring', 'Academic tutoring, exam prep, language learning, and educational consulting', 'BookOpen'),
  (gen_random_uuid(), 'Legal & Compliance', 'Legal advisory, contract review, compliance, and regulatory guidance', 'Scale'),
  (gen_random_uuid(), 'Real Estate', 'Property investment, home buying guidance, real estate strategy', 'Home'),
  (gen_random_uuid(), 'Career & HR', 'Resume review, interview prep, career coaching, HR consulting', 'Briefcase'),
  (gen_random_uuid(), 'Product Management', 'Product strategy, roadmap planning, agile methodologies, user research', 'Layout'),
  (gen_random_uuid(), 'Data Science & Analytics', 'Data analysis, machine learning, business intelligence, statistical modeling', 'BarChart'),
  (gen_random_uuid(), 'Sales & Business Development', 'Sales strategy, lead generation, partnerships, and B2B consulting', 'Handshake'),
  (gen_random_uuid(), 'Content & Media', 'Content creation, podcasting, video production, journalism, and copywriting', 'Film'),
  (gen_random_uuid(), 'Supply Chain & Operations', 'Logistics, supply chain optimization, operations management', 'Truck'),
  (gen_random_uuid(), 'Agriculture & Farming', 'Farming techniques, agri-business, organic farming, and rural consulting', 'Leaf'),
  (gen_random_uuid(), 'Music & Performing Arts', 'Music lessons, vocal training, acting, dance, and performance coaching', 'Music'),
  (gen_random_uuid(), 'Photography & Videography', 'Photography tips, videography, editing, drone photography', 'Camera'),
  (gen_random_uuid(), 'Sports & Fitness Coaching', 'Personal training, sports coaching, athletic performance', 'Dumbbell'),
  (gen_random_uuid(), 'Cooking & Culinary Arts', 'Cooking classes, recipe development, culinary consulting, food business', 'ChefHat'),
  (gen_random_uuid(), 'Fashion & Styling', 'Personal styling, fashion consulting, wardrobe management', 'Shirt'),
  (gen_random_uuid(), 'Mental Health & Therapy', 'Counseling, therapy, stress management, life coaching', 'Brain'),
  (gen_random_uuid(), 'Blockchain & Crypto', 'Cryptocurrency, blockchain development, DeFi, NFTs, Web3', 'Link'),
  (gen_random_uuid(), 'E-commerce & Retail', 'Online store setup, marketplace strategy, retail consulting', 'ShoppingCart'),
  (gen_random_uuid(), 'Architecture & Interior Design', 'Building design, interior decoration, space planning', 'Building'),
  (gen_random_uuid(), 'Sustainability & Environment', 'Green business, environmental consulting, ESG, carbon footprint', 'TreePine'),
  (gen_random_uuid(), 'Immigration & Visa', 'Visa guidance, immigration consulting, relocation services', 'Globe'),
  (gen_random_uuid(), 'Public Speaking & Communication', 'Presentation skills, speech coaching, communication training', 'Mic'),
  (gen_random_uuid(), 'Parenting & Family', 'Parenting advice, family counseling, child development', 'Users'),
  (gen_random_uuid(), 'Insurance & Risk Management', 'Insurance advisory, risk assessment, claims guidance', 'Shield'),
  (gen_random_uuid(), 'Astrology & Spiritual Guidance', 'Astrology readings, spiritual counseling, meditation guidance', 'Sparkles'),
  (gen_random_uuid(), 'Automotive & Mechanics', 'Car buying advice, vehicle maintenance, automotive consulting', 'Car'),
  (gen_random_uuid(), 'Event Planning & Management', 'Wedding planning, corporate events, party organization', 'CalendarDays'),
  (gen_random_uuid(), 'Gaming & Esports', 'Game coaching, esports strategy, game development consulting', 'Gamepad2'),
  (gen_random_uuid(), 'Pet Care & Veterinary', 'Pet training, animal care, veterinary guidance', 'PawPrint'),
  (gen_random_uuid(), 'Government & Public Policy', 'Policy consulting, government relations, civic engagement', 'Landmark'),
  (gen_random_uuid(), 'Non-Profit & Social Impact', 'NGO management, fundraising, social enterprise, impact measurement', 'HeartHandshake'),
  (gen_random_uuid(), 'Language & Translation', 'Translation services, language tutoring, localization', 'Languages'),
  (gen_random_uuid(), 'Cybersecurity', 'Security auditing, penetration testing, data protection, compliance', 'ShieldCheck');

-- 6. Insert dummy expert profiles for testing
INSERT INTO speakers (name, title, bio, expertise, hourly_rate, currency, location, languages, rating, past_events, is_verified, verification_status, badges, experience_years, company, topics) VALUES
('Priya Sharma', 'Startup Mentor & Angel Investor', 'Serial entrepreneur with 3 successful exits. Passionate about helping early-stage startups find product-market fit and raise funding. Former VP at Flipkart.', ARRAY['Startups', 'Fundraising', 'Product Strategy', 'Business Planning'], 0, 'INR', 'Bangalore, India', ARRAY['English', 'Hindi', 'Kannada'], 4.9, 127, true, 'verified', ARRAY['Top Rated', 'Verified'], 15, 'Angel Network India', ARRAY['Seed Funding', 'Pitch Decks', 'Market Research']),

('Rahul Verma', 'Digital Marketing Strategist', 'Google-certified marketer with expertise in SEO, SEM, and social media growth. Helped 200+ businesses scale their online presence.', ARRAY['Digital Marketing', 'SEO', 'Social Media', 'Content Strategy', 'Growth Hacking'], 0, 'INR', 'Mumbai, India', ARRAY['English', 'Hindi', 'Marathi'], 4.7, 89, true, 'verified', ARRAY['Verified'], 8, 'GrowthLab Digital', ARRAY['SEO Strategy', 'Facebook Ads', 'Instagram Growth']),

('Dr. Ananya Iyer', 'Financial Advisor & Wealth Manager', 'CFA and CFP certified. 12 years of experience in personal finance, mutual funds, and retirement planning. Regular columnist for Economic Times.', ARRAY['Personal Finance', 'Investment Planning', 'Tax Advisory', 'Retirement Planning', 'Mutual Funds'], 0, 'INR', 'Chennai, India', ARRAY['English', 'Tamil', 'Hindi'], 4.8, 203, true, 'verified', ARRAY['Top Rated', 'Verified'], 12, 'WealthFirst Advisors', ARRAY['Mutual Funds', 'Tax Saving', 'SIP Planning']),

('Arjun Mehta', 'Full-Stack Developer & Tech Lead', 'Ex-Google engineer. Specializes in React, Node.js, and cloud architecture. Built products used by millions. Open source contributor.', ARRAY['Web Development', 'React', 'Node.js', 'System Design', 'Cloud Architecture'], 0, 'INR', 'Hyderabad, India', ARRAY['English', 'Hindi', 'Telugu'], 4.9, 156, true, 'verified', ARRAY['Top Rated', 'Verified'], 10, 'Independent Consultant', ARRAY['React Best Practices', 'Microservices', 'AWS']),

('Sneha Kapoor', 'Travel Guide & Tourism Consultant', 'Visited 45+ countries. Expert in budget travel, solo female travel, and cultural experiences. Runs a popular travel blog with 500K+ followers.', ARRAY['Travel Planning', 'Budget Travel', 'Solo Travel', 'Cultural Tourism', 'Adventure Travel'], 0, 'INR', 'Delhi, India', ARRAY['English', 'Hindi', 'French'], 4.6, 78, true, 'verified', ARRAY['Verified'], 7, 'Wanderlust Travels', ARRAY['Budget Backpacking', 'Europe Travel', 'Southeast Asia']),

('Vikram Singh', 'Career Coach & HR Consultant', 'Former Head of HR at Infosys. Specializes in resume building, interview preparation, and career transitions. Has placed 1000+ candidates.', ARRAY['Career Coaching', 'Resume Building', 'Interview Prep', 'Leadership Development', 'HR Strategy'], 0, 'INR', 'Pune, India', ARRAY['English', 'Hindi', 'Punjabi'], 4.8, 312, true, 'verified', ARRAY['Top Rated', 'Verified'], 18, 'CareerBoost Consulting', ARRAY['Interview Skills', 'Resume Writing', 'LinkedIn Optimization']),

('Dr. Meera Nair', 'Nutrition & Wellness Coach', 'PhD in Clinical Nutrition. Certified yoga instructor. Specializes in holistic health, weight management, and sports nutrition.', ARRAY['Nutrition', 'Weight Management', 'Sports Nutrition', 'Yoga', 'Holistic Health'], 0, 'INR', 'Kochi, India', ARRAY['English', 'Malayalam', 'Hindi'], 4.7, 145, true, 'verified', ARRAY['Verified'], 9, 'Holistic Wellness Center', ARRAY['Diet Planning', 'Yoga for Beginners', 'Ayurvedic Nutrition']),

('Karthik Rajan', 'UI/UX Designer & Creative Director', 'Award-winning designer. Former design lead at Swiggy. Expertise in product design, design systems, and user research.', ARRAY['UI/UX Design', 'Product Design', 'Design Systems', 'User Research', 'Figma'], 0, 'INR', 'Bangalore, India', ARRAY['English', 'Tamil', 'Hindi'], 4.9, 92, true, 'verified', ARRAY['Top Rated', 'Verified'], 11, 'DesignCraft Studios', ARRAY['Figma Mastery', 'Design Thinking', 'Mobile App Design']),

('Amrita Desai', 'Legal Advisor & Corporate Lawyer', '15 years of corporate law experience. Specializes in startup legal, contract drafting, and IP protection. Partner at top law firm.', ARRAY['Corporate Law', 'Startup Legal', 'Contract Drafting', 'IP Protection', 'Compliance'], 0, 'INR', 'Mumbai, India', ARRAY['English', 'Hindi', 'Gujarati'], 4.8, 167, true, 'verified', ARRAY['Verified'], 15, 'Desai & Associates', ARRAY['Startup Incorporation', 'Term Sheets', 'GDPR Compliance']),

('Rohan Gupta', 'Data Scientist & AI Researcher', 'PhD in Machine Learning from IIT Delhi. 8 years in data science. Built ML pipelines processing billions of data points at Amazon.', ARRAY['Data Science', 'Machine Learning', 'Python', 'Deep Learning', 'NLP'], 0, 'INR', 'Gurgaon, India', ARRAY['English', 'Hindi'], 4.7, 88, true, 'verified', ARRAY['Verified'], 8, 'AI Research Labs', ARRAY['Python for Data Science', 'TensorFlow', 'NLP Applications']),

('Lakshmi Krishnan', 'Public Speaking Coach', 'TEDx speaker and communication trainer. Has coached 500+ professionals on public speaking, storytelling, and executive presence.', ARRAY['Public Speaking', 'Storytelling', 'Executive Presence', 'Communication Skills', 'Presentation Design'], 0, 'INR', 'Chennai, India', ARRAY['English', 'Tamil', 'Hindi'], 4.9, 234, true, 'verified', ARRAY['Top Rated', 'Verified'], 14, 'SpeakWell Academy', ARRAY['TED-style Talks', 'Storytelling Techniques', 'Stage Presence']),

('Aditya Joshi', 'Real Estate Investment Advisor', 'Former HDFC executive. Expert in property investment, home loans, and real estate market analysis. Helped clients manage 500+ Cr portfolio.', ARRAY['Real Estate', 'Property Investment', 'Home Loans', 'Market Analysis', 'Commercial Real Estate'], 0, 'INR', 'Mumbai, India', ARRAY['English', 'Hindi', 'Marathi'], 4.6, 98, true, 'verified', ARRAY['Verified'], 13, 'PropWealth Advisors', ARRAY['First Home Buying', 'REITs', 'Property Valuation']),

('Neha Bhatt', 'Content Creator & Social Media Expert', '1M+ followers across platforms. Expert in personal branding, content monetization, and influencer marketing.', ARRAY['Content Creation', 'Social Media', 'Personal Branding', 'YouTube', 'Instagram'], 0, 'INR', 'Delhi, India', ARRAY['English', 'Hindi'], 4.5, 67, true, 'verified', ARRAY['Verified'], 6, 'Creative Labs', ARRAY['YouTube Growth', 'Instagram Reels', 'Content Monetization']),

('Suresh Menon', 'Blockchain & Crypto Advisor', 'Early Bitcoin adopter. Expert in DeFi, NFTs, and Web3 development. Former CTO of a top crypto exchange.', ARRAY['Blockchain', 'Cryptocurrency', 'DeFi', 'NFTs', 'Web3', 'Smart Contracts'], 0, 'INR', 'Bangalore, India', ARRAY['English', 'Hindi', 'Malayalam'], 4.7, 72, true, 'verified', ARRAY['Verified'], 7, 'Web3 Labs', ARRAY['Bitcoin Trading', 'Solidity', 'DeFi Protocols']),

('Pooja Reddy', 'E-commerce & D2C Consultant', 'Built and scaled 3 D2C brands to 100 Cr+ revenue. Expert in Shopify, Amazon selling, and e-commerce operations.', ARRAY['E-commerce', 'D2C Brands', 'Shopify', 'Amazon Selling', 'Supply Chain'], 0, 'INR', 'Hyderabad, India', ARRAY['English', 'Telugu', 'Hindi'], 4.8, 113, true, 'verified', ARRAY['Top Rated', 'Verified'], 9, 'D2C Growth Partners', ARRAY['Shopify Store Setup', 'Amazon FBA', 'Brand Building']),

('Manish Tiwari', 'Immigration & Visa Consultant', 'Licensed immigration consultant. Specializes in US, Canada, UK, and Australia visas. 95% success rate on applications.', ARRAY['Immigration', 'Visa Consulting', 'Study Abroad', 'Work Permits', 'PR Applications'], 0, 'INR', 'Delhi, India', ARRAY['English', 'Hindi'], 4.9, 278, true, 'verified', ARRAY['Top Rated', 'Verified'], 12, 'Global Visa Services', ARRAY['Canada PR', 'US H1B', 'UK Student Visa']),

('Divya Agarwal', 'Event Planner & Wedding Consultant', 'Planned 200+ weddings and corporate events. Expert in destination weddings, budget planning, and vendor management.', ARRAY['Event Planning', 'Wedding Planning', 'Corporate Events', 'Vendor Management', 'Budget Planning'], 0, 'INR', 'Jaipur, India', ARRAY['English', 'Hindi', 'Rajasthani'], 4.8, 187, true, 'verified', ARRAY['Verified'], 10, 'Eventify India', ARRAY['Destination Weddings', 'Budget Weddings', 'Corporate Events']),

('Sanjay Patel', 'Agriculture & Organic Farming Expert', 'Progressive farmer with 20 acres of certified organic farm. Expert in modern farming techniques, agri-business, and farm-to-table.', ARRAY['Organic Farming', 'Agriculture', 'Agri-Business', 'Sustainable Farming', 'Hydroponics'], 0, 'INR', 'Ahmedabad, India', ARRAY['English', 'Hindi', 'Gujarati'], 4.6, 56, true, 'verified', ARRAY['Verified'], 16, 'Green Earth Farms', ARRAY['Organic Certification', 'Hydroponics Setup', 'Farm Business Plan']),

('Ritu Malhotra', 'Fashion Stylist & Image Consultant', 'Celebrity stylist with 12 years in fashion. Worked with Bollywood stars and Fortune 500 executives on personal styling.', ARRAY['Fashion Styling', 'Personal Branding', 'Wardrobe Management', 'Image Consulting', 'Color Analysis'], 0, 'INR', 'Mumbai, India', ARRAY['English', 'Hindi', 'Punjabi'], 4.7, 143, true, 'verified', ARRAY['Verified'], 12, 'Style Studio Mumbai', ARRAY['Personal Styling', 'Corporate Dressing', 'Color Theory']),

('Anand Krishnamurthy', 'Cybersecurity Expert', 'CISSP certified. Former security architect at TCS. Expert in penetration testing, security auditing, and data protection.', ARRAY['Cybersecurity', 'Penetration Testing', 'Security Auditing', 'Data Protection', 'Cloud Security'], 0, 'INR', 'Bangalore, India', ARRAY['English', 'Kannada', 'Tamil'], 4.8, 91, true, 'verified', ARRAY['Verified'], 14, 'SecureIT Consulting', ARRAY['Ethical Hacking', 'VAPT', 'SOC Setup']);

-- 7. Create storage bucket for verification documents (run in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('verification-documents', 'verification-documents', false);

-- 8. Add availability slots for dummy experts (we'll add a few for testing)
-- This will be done after we know the expert IDs

-- ============================================================================
-- Migration: 20260617000000_admin_grevya.sql
-- ============================================================================

-- Align admin access with the single administrator account: kavin@grevya.com
--
-- This migration contains NO secrets. It (1) updates the new-user trigger so the
-- admin role is granted to kavin@grevya.com on signup, and (2) backfills the
-- admin role for that account if it already exists. The account itself (and its
-- password) must be created via the Supabase dashboard or Auth Admin API so the
-- password is never committed to source control.

-- 1. Grant the admin role on signup for the designated admin email.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Assign default user role.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Promote the designated administrator.
  IF NEW.email = 'kavin@grevya.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Backfill: if the admin account already exists, ensure it has the admin role.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'kavin@grevya.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- Migration: 20260617120000_optional_verification_docs.sql
-- ============================================================================

-- Decouple the "Verified" badge from listing/approval.
--
-- Model after this change:
--   * speakers.verification_status ('pending' | 'verified' | 'rejected')
--     controls whether an expert is LISTED/active (admin approval).
--   * speakers.is_verified (boolean) is the "Verified" badge (tick mark) shown
--     to users. It is granted/revoked by an admin and is independent of listing.
--
-- Verification documents are now OPTIONAL at onboarding. Uploading them simply
-- lets an admin review and grant the Verified badge.

-- Ensure the column exists and defaults to false for new experts.
ALTER TABLE public.speakers
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- Backfill: experts that are already approved/live keep their Verified badge,
-- so the existing roster (incl. seeded experts) does not lose its tick.
UPDATE public.speakers
SET is_verified = true
WHERE verification_status = 'verified'
  AND is_verified IS DISTINCT FROM true;

-- ============================================================================
-- Migration: 20260630000000_june_functional_bug_fixes.sql
-- ============================================================================

-- June functional testing fixes: bookings, notifications, account settings, and verification documents.

ALTER TABLE public.expertise_bookings
  ADD COLUMN IF NOT EXISTS original_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS original_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_hours NUMERIC;

UPDATE public.expertise_bookings
SET
  original_scheduled_at = COALESCE(original_scheduled_at, scheduled_at, event_date),
  original_duration_minutes = COALESCE(original_duration_minutes, duration_minutes, (duration_hours * 60)::INTEGER)
WHERE original_scheduled_at IS NULL OR original_duration_minutes IS NULL;

ALTER TABLE public.expertise_bookings
  DROP CONSTRAINT IF EXISTS expertise_bookings_status_check;

ALTER TABLE public.expertise_bookings
  ADD CONSTRAINT expertise_bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded'));

CREATE INDEX IF NOT EXISTS idx_expertise_bookings_scheduled_at
  ON public.expertise_bookings(scheduled_at);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  related_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_booking_confirmed BOOLEAN DEFAULT TRUE NOT NULL,
  email_expert_application BOOLEAN DEFAULT TRUE NOT NULL,
  email_expert_approved BOOLEAN DEFAULT TRUE NOT NULL,
  in_app_notifications BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications"
      ON public.notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications"
      ON public.notifications FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notification_preferences' AND policyname = 'Users can manage own notification preferences'
  ) THEN
    CREATE POLICY "Users can manage own notification preferences"
      ON public.notification_preferences FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload own verification documents'
  ) THEN
    CREATE POLICY "Users can upload own verification documents"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'verification-documents'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can read own verification documents'
  ) THEN
    CREATE POLICY "Users can read own verification documents"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'verification-documents'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can read verification documents'
  ) THEN
    CREATE POLICY "Admins can read verification documents"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'verification-documents'
        AND public.has_role(auth.uid(), 'admin')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can read avatars'
  ) THEN
    CREATE POLICY "Anyone can read avatars"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'verification-documents'
        AND (storage.foldername(name))[2] = 'avatars'
      );
  END IF;
END $$;

-- Triggers to enforce double-booking overlap checks at the database query level (prevents race conditions)
CREATE OR REPLACE FUNCTION public.check_booking_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlap_exists BOOLEAN;
  new_start TIMESTAMPTZ;
  new_end TIMESTAMPTZ;
  new_duration_min INTEGER;
  new_expert_id UUID;
  new_id UUID;
BEGIN
  new_id := NEW.id;
  new_expert_id := NEW.expert_id;
  new_start := COALESCE(NEW.scheduled_at, NEW.event_date);
  new_duration_min := COALESCE(NEW.duration_minutes, (NEW.duration_hours * 60)::INTEGER, 60);
  new_end := new_start + (new_duration_min * INTERVAL '1 minute');

  -- Check overlaps in public.expertise_bookings
  SELECT EXISTS (
    SELECT 1 FROM public.expertise_bookings
    WHERE expert_id = new_expert_id
      AND id <> new_id
      AND status IN ('pending', 'confirmed', 'in_progress')
      AND COALESCE(scheduled_at, event_date) < new_end
      AND new_start < (COALESCE(scheduled_at, event_date) + (COALESCE(duration_minutes, (duration_hours * 60)::INTEGER, 60) * INTERVAL '1 minute'))
  ) INTO overlap_exists;

  IF NOT overlap_exists THEN
    -- Check overlaps in public.bookings
    SELECT EXISTS (
      SELECT 1 FROM public.bookings
      WHERE speaker_id = new_expert_id
        AND status IN ('pending', 'confirmed', 'in_progress')
        AND event_date < new_end
        AND new_start < (event_date + (COALESCE(duration_hours, 1) * 60 * INTERVAL '1 minute'))
    ) INTO overlap_exists;
  END IF;

  IF overlap_exists THEN
    RAISE EXCEPTION 'Double booking error: The expert is already booked for this time range.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_booking_overlap ON public.expertise_bookings;
CREATE TRIGGER trg_check_booking_overlap
BEFORE INSERT OR UPDATE ON public.expertise_bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_booking_overlap();

CREATE OR REPLACE FUNCTION public.check_legacy_booking_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlap_exists BOOLEAN;
  new_start TIMESTAMPTZ;
  new_end TIMESTAMPTZ;
  new_duration_min INTEGER;
  new_speaker_id UUID;
  new_id UUID;
BEGIN
  new_id := NEW.id;
  new_speaker_id := NEW.speaker_id;
  new_start := NEW.event_date;
  new_duration_min := COALESCE((NEW.duration_hours * 60)::INTEGER, 60);
  new_end := new_start + (new_duration_min * INTERVAL '1 minute');

  -- Check overlaps in public.bookings
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE speaker_id = new_speaker_id
      AND id <> new_id
      AND status IN ('pending', 'confirmed', 'in_progress')
      AND event_date < new_end
      AND new_start < (event_date + (COALESCE(duration_hours, 1) * 60 * INTERVAL '1 minute'))
  ) INTO overlap_exists;

  IF NOT overlap_exists THEN
    -- Check overlaps in public.expertise_bookings
    SELECT EXISTS (
      SELECT 1 FROM public.expertise_bookings
      WHERE expert_id = new_speaker_id
        AND status IN ('pending', 'confirmed', 'in_progress')
        AND COALESCE(scheduled_at, event_date) < new_end
        AND new_start < (COALESCE(scheduled_at, event_date) + (COALESCE(duration_minutes, (duration_hours * 60)::INTEGER, 60) * INTERVAL '1 minute'))
    ) INTO overlap_exists;
  END IF;

  IF overlap_exists THEN
    RAISE EXCEPTION 'Double booking error: The expert is already booked for this time range.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_legacy_booking_overlap ON public.bookings;
CREATE TRIGGER trg_check_legacy_booking_overlap
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_legacy_booking_overlap();

-- ============================================================================
-- Migration: 20260701000000_availability_overlap_trigger.sql
-- ============================================================================

-- Trigger to check for availability slot overlap/duplicates
CREATE OR REPLACE FUNCTION public.check_availability_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlap_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.availability_slots
    WHERE expert_id = NEW.expert_id
      AND id <> NEW.id
      AND day_of_week = NEW.day_of_week
      AND start_time < NEW.end_time
      AND end_time > NEW.start_time
  ) INTO overlap_exists;

  IF overlap_exists THEN
    RAISE EXCEPTION 'Duplicate availability slot: This slot overlaps with an existing availability slot.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_availability_overlap ON public.availability_slots;
CREATE TRIGGER trg_check_availability_overlap
BEFORE INSERT OR UPDATE ON public.availability_slots
FOR EACH ROW
EXECUTE FUNCTION public.check_availability_overlap();

-- ============================================================================
-- Migration: 20260708150000_fix_expertise_bookings_schema_and_triggers.sql
-- ============================================================================

-- Create a migration to fix schema compatibility and triggers
ALTER TABLE public.expertise_bookings
  ADD COLUMN IF NOT EXISTS consumer_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS original_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS original_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS expert_payout DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS consumer_notes TEXT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Triggers to enforce double-booking overlap checks at the database level
CREATE OR REPLACE FUNCTION public.check_booking_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlap_exists BOOLEAN;
  new_start TIMESTAMPTZ;
  new_end TIMESTAMPTZ;
  new_duration_min INTEGER;
  new_expert_id UUID;
  new_id UUID;
BEGIN
  -- If the booking status is not active, skip overlap checks entirely
  IF NEW.status NOT IN ('pending', 'confirmed', 'in_progress') THEN
    RETURN NEW;
  END IF;

  new_id := NEW.id;
  new_expert_id := NEW.expert_id;
  new_start := COALESCE(NEW.scheduled_at, NEW.event_date);
  
  IF new_start IS NULL THEN
    RAISE EXCEPTION 'Booking start time is required.';
  END IF;

  new_duration_min := COALESCE(NEW.duration_minutes, (NEW.duration_hours * 60)::INTEGER, 60);
  new_end := new_start + (new_duration_min * INTERVAL '1 minute');

  -- Check overlaps in public.expertise_bookings
  SELECT EXISTS (
    SELECT 1 FROM public.expertise_bookings
    WHERE expert_id = new_expert_id
      AND id <> new_id
      AND status IN ('pending', 'confirmed', 'in_progress')
      AND COALESCE(scheduled_at, event_date) < new_end
      AND new_start < (COALESCE(scheduled_at, event_date) + (COALESCE(duration_minutes, (duration_hours * 60)::INTEGER, 60) * INTERVAL '1 minute'))
  ) INTO overlap_exists;

  IF NOT overlap_exists THEN
    -- Check overlaps in public.bookings
    SELECT EXISTS (
      SELECT 1 FROM public.bookings
      WHERE speaker_id = new_expert_id
        AND status IN ('pending', 'confirmed', 'in_progress')
        AND COALESCE(event_date, scheduled_at) < new_end
        AND new_start < (COALESCE(event_date, scheduled_at) + (COALESCE(duration_hours, (duration_minutes::NUMERIC / 60.0), 1.0) * 60 * INTERVAL '1 minute'))
    ) INTO overlap_exists;
  END IF;

  IF overlap_exists THEN
    RAISE EXCEPTION 'Double booking error: The expert is already booked for this time range.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_booking_overlap ON public.expertise_bookings;
CREATE TRIGGER trg_check_booking_overlap
BEFORE INSERT OR UPDATE ON public.expertise_bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_booking_overlap();

CREATE OR REPLACE FUNCTION public.check_legacy_booking_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlap_exists BOOLEAN;
  new_start TIMESTAMPTZ;
  new_end TIMESTAMPTZ;
  new_duration_min INTEGER;
  new_speaker_id UUID;
  new_id UUID;
BEGIN
  -- If the booking status is not active, skip overlap checks entirely
  IF NEW.status NOT IN ('pending', 'confirmed', 'in_progress') THEN
    RETURN NEW;
  END IF;

  new_id := NEW.id;
  new_speaker_id := NEW.speaker_id;
  new_start := COALESCE(NEW.event_date, NEW.scheduled_at);
  
  IF new_start IS NULL THEN
    RAISE EXCEPTION 'Booking start time is required.';
  END IF;

  new_duration_min := COALESCE(NEW.duration_minutes, (NEW.duration_hours * 60)::INTEGER, 60);
  new_end := new_start + (new_duration_min * INTERVAL '1 minute');

  -- Check overlaps in public.bookings
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE speaker_id = new_speaker_id
      AND id <> new_id
      AND status IN ('pending', 'confirmed', 'in_progress')
      AND COALESCE(event_date, scheduled_at) < new_end
      AND new_start < (COALESCE(event_date, scheduled_at) + (COALESCE(duration_hours, (duration_minutes::NUMERIC / 60.0), 1.0) * 60 * INTERVAL '1 minute'))
  ) INTO overlap_exists;

  IF NOT overlap_exists THEN
    -- Check overlaps in public.expertise_bookings
    SELECT EXISTS (
      SELECT 1 FROM public.expertise_bookings
      WHERE expert_id = new_speaker_id
        AND status IN ('pending', 'confirmed', 'in_progress')
        AND COALESCE(scheduled_at, event_date) < new_end
        AND new_start < (COALESCE(scheduled_at, event_date) + (COALESCE(duration_minutes, (duration_hours * 60)::INTEGER, 60) * INTERVAL '1 minute'))
    ) INTO overlap_exists;
  END IF;

  IF overlap_exists THEN
    RAISE EXCEPTION 'Double booking error: The expert is already booked for this time range.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_legacy_booking_overlap ON public.bookings;
CREATE TRIGGER trg_check_legacy_booking_overlap
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_legacy_booking_overlap();

-- Fix foreign key constraints on availability_slots, expertise_bookings, and expertise_reviews to point to speakers table
ALTER TABLE public.availability_slots
  DROP CONSTRAINT IF EXISTS availability_slots_expert_id_fkey;

ALTER TABLE public.availability_slots
  ADD CONSTRAINT availability_slots_expert_id_fkey
  FOREIGN KEY (expert_id) REFERENCES public.speakers(id) ON DELETE CASCADE;

ALTER TABLE public.expertise_bookings
  DROP CONSTRAINT IF EXISTS expertise_bookings_expert_id_fkey;

ALTER TABLE public.expertise_bookings
  ADD CONSTRAINT expertise_bookings_expert_id_fkey
  FOREIGN KEY (expert_id) REFERENCES public.speakers(id) ON DELETE CASCADE;

ALTER TABLE public.expertise_reviews
  DROP CONSTRAINT IF EXISTS expertise_reviews_expert_id_fkey;

ALTER TABLE public.expertise_reviews
  ADD CONSTRAINT expertise_reviews_expert_id_fkey
  FOREIGN KEY (expert_id) REFERENCES public.speakers(id) ON DELETE CASCADE;

-- Make platform_fee and expert_payout nullable on expertise_bookings
ALTER TABLE public.expertise_bookings
  ALTER COLUMN platform_fee DROP NOT NULL,
  ALTER COLUMN expert_payout DROP NOT NULL;


-- ============================================================================
-- Migration: 20260708160000_add_admin_profile_policies.sql
-- ============================================================================

-- Allow admins to view, update, and delete all profiles for User Management
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete all profiles"
  ON public.profiles
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- Migration: 20260709000000_expert_reporting_system.sql
-- ============================================================================

-- Expert Reporting System Schema Migration
-- Create expert_reports table to store community-reported violations against experts

CREATE TABLE IF NOT EXISTS public.expert_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  expert_id UUID REFERENCES public.speakers(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('spam', 'abuse', 'harassment', 'misleading', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'action_taken', 'rejected')) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexing for lookup performance
CREATE INDEX IF NOT EXISTS idx_expert_reports_expert_id ON public.expert_reports(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_reports_reporter_id ON public.expert_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_expert_reports_status ON public.expert_reports(status);

-- Enable RLS
ALTER TABLE public.expert_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert own reports"
  ON public.expert_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON public.expert_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage all reports"
  ON public.expert_reports FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION public.update_expert_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_expert_reports_updated_at
  BEFORE UPDATE ON public.expert_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_expert_reports_updated_at();

-- ============================================================================
-- Migration: 20260709010000_fix_notifications_rls.sql
-- ============================================================================

-- Add INSERT policy for notifications table to allow authenticated users to create notifications
CREATE POLICY "Users can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- Migration: 20260712000000_grant_public_privileges.sql
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- ============================================================================
-- Migration: 20260712010000_fix_profiles_check_constraint.sql
-- ============================================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check CHECK (user_type = ANY (ARRAY['consumer'::text, 'expert'::text, 'both'::text, 'admin'::text, 'suspended'::text]));

-- ============================================================================
-- Migration: 20260712020000_sync_profile_roles.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_profile_to_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.user_type = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NEW.user_type <> 'admin' AND NEW.email <> 'kavin@grevya.com' THEN
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id AND role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_profile_to_user_roles
  AFTER UPDATE OF user_type OR INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_user_roles();

-- ============================================================================
-- Migration: 20260712030000_fix_storage_admin_policy.sql
-- ============================================================================

DROP POLICY IF EXISTS "Admins can read verification documents" ON storage.objects;
CREATE POLICY "Admins can read verification documents" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'verification-documents'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- ============================================================================
-- Migration: 20260712040000_create_avatars_bucket.sql
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;
CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
CREATE POLICY "Users can upload own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- ============================================================================
-- Migration: 20260716000000_expert_suspension_system.sql
-- ============================================================================

-- Add suspension columns to the speakers table to support ADMIN-6
ALTER TABLE public.speakers 
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_history JSONB DEFAULT '[]'::jsonb;

-- Add INSERT RLS policy to public.notification_preferences to fix SET-5
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notification_preferences' AND policyname = 'Users can insert own preferences'
  ) THEN
    CREATE POLICY "Users can insert own preferences"
      ON public.notification_preferences FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- Migration: 20260723000000_lock_pending_expert_profile.sql
-- ============================================================================

-- Prevent non-admin users from updating their speaker profile when its verification_status is 'pending'
CREATE OR REPLACE FUNCTION public.check_pending_speaker_profile_lock()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.verification_status = 'pending' AND NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Your profile is under review. Editing is temporarily disabled until verification completes.'
      USING ERRCODE = '40300';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_pending_speaker_profile_lock ON public.speakers;

CREATE TRIGGER enforce_pending_speaker_profile_lock
BEFORE UPDATE ON public.speakers
FOR EACH ROW
EXECUTE FUNCTION public.check_pending_speaker_profile_lock();

-- ============================================================================
-- Migration: 20260728180000_production_bugs_fixes_and_validation.sql
-- ============================================================================

-- Migration: 20260728180000_production_bugs_fixes_and_validation.sql
-- Production database validation, avatar synchronization, and booking integrity triggers.

-- 1. Database trigger to automatically sync avatar_url from profiles to speakers table
CREATE OR REPLACE FUNCTION public.sync_profile_avatar_to_speaker()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.avatar_url IS NOT NULL AND NEW.avatar_url <> COALESCE(OLD.avatar_url, '') THEN
    UPDATE public.speakers
    SET 
      image_url = NEW.avatar_url,
      profile_photo_url = NEW.avatar_url,
      updated_at = NOW()
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_avatar_to_speaker ON public.profiles;
CREATE TRIGGER trg_sync_profile_avatar_to_speaker
  AFTER UPDATE OF avatar_url ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_avatar_to_speaker();

-- 2. PostgreSQL function to validate expertise areas and phone at DB level
CREATE OR REPLACE FUNCTION public.validate_expert_data_db()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate phone if present
  IF NEW.phone IS NOT NULL AND NEW.phone <> '' THEN
    IF NOT (NEW.phone ~ '^\+?[1-9]\d{7,14}$') AND NOT (NEW.phone ~ '^[6-9]\d{9}$') THEN
      RAISE EXCEPTION 'Invalid phone number format: %', NEW.phone;
    END IF;
  END IF;

  -- Validate title if present
  IF NEW.title IS NOT NULL AND NEW.title <> '' THEN
    IF NEW.title ~ '^[0-9\s\-_, .()]+$' THEN
      RAISE EXCEPTION 'Professional title cannot be numeric-only: %', NEW.title;
    END IF;
    IF NEW.title ~* '(<script|javascript:|DROP TABLE|DELETE FROM|SELECT \*|--)' THEN
      RAISE EXCEPTION 'Invalid content in professional title: %', NEW.title;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_expert_data_db ON public.speakers;
CREATE TRIGGER trg_validate_expert_data_db
  BEFORE INSERT OR UPDATE ON public.speakers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_expert_data_db();

-- ============================================================================
-- Migration: 20260728193000_update_kavin_admin_credentials.sql
-- ============================================================================

-- Migration: 20260728193000_update_kavin_admin_credentials.sql
-- Fixes admin login for kavin@grevya.com with password Grevya@2026

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ensure user_type in profiles is set to admin for kavin@grevya.com
UPDATE public.profiles 
SET 
  user_type = 'admin',
  full_name = 'Kavin N R',
  updated_at = NOW()
WHERE email = 'kavin@grevya.com';

-- 2. Ensure auth.users has confirmed email and password hash set for Grevya@2026
UPDATE auth.users 
SET 
  encrypted_password = crypt('Grevya@2026', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'kavin@grevya.com';

-- ============================================================================
-- Migration: 20260802000000_restrict_public_profile_reads.sql
-- ============================================================================

-- Stop exposing every user's email, phone and full name to anonymous visitors.
--
-- 20250922000000_expertise_marketplace_schema.sql created:
--   CREATE POLICY "Public profiles are viewable by everyone"
--     ON public.profiles FOR SELECT USING (true);
--
-- With that in place, `GET /rest/v1/profiles?select=email,phone,full_name`
-- returns the entire user table to anyone holding the anon key (which ships in
-- the browser bundle). Verified against the live project.
--
-- RLS policies are OR'ed, so dropping this one leaves the access the app
-- actually relies on intact:
--   * "Users can view own profile"  -> auth.uid() = id
--     (20250921102746_b90ecc85-76ac-432c-b230-dd48ef6c28cf.sql)
--   * "Admins can view all profiles" -> public.is_admin()
--     (20260708160000_add_admin_profile_policies.sql)
--
-- Audited callers of public.profiles before writing this: AuthProvider,
-- Settings, ExpertOnboarding, userUtils and lib/auth all read only the signed-in
-- user's own row; every cross-user read (UserManagement, PlatformModeration,
-- ExpertApproval, AnalyticsDashboard, AdminDashboard) is admin-only and covered
-- by is_admin(). The single non-admin cross-user reader, components/ReviewList,
-- is not imported anywhere and renders nowhere in the app.

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- ============================================================================
-- Migration: 20260803000000_booking_status_and_stats_fixes.sql
-- ============================================================================

-- Fixes for defects that cannot be closed in application code alone.
-- From the PR #58/#59 and PR #62 verification reports.
--
--   BOOK-4    "No Show" fails from every surface with a generic error.
--   BOOK-5    A session can be marked completed before it starts, which frees
--             the slot and bypasses trg_check_booking_overlap.
--   ADMIN-14  A finished session can be moved back to "pending".
--   STATS-1   Completed sessions and reviews never reach speakers.rating /
--             speakers.past_events / expert_stats.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- BOOK-4 — 'no_show' was never a permitted status.
--
-- 20260630000000_june_functional_bug_fixes.sql set:
--   CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled','refunded'))
-- while the UI (Expert Dashboard, Admin Panel, Admin Booking View) and
-- 20260419000000's stats all write 'no_show'. Every attempt violated the
-- constraint, which is why it failed identically from all three surfaces.
-- ---------------------------------------------------------------------------
ALTER TABLE public.expertise_bookings
  DROP CONSTRAINT IF EXISTS expertise_bookings_status_check;

ALTER TABLE public.expertise_bookings
  ADD CONSTRAINT expertise_bookings_status_check
  CHECK (status IN (
    'pending', 'confirmed', 'in_progress', 'completed',
    'cancelled', 'no_show', 'refunded'
  ));

-- ---------------------------------------------------------------------------
-- BOOK-5 / ADMIN-14 — enforce the status timing rules in the database.
--
-- The app now guards these (src/lib/bookingRules.ts), but the guard must also
-- exist here: the Admin panel, any future client, and direct REST calls all
-- write this column. BOOK-5 is a data-integrity issue (a falsely completed
-- session releases its slot), so it cannot rely on client code.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_booking_status_timing()
RETURNS TRIGGER AS $$
DECLARE
  start_at TIMESTAMPTZ;
  duration_min INTEGER;
  end_at TIMESTAMPTZ;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  start_at := COALESCE(NEW.scheduled_at, NEW.event_date);
  IF start_at IS NULL THEN
    RETURN NEW;
  END IF;

  duration_min := COALESCE(NEW.duration_minutes, (NEW.duration_hours * 60)::INTEGER, 60);
  end_at := start_at + (duration_min * INTERVAL '1 minute');

  -- BOOK-5: completing before the start time falsifies the record and, because
  -- trg_check_booking_overlap only blocks pending/confirmed/in_progress, hands
  -- the slot back out for a second booking.
  IF NEW.status = 'completed' AND start_at > now() THEN
    RAISE EXCEPTION
      'A session cannot be marked completed before its start time (starts %).', start_at
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.status = 'no_show' AND start_at > now() THEN
    RAISE EXCEPTION
      'A session cannot be marked as a no-show before its start time (starts %).', start_at
      USING ERRCODE = 'check_violation';
  END IF;

  -- ADMIN-14: reviving a finished session as pending creates inconsistent
  -- historical data and re-blocks the slot.
  IF NEW.status = 'pending' AND end_at <= now() THEN
    RAISE EXCEPTION
      'A session that finished at % cannot be moved back to pending.', end_at
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_booking_status_timing ON public.expertise_bookings;
CREATE TRIGGER trg_enforce_booking_status_timing
BEFORE UPDATE ON public.expertise_bookings
FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_status_timing();

-- ---------------------------------------------------------------------------
-- STATS-1 — nothing aggregated completed sessions or reviews into the fields
-- the dashboards read, so an expert with 13 bookings / 4 completed / 2 reviews
-- showed "0 sessions", "0.0" rating and "No stats available yet".
--
-- These recompute from source rather than incrementing, so they are idempotent
-- and self-healing after any manual data edit.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_expert_stats(target_expert_id UUID)
RETURNS VOID AS $$
DECLARE
  completed_count   INTEGER := 0;
  no_show_count_v   INTEGER := 0;
  cancelled_count_v INTEGER := 0;
  total_count       INTEGER := 0;
  avg_rating_v      NUMERIC := 0;
  review_count_v    INTEGER := 0;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'no_show'),
    COUNT(*) FILTER (WHERE status = 'cancelled'),
    COUNT(*)
  INTO completed_count, no_show_count_v, cancelled_count_v, total_count
  FROM public.expertise_bookings
  WHERE expert_id = target_expert_id;

  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO avg_rating_v, review_count_v
  FROM public.reviews
  WHERE speaker_id = target_expert_id AND rating IS NOT NULL;

  -- Public profile fields (what /expert/:id and the booking widget read).
  UPDATE public.speakers
  SET rating      = ROUND(avg_rating_v, 1),
      past_events = completed_count,
      updated_at  = now()
  WHERE id = target_expert_id;

  -- expert_stats powers the Stats & Badges tab and the leaderboard.
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'expert_stats') THEN
    INSERT INTO public.expert_stats AS es (
      expert_id, total_sessions, completed_sessions, no_show_count,
      cancellation_count, attendance_rate, total_reviews, avg_rating
    )
    VALUES (
      target_expert_id, total_count, completed_count, no_show_count_v,
      cancelled_count_v,
      CASE WHEN (completed_count + no_show_count_v) > 0
           THEN ROUND((completed_count::NUMERIC / (completed_count + no_show_count_v)) * 100)
           ELSE 100 END,
      review_count_v, ROUND(avg_rating_v, 1)
    )
    ON CONFLICT (expert_id) DO UPDATE SET
      total_sessions     = EXCLUDED.total_sessions,
      completed_sessions = EXCLUDED.completed_sessions,
      no_show_count      = EXCLUDED.no_show_count,
      cancellation_count = EXCLUDED.cancellation_count,
      attendance_rate    = EXCLUDED.attendance_rate,
      total_reviews      = EXCLUDED.total_reviews,
      avg_rating         = EXCLUDED.avg_rating;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recompute whenever a booking's status changes.
CREATE OR REPLACE FUNCTION public.trg_recalc_stats_from_booking()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalculate_expert_stats(COALESCE(NEW.expert_id, OLD.expert_id));
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_booking_stats_sync ON public.expertise_bookings;
CREATE TRIGGER trg_booking_stats_sync
AFTER INSERT OR UPDATE OF status OR DELETE ON public.expertise_bookings
FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_stats_from_booking();

-- Recompute whenever a review lands.
CREATE OR REPLACE FUNCTION public.trg_recalc_stats_from_review()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalculate_expert_stats(COALESCE(NEW.speaker_id, OLD.speaker_id));
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_review_stats_sync ON public.reviews;
CREATE TRIGGER trg_review_stats_sync
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_stats_from_review();

-- Backfill every expert once, so existing completed sessions and reviews stop
-- displaying as zero.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.speakers LOOP
    PERFORM public.recalculate_expert_stats(r.id);
  END LOOP;
END $$;

-- ============================================================================
-- delete_account() — in-database replacement for the removed `delete-account`
-- edge function. Deletes the caller's own account, or any account when the
-- caller has the admin role, then removes the auth.users row itself.
--
-- SECURITY DEFINER is required to delete from auth.users; the function is
-- locked down accordingly: EXECUTE revoked from PUBLIC/anon, caller identity
-- re-checked in the body, empty search_path with fully qualified names.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.delete_account(target_user_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := auth.uid();
  target_id uuid;
  target_email text;
  v_speaker_id uuid;
  rec record;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  target_id := COALESCE(delete_account.target_user_id, caller_id);

  IF target_id <> caller_id
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = caller_id AND role = 'admin'
     ) THEN
    RAISE EXCEPTION 'Only admins can delete other users';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  SELECT email INTO target_email FROM auth.users WHERE id = target_id;
  SELECT id INTO v_speaker_id FROM public.speakers WHERE user_id = target_id LIMIT 1;

  -- Dependent rows, in FK-safe order. Each (table, column) pair is verified
  -- against information_schema and failures are downgraded to warnings, so the
  -- function tolerates schema drift exactly like the old edge function's
  -- safeDelete helper. The final auth.users delete is the hard gate: anything
  -- still referencing the user without ON DELETE CASCADE will surface there.
  FOR rec IN
    SELECT * FROM (VALUES
      ('notifications',            'user_id',      target_id::text),
      ('notification_preferences', 'user_id',      target_id::text),
      ('user_profiles',            'user_id',      target_id::text),
      ('user_roles',               'user_id',      target_id::text),
      ('guest_profiles',           'email',        target_email),
      ('expertise_messages',       'sender_id',    target_id::text),
      ('expertise_reviews',        'reviewer_id',  target_id::text),
      ('reviews',                  'reviewer_id',  target_id::text),
      ('expert_reports',           'reporter_id',  target_id::text),
      ('achievements',             'speaker_id',   v_speaker_id::text),
      ('expertise_reviews',        'expert_id',    v_speaker_id::text),
      ('reviews',                  'speaker_id',   v_speaker_id::text),
      ('testimonials',             'speaker_id',   v_speaker_id::text),
      ('verification_requests',    'speaker_id',   v_speaker_id::text),
      ('availability_slots',       'expert_id',    v_speaker_id::text),
      ('speaker_availability',     'speaker_id',   v_speaker_id::text),
      ('speaker_categories',       'expert_id',    v_speaker_id::text),
      ('expert_reports',           'expert_id',    v_speaker_id::text),
      ('expertise_bookings',       'expert_id',    v_speaker_id::text),
      ('bookings',                 'speaker_id',   v_speaker_id::text),
      ('bookings',                 'expert_id',    v_speaker_id::text),
      ('expertise_bookings',       'user_id',      target_id::text),
      ('expertise_bookings',       'consumer_id',  target_id::text),
      ('bookings',                 'seeker_id',    target_id::text),
      ('bookings',                 'organizer_id', target_id::text),
      ('speakers',                 'user_id',      target_id::text),
      ('expert_profiles',          'user_id',      target_id::text),
      ('profiles',                 'id',           target_id::text)
    ) AS t(tbl, col, val)
  LOOP
    IF rec.val IS NOT NULL AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = rec.tbl
        AND column_name = rec.col
    ) THEN
      BEGIN
        EXECUTE format('DELETE FROM public.%I WHERE %I = %L', rec.tbl, rec.col, rec.val);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'delete_account: skipping %.% (%)', rec.tbl, rec.col, SQLERRM;
      END;
    END IF;
  END LOOP;

  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_account(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_account(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_account(uuid) TO authenticated;
