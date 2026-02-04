
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
