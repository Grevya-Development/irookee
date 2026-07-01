-- =============================================
-- IROOKEE SEED DATA
-- Matches actual Supabase schema exactly
-- =============================================

-- 1. ADD MISSING COLUMNS TO SPEAKERS
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS verification_documents jsonb DEFAULT '{}';
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS badges text[];
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS topics text[];

-- 2. ADD MISSING COLUMNS TO PROFILES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. ADD MISSING COLUMNS TO EXPERTISE_BOOKINGS
ALTER TABLE expertise_bookings ADD COLUMN IF NOT EXISTS meeting_link text;

-- 4. ADD DESCRIPTION TO CATEGORIES
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description text;

-- 5. CREATE SPEAKER_CATEGORIES JUNCTION TABLE
CREATE TABLE IF NOT EXISTS public.speaker_categories (
  speaker_id uuid NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (speaker_id, category_id)
);

-- 6. CREATE VERIFICATION_REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  speaker_id uuid REFERENCES public.speakers(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now() NOT NULL,
  reviewed_at timestamptz,
  documents jsonb DEFAULT '{}',
  notes text
);

-- 7. CREATE REVIEWS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid,
  reviewer_id uuid REFERENCES auth.users(id),
  speaker_id uuid REFERENCES public.speakers(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 8. AVAILABILITY SLOTS RLS
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view availability" ON availability_slots;
CREATE POLICY "Anyone can view availability" ON availability_slots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Experts can manage availability" ON availability_slots;
CREATE POLICY "Experts can manage availability" ON availability_slots FOR ALL USING (
  expert_id IN (SELECT id FROM speakers WHERE user_id = auth.uid())
);

-- SPEAKER_CATEGORIES RLS
ALTER TABLE speaker_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view speaker_categories" ON speaker_categories;
CREATE POLICY "Anyone can view speaker_categories" ON speaker_categories FOR SELECT USING (true);

-- VERIFICATION_REQUESTS RLS
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view verification_requests" ON verification_requests;
CREATE POLICY "Anyone can view verification_requests" ON verification_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert verification_requests" ON verification_requests;
CREATE POLICY "Users can insert verification_requests" ON verification_requests FOR INSERT WITH CHECK (true);

-- REVIEWS RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);

-- EXPERTISE_BOOKINGS RLS (ensure)
ALTER TABLE expertise_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own bookings" ON expertise_bookings;
CREATE POLICY "Users can view own bookings" ON expertise_bookings FOR SELECT USING (
  user_id = auth.uid() OR expert_id IN (SELECT id FROM speakers WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can insert bookings" ON expertise_bookings;
CREATE POLICY "Users can insert bookings" ON expertise_bookings FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own bookings" ON expertise_bookings;
CREATE POLICY "Users can update own bookings" ON expertise_bookings FOR UPDATE USING (
  user_id = auth.uid() OR expert_id IN (SELECT id FROM speakers WHERE user_id = auth.uid())
);

-- PROFILES RLS (ensure)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- SPEAKERS RLS (ensure)
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view speakers" ON speakers;
CREATE POLICY "Anyone can view speakers" ON speakers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert speakers" ON speakers;
CREATE POLICY "Users can insert speakers" ON speakers FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own speaker" ON speakers;
CREATE POLICY "Users can update own speaker" ON speakers FOR UPDATE USING (user_id = auth.uid());

-- CATEGORIES RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);

-- 9. CLEAR AND INSERT CATEGORIES
DELETE FROM speaker_categories;
DELETE FROM categories;

INSERT INTO categories (id, name, description, icon) VALUES
  (gen_random_uuid(), 'Finance & Accounting', 'Financial planning, investment strategy, tax advisory', 'DollarSign'),
  (gen_random_uuid(), 'Startup & Entrepreneurship', 'Business ideation, fundraising, scaling, startup mentorship', 'Rocket'),
  (gen_random_uuid(), 'Marketing & Growth', 'Digital marketing, SEO, content strategy, growth hacking', 'TrendingUp'),
  (gen_random_uuid(), 'Tourism & Travel Guide', 'Travel planning, local guides, cultural experiences', 'Plane'),
  (gen_random_uuid(), 'Technology & Engineering', 'Software development, AI/ML, cloud architecture', 'Code'),
  (gen_random_uuid(), 'Design & Creative', 'UI/UX design, graphic design, product design', 'Palette'),
  (gen_random_uuid(), 'Health & Wellness', 'Nutrition, fitness, mental health, yoga, wellness', 'Heart'),
  (gen_random_uuid(), 'Education & Tutoring', 'Academic tutoring, exam prep, language learning', 'BookOpen'),
  (gen_random_uuid(), 'Legal & Compliance', 'Legal advisory, contract review, compliance', 'Scale'),
  (gen_random_uuid(), 'Real Estate', 'Property investment, home buying, real estate strategy', 'Home'),
  (gen_random_uuid(), 'Career & HR', 'Resume review, interview prep, career coaching', 'Briefcase'),
  (gen_random_uuid(), 'Product Management', 'Product strategy, roadmap planning, user research', 'Layout'),
  (gen_random_uuid(), 'Data Science & Analytics', 'Data analysis, ML, business intelligence', 'BarChart'),
  (gen_random_uuid(), 'Sales & Business Development', 'Sales strategy, lead generation, partnerships', 'Handshake'),
  (gen_random_uuid(), 'Content & Media', 'Content creation, podcasting, video production', 'Film'),
  (gen_random_uuid(), 'Supply Chain & Operations', 'Logistics, supply chain, operations management', 'Truck'),
  (gen_random_uuid(), 'Agriculture & Farming', 'Farming techniques, agri-business, organic farming', 'Leaf'),
  (gen_random_uuid(), 'Music & Performing Arts', 'Music lessons, vocal training, acting, dance', 'Music'),
  (gen_random_uuid(), 'Photography & Videography', 'Photography, videography, editing', 'Camera'),
  (gen_random_uuid(), 'Sports & Fitness Coaching', 'Personal training, sports coaching', 'Dumbbell'),
  (gen_random_uuid(), 'Cooking & Culinary Arts', 'Cooking classes, recipe development', 'ChefHat'),
  (gen_random_uuid(), 'Fashion & Styling', 'Personal styling, fashion consulting', 'Shirt'),
  (gen_random_uuid(), 'Mental Health & Therapy', 'Counseling, therapy, stress management', 'Brain'),
  (gen_random_uuid(), 'Blockchain & Crypto', 'Cryptocurrency, blockchain, DeFi, Web3', 'Link'),
  (gen_random_uuid(), 'E-commerce & Retail', 'Online store setup, marketplace strategy', 'ShoppingCart'),
  (gen_random_uuid(), 'Architecture & Interior Design', 'Building design, interior decoration', 'Building'),
  (gen_random_uuid(), 'Sustainability & Environment', 'Green business, environmental consulting', 'TreePine'),
  (gen_random_uuid(), 'Immigration & Visa', 'Visa guidance, immigration consulting', 'Globe'),
  (gen_random_uuid(), 'Public Speaking & Communication', 'Presentation skills, speech coaching', 'Mic'),
  (gen_random_uuid(), 'Parenting & Family', 'Parenting advice, family counseling', 'Users'),
  (gen_random_uuid(), 'Insurance & Risk Management', 'Insurance advisory, risk assessment', 'Shield'),
  (gen_random_uuid(), 'Astrology & Spiritual Guidance', 'Astrology, spiritual counseling, meditation', 'Sparkles'),
  (gen_random_uuid(), 'Event Planning & Management', 'Wedding planning, corporate events', 'CalendarDays'),
  (gen_random_uuid(), 'Gaming & Esports', 'Game coaching, esports strategy', 'Gamepad2'),
  (gen_random_uuid(), 'Pet Care & Veterinary', 'Pet training, animal care', 'PawPrint'),
  (gen_random_uuid(), 'Government & Public Policy', 'Policy consulting, government relations', 'Landmark'),
  (gen_random_uuid(), 'Non-Profit & Social Impact', 'NGO management, fundraising, social enterprise', 'HeartHandshake'),
  (gen_random_uuid(), 'Language & Translation', 'Translation, language tutoring, localization', 'Languages'),
  (gen_random_uuid(), 'Cybersecurity', 'Security auditing, penetration testing, data protection', 'ShieldCheck'),
  (gen_random_uuid(), 'Automotive & Mechanics', 'Car buying advice, vehicle maintenance', 'Car');

-- 10. CLEAR OLD DUMMY EXPERTS (only those without user_id i.e. seeded ones)
DELETE FROM availability_slots WHERE expert_id IN (SELECT id FROM speakers WHERE user_id IS NULL);
DELETE FROM speaker_categories WHERE speaker_id IN (SELECT id FROM speakers WHERE user_id IS NULL);
DELETE FROM speakers WHERE user_id IS NULL;

-- 11. INSERT DUMMY EXPERTS
INSERT INTO speakers (name, title, bio, expertise, expertise_areas, hourly_rate, currency, location, languages, rating, past_events, is_verified, verification_status, badges, experience_years, company, topics) VALUES
('Priya Sharma', 'Startup Mentor & Angel Investor', 'Serial entrepreneur with 3 successful exits. Passionate about helping early-stage startups find product-market fit and raise funding. Former VP at Flipkart.', ARRAY['Startups', 'Fundraising', 'Product Strategy', 'Business Planning'], ARRAY['Startups', 'Fundraising', 'Product Strategy', 'Business Planning'], 0, 'INR', 'Bangalore, India', ARRAY['English', 'Hindi', 'Kannada'], 4.9, 127, true, 'verified', ARRAY['Top Rated', 'Verified'], 15, 'Angel Network India', ARRAY['Seed Funding', 'Pitch Decks', 'Market Research']),

('Rahul Verma', 'Digital Marketing Strategist', 'Google-certified marketer with expertise in SEO, SEM, and social media growth. Helped 200+ businesses scale their online presence.', ARRAY['Digital Marketing', 'SEO', 'Social Media', 'Content Strategy', 'Growth Hacking'], ARRAY['Digital Marketing', 'SEO', 'Social Media', 'Content Strategy', 'Growth Hacking'], 0, 'INR', 'Mumbai, India', ARRAY['English', 'Hindi', 'Marathi'], 4.7, 89, true, 'verified', ARRAY['Verified'], 8, 'GrowthLab Digital', ARRAY['SEO Strategy', 'Facebook Ads', 'Instagram Growth']),

('Dr. Ananya Iyer', 'Financial Advisor & Wealth Manager', 'CFA and CFP certified. 12 years of experience in personal finance, mutual funds, and retirement planning.', ARRAY['Personal Finance', 'Investment Planning', 'Tax Advisory', 'Retirement Planning', 'Mutual Funds'], ARRAY['Personal Finance', 'Investment Planning', 'Tax Advisory', 'Retirement Planning', 'Mutual Funds'], 0, 'INR', 'Chennai, India', ARRAY['English', 'Tamil', 'Hindi'], 4.8, 203, true, 'verified', ARRAY['Top Rated', 'Verified'], 12, 'WealthFirst Advisors', ARRAY['Mutual Funds', 'Tax Saving', 'SIP Planning']),

('Arjun Mehta', 'Full-Stack Developer & Tech Lead', 'Ex-Google engineer. Specializes in React, Node.js, and cloud architecture. Built products used by millions.', ARRAY['Web Development', 'React', 'Node.js', 'System Design', 'Cloud Architecture'], ARRAY['Web Development', 'React', 'Node.js', 'System Design', 'Cloud Architecture'], 0, 'INR', 'Hyderabad, India', ARRAY['English', 'Hindi', 'Telugu'], 4.9, 156, true, 'verified', ARRAY['Top Rated', 'Verified'], 10, 'Independent Consultant', ARRAY['React Best Practices', 'Microservices', 'AWS']),

('Sneha Kapoor', 'Travel Guide & Tourism Consultant', 'Visited 45+ countries. Expert in budget travel, solo female travel, and cultural experiences. Popular travel blog with 500K+ followers.', ARRAY['Travel Planning', 'Budget Travel', 'Solo Travel', 'Cultural Tourism', 'Adventure Travel'], ARRAY['Travel Planning', 'Budget Travel', 'Solo Travel', 'Cultural Tourism', 'Adventure Travel'], 0, 'INR', 'Delhi, India', ARRAY['English', 'Hindi', 'French'], 4.6, 78, true, 'verified', ARRAY['Verified'], 7, 'Wanderlust Travels', ARRAY['Budget Backpacking', 'Europe Travel', 'Southeast Asia']),

('Vikram Singh', 'Career Coach & HR Consultant', 'Former Head of HR at Infosys. Specializes in resume building, interview preparation, and career transitions.', ARRAY['Career Coaching', 'Resume Building', 'Interview Prep', 'Leadership Development', 'HR Strategy'], ARRAY['Career Coaching', 'Resume Building', 'Interview Prep', 'Leadership Development', 'HR Strategy'], 0, 'INR', 'Pune, India', ARRAY['English', 'Hindi', 'Punjabi'], 4.8, 312, true, 'verified', ARRAY['Top Rated', 'Verified'], 18, 'CareerBoost Consulting', ARRAY['Interview Skills', 'Resume Writing', 'LinkedIn Optimization']),

('Dr. Meera Nair', 'Nutrition & Wellness Coach', 'PhD in Clinical Nutrition. Certified yoga instructor. Specializes in holistic health, weight management.', ARRAY['Nutrition', 'Weight Management', 'Sports Nutrition', 'Yoga', 'Holistic Health'], ARRAY['Nutrition', 'Weight Management', 'Sports Nutrition', 'Yoga', 'Holistic Health'], 0, 'INR', 'Kochi, India', ARRAY['English', 'Malayalam', 'Hindi'], 4.7, 145, true, 'verified', ARRAY['Verified'], 9, 'Holistic Wellness Center', ARRAY['Diet Planning', 'Yoga for Beginners', 'Ayurvedic Nutrition']),

('Karthik Rajan', 'UI/UX Designer & Creative Director', 'Award-winning designer. Former design lead at Swiggy. Expertise in product design and design systems.', ARRAY['UI/UX Design', 'Product Design', 'Design Systems', 'User Research', 'Figma'], ARRAY['UI/UX Design', 'Product Design', 'Design Systems', 'User Research', 'Figma'], 0, 'INR', 'Bangalore, India', ARRAY['English', 'Tamil', 'Hindi'], 4.9, 92, true, 'verified', ARRAY['Top Rated', 'Verified'], 11, 'DesignCraft Studios', ARRAY['Figma Mastery', 'Design Thinking', 'Mobile App Design']),

('Amrita Desai', 'Legal Advisor & Corporate Lawyer', '15 years of corporate law. Specializes in startup legal, contract drafting, and IP protection.', ARRAY['Corporate Law', 'Startup Legal', 'Contract Drafting', 'IP Protection', 'Compliance'], ARRAY['Corporate Law', 'Startup Legal', 'Contract Drafting', 'IP Protection', 'Compliance'], 0, 'INR', 'Mumbai, India', ARRAY['English', 'Hindi', 'Gujarati'], 4.8, 167, true, 'verified', ARRAY['Verified'], 15, 'Desai & Associates', ARRAY['Startup Incorporation', 'Term Sheets', 'GDPR Compliance']),

('Rohan Gupta', 'Data Scientist & AI Researcher', 'PhD in ML from IIT Delhi. 8 years in data science. Built ML pipelines processing billions of data points.', ARRAY['Data Science', 'Machine Learning', 'Python', 'Deep Learning', 'NLP'], ARRAY['Data Science', 'Machine Learning', 'Python', 'Deep Learning', 'NLP'], 0, 'INR', 'Gurgaon, India', ARRAY['English', 'Hindi'], 4.7, 88, true, 'verified', ARRAY['Verified'], 8, 'AI Research Labs', ARRAY['Python for Data Science', 'TensorFlow', 'NLP Applications']),

('Lakshmi Krishnan', 'Public Speaking Coach', 'TEDx speaker and communication trainer. Coached 500+ professionals on public speaking and storytelling.', ARRAY['Public Speaking', 'Storytelling', 'Executive Presence', 'Communication Skills'], ARRAY['Public Speaking', 'Storytelling', 'Executive Presence', 'Communication Skills'], 0, 'INR', 'Chennai, India', ARRAY['English', 'Tamil', 'Hindi'], 4.9, 234, true, 'verified', ARRAY['Top Rated', 'Verified'], 14, 'SpeakWell Academy', ARRAY['TED-style Talks', 'Storytelling Techniques', 'Stage Presence']),

('Aditya Joshi', 'Real Estate Investment Advisor', 'Former HDFC executive. Expert in property investment, home loans, and real estate market analysis.', ARRAY['Real Estate', 'Property Investment', 'Home Loans', 'Market Analysis'], ARRAY['Real Estate', 'Property Investment', 'Home Loans', 'Market Analysis'], 0, 'INR', 'Mumbai, India', ARRAY['English', 'Hindi', 'Marathi'], 4.6, 98, true, 'verified', ARRAY['Verified'], 13, 'PropWealth Advisors', ARRAY['First Home Buying', 'REITs', 'Property Valuation']),

('Neha Bhatt', 'Content Creator & Social Media Expert', '1M+ followers across platforms. Expert in personal branding and content monetization.', ARRAY['Content Creation', 'Social Media', 'Personal Branding', 'YouTube', 'Instagram'], ARRAY['Content Creation', 'Social Media', 'Personal Branding', 'YouTube', 'Instagram'], 0, 'INR', 'Delhi, India', ARRAY['English', 'Hindi'], 4.5, 67, true, 'verified', ARRAY['Verified'], 6, 'Creative Labs', ARRAY['YouTube Growth', 'Instagram Reels', 'Content Monetization']),

('Suresh Menon', 'Blockchain & Crypto Advisor', 'Early Bitcoin adopter. Expert in DeFi, NFTs, and Web3 development.', ARRAY['Blockchain', 'Cryptocurrency', 'DeFi', 'NFTs', 'Web3'], ARRAY['Blockchain', 'Cryptocurrency', 'DeFi', 'NFTs', 'Web3'], 0, 'INR', 'Bangalore, India', ARRAY['English', 'Hindi', 'Malayalam'], 4.7, 72, true, 'verified', ARRAY['Verified'], 7, 'Web3 Labs', ARRAY['Bitcoin Trading', 'Solidity', 'DeFi Protocols']),

('Pooja Reddy', 'E-commerce & D2C Consultant', 'Built and scaled 3 D2C brands to 100 Cr+ revenue. Expert in Shopify, Amazon selling.', ARRAY['E-commerce', 'D2C Brands', 'Shopify', 'Amazon Selling', 'Supply Chain'], ARRAY['E-commerce', 'D2C Brands', 'Shopify', 'Amazon Selling', 'Supply Chain'], 0, 'INR', 'Hyderabad, India', ARRAY['English', 'Telugu', 'Hindi'], 4.8, 113, true, 'verified', ARRAY['Top Rated', 'Verified'], 9, 'D2C Growth Partners', ARRAY['Shopify Store Setup', 'Amazon FBA', 'Brand Building']),

('Manish Tiwari', 'Immigration & Visa Consultant', 'Licensed immigration consultant. Specializes in US, Canada, UK, and Australia visas. 95% success rate.', ARRAY['Immigration', 'Visa Consulting', 'Study Abroad', 'Work Permits', 'PR Applications'], ARRAY['Immigration', 'Visa Consulting', 'Study Abroad', 'Work Permits', 'PR Applications'], 0, 'INR', 'Delhi, India', ARRAY['English', 'Hindi'], 4.9, 278, true, 'verified', ARRAY['Top Rated', 'Verified'], 12, 'Global Visa Services', ARRAY['Canada PR', 'US H1B', 'UK Student Visa']),

('Divya Agarwal', 'Event Planner & Wedding Consultant', 'Planned 200+ weddings and corporate events. Expert in destination weddings.', ARRAY['Event Planning', 'Wedding Planning', 'Corporate Events', 'Vendor Management'], ARRAY['Event Planning', 'Wedding Planning', 'Corporate Events', 'Vendor Management'], 0, 'INR', 'Jaipur, India', ARRAY['English', 'Hindi'], 4.8, 187, true, 'verified', ARRAY['Verified'], 10, 'Eventify India', ARRAY['Destination Weddings', 'Budget Weddings', 'Corporate Events']),

('Sanjay Patel', 'Agriculture & Organic Farming Expert', 'Progressive farmer with 20 acres organic farm. Expert in modern farming techniques.', ARRAY['Organic Farming', 'Agriculture', 'Agri-Business', 'Sustainable Farming'], ARRAY['Organic Farming', 'Agriculture', 'Agri-Business', 'Sustainable Farming'], 0, 'INR', 'Ahmedabad, India', ARRAY['English', 'Hindi', 'Gujarati'], 4.6, 56, true, 'verified', ARRAY['Verified'], 16, 'Green Earth Farms', ARRAY['Organic Certification', 'Hydroponics Setup', 'Farm Business Plan']),

('Ritu Malhotra', 'Fashion Stylist & Image Consultant', 'Celebrity stylist with 12 years in fashion. Worked with Bollywood stars.', ARRAY['Fashion Styling', 'Personal Branding', 'Wardrobe Management', 'Image Consulting'], ARRAY['Fashion Styling', 'Personal Branding', 'Wardrobe Management', 'Image Consulting'], 0, 'INR', 'Mumbai, India', ARRAY['English', 'Hindi', 'Punjabi'], 4.7, 143, true, 'verified', ARRAY['Verified'], 12, 'Style Studio Mumbai', ARRAY['Personal Styling', 'Corporate Dressing', 'Color Theory']),

('Anand Krishnamurthy', 'Cybersecurity Expert', 'CISSP certified. Former security architect at TCS. Expert in penetration testing.', ARRAY['Cybersecurity', 'Penetration Testing', 'Security Auditing', 'Data Protection'], ARRAY['Cybersecurity', 'Penetration Testing', 'Security Auditing', 'Data Protection'], 0, 'INR', 'Bangalore, India', ARRAY['English', 'Kannada', 'Tamil'], 4.8, 91, true, 'verified', ARRAY['Verified'], 14, 'SecureIT Consulting', ARRAY['Ethical Hacking', 'VAPT', 'SOC Setup']);

-- 12. LINK EXPERTS TO CATEGORIES
DO $$
DECLARE
  expert_rec RECORD;
  cat_rec RECORD;
BEGIN
  FOR expert_rec IN SELECT id, expertise FROM speakers WHERE verification_status = 'verified' AND user_id IS NULL LOOP
    FOR cat_rec IN SELECT id, name FROM categories LOOP
      IF (
        (cat_rec.name ILIKE '%Finance%' AND (expert_rec.expertise::text ILIKE '%Finance%' OR expert_rec.expertise::text ILIKE '%Investment%' OR expert_rec.expertise::text ILIKE '%Tax%')) OR
        (cat_rec.name ILIKE '%Startup%' AND (expert_rec.expertise::text ILIKE '%Startup%' OR expert_rec.expertise::text ILIKE '%Fundraising%')) OR
        (cat_rec.name ILIKE '%Marketing%' AND (expert_rec.expertise::text ILIKE '%Marketing%' OR expert_rec.expertise::text ILIKE '%SEO%' OR expert_rec.expertise::text ILIKE '%Growth%')) OR
        (cat_rec.name ILIKE '%Tourism%' AND (expert_rec.expertise::text ILIKE '%Travel%' OR expert_rec.expertise::text ILIKE '%Tourism%')) OR
        (cat_rec.name ILIKE '%Technology%' AND (expert_rec.expertise::text ILIKE '%Development%' OR expert_rec.expertise::text ILIKE '%React%' OR expert_rec.expertise::text ILIKE '%Node%')) OR
        (cat_rec.name ILIKE '%Design%' AND cat_rec.name NOT ILIKE '%Interior%' AND (expert_rec.expertise::text ILIKE '%Design%' OR expert_rec.expertise::text ILIKE '%UX%' OR expert_rec.expertise::text ILIKE '%Figma%')) OR
        (cat_rec.name ILIKE '%Health%' AND cat_rec.name NOT ILIKE '%Mental%' AND (expert_rec.expertise::text ILIKE '%Nutrition%' OR expert_rec.expertise::text ILIKE '%Wellness%' OR expert_rec.expertise::text ILIKE '%Yoga%')) OR
        (cat_rec.name ILIKE '%Legal%' AND (expert_rec.expertise::text ILIKE '%Law%' OR expert_rec.expertise::text ILIKE '%Legal%' OR expert_rec.expertise::text ILIKE '%Compliance%')) OR
        (cat_rec.name ILIKE '%Real Estate%' AND expert_rec.expertise::text ILIKE '%Real Estate%') OR
        (cat_rec.name ILIKE '%Career%' AND (expert_rec.expertise::text ILIKE '%Career%' OR expert_rec.expertise::text ILIKE '%Resume%' OR expert_rec.expertise::text ILIKE '%Interview%')) OR
        (cat_rec.name ILIKE '%Data Science%' AND (expert_rec.expertise::text ILIKE '%Data Science%' OR expert_rec.expertise::text ILIKE '%Machine Learning%')) OR
        (cat_rec.name ILIKE '%Content%' AND cat_rec.name ILIKE '%Media%' AND (expert_rec.expertise::text ILIKE '%Content%' OR expert_rec.expertise::text ILIKE '%YouTube%' OR expert_rec.expertise::text ILIKE '%Social Media%')) OR
        (cat_rec.name ILIKE '%Blockchain%' AND (expert_rec.expertise::text ILIKE '%Blockchain%' OR expert_rec.expertise::text ILIKE '%Crypto%' OR expert_rec.expertise::text ILIKE '%DeFi%')) OR
        (cat_rec.name ILIKE '%E-commerce%' AND (expert_rec.expertise::text ILIKE '%E-commerce%' OR expert_rec.expertise::text ILIKE '%Shopify%' OR expert_rec.expertise::text ILIKE '%D2C%')) OR
        (cat_rec.name ILIKE '%Immigration%' AND (expert_rec.expertise::text ILIKE '%Immigration%' OR expert_rec.expertise::text ILIKE '%Visa%')) OR
        (cat_rec.name ILIKE '%Public Speaking%' AND (expert_rec.expertise::text ILIKE '%Speaking%' OR expert_rec.expertise::text ILIKE '%Storytelling%')) OR
        (cat_rec.name ILIKE '%Event Planning%' AND (expert_rec.expertise::text ILIKE '%Event%' OR expert_rec.expertise::text ILIKE '%Wedding%')) OR
        (cat_rec.name ILIKE '%Agriculture%' AND (expert_rec.expertise::text ILIKE '%Farming%' OR expert_rec.expertise::text ILIKE '%Agriculture%')) OR
        (cat_rec.name ILIKE '%Fashion%' AND (expert_rec.expertise::text ILIKE '%Fashion%' OR expert_rec.expertise::text ILIKE '%Styling%')) OR
        (cat_rec.name ILIKE '%Cybersecurity%' AND (expert_rec.expertise::text ILIKE '%Cybersecurity%' OR expert_rec.expertise::text ILIKE '%Penetration%' OR expert_rec.expertise::text ILIKE '%Security%'))
      ) THEN
        INSERT INTO speaker_categories (speaker_id, category_id)
        VALUES (expert_rec.id, cat_rec.id)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 13. ADD AVAILABILITY SLOTS FOR ALL VERIFIED EXPERTS (Mon-Fri 9am-6pm)
INSERT INTO availability_slots (expert_id, day_of_week, start_time, end_time, is_recurring)
SELECT id, 1, '09:00'::time, '18:00'::time, true FROM speakers WHERE verification_status = 'verified' AND user_id IS NULL
UNION ALL
SELECT id, 2, '09:00'::time, '18:00'::time, true FROM speakers WHERE verification_status = 'verified' AND user_id IS NULL
UNION ALL
SELECT id, 3, '09:00'::time, '18:00'::time, true FROM speakers WHERE verification_status = 'verified' AND user_id IS NULL
UNION ALL
SELECT id, 4, '09:00'::time, '18:00'::time, true FROM speakers WHERE verification_status = 'verified' AND user_id IS NULL
UNION ALL
SELECT id, 5, '09:00'::time, '18:00'::time, true FROM speakers WHERE verification_status = 'verified' AND user_id IS NULL;

-- Saturday for some experts
INSERT INTO availability_slots (expert_id, day_of_week, start_time, end_time, is_recurring)
SELECT id, 6, '10:00'::time, '14:00'::time, true FROM speakers
WHERE verification_status = 'verified' AND user_id IS NULL AND name IN (
  'Priya Sharma', 'Sneha Kapoor', 'Dr. Meera Nair', 'Vikram Singh', 'Lakshmi Krishnan'
);

SELECT 'Done! ' ||
  (SELECT count(*) FROM categories) || ' categories, ' ||
  (SELECT count(*) FROM speakers WHERE verification_status = 'verified') || ' verified experts, ' ||
  (SELECT count(*) FROM availability_slots) || ' availability slots, ' ||
  (SELECT count(*) FROM speaker_categories) || ' category links'
AS result;
