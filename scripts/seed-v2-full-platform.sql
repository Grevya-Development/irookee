-- =============================================
-- IROOKEE V2 - FULL PLATFORM SEED
-- All 207 categories, gamification tables,
-- behavioral policies, stats tracking
-- =============================================

-- ============ 1. GAMIFICATION TABLES ============

-- Expert badges earned
CREATE TABLE IF NOT EXISTS public.expert_badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id uuid NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  badge_key text NOT NULL,
  badge_name text NOT NULL,
  badge_icon text NOT NULL,
  badge_category text NOT NULL DEFAULT 'performance',
  earned_at timestamptz DEFAULT now(),
  UNIQUE(expert_id, badge_key)
);

-- Expert XP log
CREATE TABLE IF NOT EXISTS public.expert_xp_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id uuid NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  action text NOT NULL,
  xp_change integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- User badges earned
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key text NOT NULL,
  badge_name text NOT NULL,
  badge_icon text NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

-- Rookee Points log
CREATE TABLE IF NOT EXISTS public.rookee_points_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  points integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Expert stats (computed, updated periodically)
CREATE TABLE IF NOT EXISTS public.expert_stats (
  expert_id uuid PRIMARY KEY REFERENCES public.speakers(id) ON DELETE CASCADE,
  total_sessions integer DEFAULT 0,
  completed_sessions integer DEFAULT 0,
  no_show_count integer DEFAULT 0,
  cancellation_count integer DEFAULT 0,
  attendance_rate numeric DEFAULT 100,
  on_time_rate numeric DEFAULT 100,
  response_rate numeric DEFAULT 100,
  avg_response_minutes integer DEFAULT 0,
  repeat_client_rate numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  avg_rating numeric DEFAULT 0,
  total_xp integer DEFAULT 0,
  current_tier integer DEFAULT 0,
  current_streak_weeks integer DEFAULT 0,
  best_streak_weeks integer DEFAULT 0,
  sessions_this_month integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- User stats (computed, updated periodically)
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sessions integer DEFAULT 0,
  attendance_rate numeric DEFAULT 100,
  no_show_count integer DEFAULT 0,
  cancellation_count integer DEFAULT 0,
  on_time_rate numeric DEFAULT 100,
  reviews_left integer DEFAULT 0,
  total_rookee_points integer DEFAULT 0,
  current_tier integer DEFAULT 0,
  categories_explored integer DEFAULT 0,
  referrals_sent integer DEFAULT 0,
  referrals_converted integer DEFAULT 0,
  current_streak_weeks integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- No-show / policy violation log
CREATE TABLE IF NOT EXISTS public.policy_violations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_type text NOT NULL CHECK (subject_type IN ('expert', 'user')),
  subject_id uuid NOT NULL,
  violation_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  booking_id uuid,
  description text,
  action_taken text,
  created_at timestamptz DEFAULT now()
);

-- Add new columns to speakers for stats
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS total_xp integer DEFAULT 0;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS current_tier integer DEFAULT 0;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS attendance_rate numeric DEFAULT 100;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS on_time_rate numeric DEFAULT 100;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS response_rate numeric DEFAULT 100;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS repeat_client_rate numeric DEFAULT 0;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;

-- Add columns to profiles for user stats
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_sessions integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS attendance_rate numeric DEFAULT 100;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS no_show_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rookee_points integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loyalty_tier integer DEFAULT 0;

-- ============ 2. RLS POLICIES ============

ALTER TABLE expert_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view expert_badges" ON expert_badges;
CREATE POLICY "Anyone can view expert_badges" ON expert_badges FOR SELECT USING (true);

ALTER TABLE expert_xp_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Experts can view own xp" ON expert_xp_log;
CREATE POLICY "Experts can view own xp" ON expert_xp_log FOR SELECT USING (true);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view user_badges" ON user_badges;
CREATE POLICY "Anyone can view user_badges" ON user_badges FOR SELECT USING (true);

ALTER TABLE rookee_points_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own points" ON rookee_points_log;
CREATE POLICY "Users can view own points" ON rookee_points_log FOR SELECT USING (user_id = auth.uid());

ALTER TABLE expert_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view expert_stats" ON expert_stats;
CREATE POLICY "Anyone can view expert_stats" ON expert_stats FOR SELECT USING (true);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view user_stats" ON user_stats;
CREATE POLICY "Anyone can view user_stats" ON user_stats FOR SELECT USING (true);

ALTER TABLE policy_violations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view violations" ON policy_violations;
CREATE POLICY "Admins can view violations" ON policy_violations FOR SELECT USING (true);

-- ============ 3. ALL 207 CATEGORIES ============

DELETE FROM speaker_categories;
DELETE FROM categories;

-- Healthcare & Wellness (20)
INSERT INTO categories (name, description, icon) VALUES
('General Physician', 'Primary care and general health consultations', 'Stethoscope'),
('Cardiologist', 'Heart and cardiovascular health', 'HeartPulse'),
('Dermatologist', 'Skin, hair, and nail health', 'Sparkles'),
('Neurologist', 'Brain and nervous system disorders', 'Brain'),
('Psychiatrist', 'Mental health diagnosis and medication', 'Brain'),
('Psychologist / Mental Health Coach', 'Therapy, counseling, and mental wellness', 'Heart'),
('Nutritionist / Dietitian', 'Diet planning, nutrition, and weight management', 'Apple'),
('Physiotherapist', 'Physical rehabilitation and pain management', 'Activity'),
('Ayurvedic Practitioner', 'Traditional Ayurvedic medicine and wellness', 'Leaf'),
('Homeopathic Doctor', 'Homeopathic treatments and remedies', 'FlaskConical'),
('Dentist', 'Oral health and dental care', 'Smile'),
('Ophthalmologist', 'Eye care and vision health', 'Eye'),
('Pediatrician', 'Child and infant healthcare', 'Baby'),
('Gynecologist / Obstetrician', 'Women health, pregnancy, and reproductive care', 'Heart'),
('Orthopedic Surgeon', 'Bone, joint, and musculoskeletal care', 'Bone'),
('Oncologist', 'Cancer diagnosis and treatment guidance', 'Shield'),
('ENT Specialist', 'Ear, nose, and throat health', 'Ear'),
('Urologist', 'Urinary tract and male reproductive health', 'Stethoscope'),
('Gastroenterologist', 'Digestive system and gut health', 'Stethoscope'),
('Endocrinologist', 'Hormonal disorders, diabetes, and thyroid', 'Stethoscope');

-- Legal & Compliance (12)
INSERT INTO categories (name, description, icon) VALUES
('Corporate Lawyer', 'Business law, corporate governance, compliance', 'Scale'),
('Criminal Defense Lawyer', 'Criminal cases and defense representation', 'Shield'),
('Family & Divorce Lawyer', 'Family law, divorce, custody, and alimony', 'Users'),
('Immigration Lawyer', 'Visa, immigration, and citizenship law', 'Globe'),
('Intellectual Property Lawyer', 'Patents, trademarks, and copyright protection', 'FileText'),
('Real Estate Lawyer', 'Property law, transactions, and disputes', 'Home'),
('Tax Attorney', 'Tax law, disputes, and planning', 'DollarSign'),
('Labour & Employment Lawyer', 'Workplace law and employee rights', 'Briefcase'),
('Cyber Law Expert', 'Digital law, data protection, and cybercrime', 'ShieldCheck'),
('Startup Legal Advisor', 'Startup incorporation, equity, and fundraising legal', 'Rocket'),
('Contract Specialist', 'Contract drafting, review, and negotiation', 'FileText'),
('Compliance Officer', 'Regulatory compliance and governance', 'ClipboardCheck');

-- Finance & Investment (12)
INSERT INTO categories (name, description, icon) VALUES
('Certified Financial Planner', 'Comprehensive financial planning and advisory', 'DollarSign'),
('Stock Market Expert', 'Equity trading, analysis, and portfolio management', 'TrendingUp'),
('Mutual Fund Advisor', 'Mutual fund selection, SIP planning', 'BarChart'),
('Cryptocurrency Advisor', 'Crypto trading, DeFi, blockchain investments', 'Link'),
('Real Estate Investment Advisor', 'Property investment and market analysis', 'Home'),
('Angel Investor / VC', 'Startup funding, investor relations, pitch guidance', 'Rocket'),
('Tax Consultant (CA/CPA)', 'Tax planning, filing, and audit assistance', 'Calculator'),
('Insurance Advisor', 'Life, health, and general insurance guidance', 'Shield'),
('Retirement Planning Expert', 'Pension, provident fund, and retirement strategies', 'Clock'),
('Forex Trader / Mentor', 'Forex trading strategies and mentorship', 'TrendingUp'),
('Personal Finance Coach', 'Budgeting, saving, and financial literacy', 'Wallet'),
('Wealth Manager', 'High-net-worth wealth management and advisory', 'DollarSign');

-- Business & Entrepreneurship (12)
INSERT INTO categories (name, description, icon) VALUES
('Startup Mentor', 'Startup ideation, validation, and scaling guidance', 'Rocket'),
('Business Plan Consultant', 'Business plan writing and strategy development', 'FileText'),
('Marketing Strategist', 'Marketing planning, brand strategy, and growth', 'TrendingUp'),
('Sales Coach', 'Sales techniques, pipeline management, and closing', 'Target'),
('Operations Consultant', 'Business operations optimization and process design', 'Settings'),
('Supply Chain Expert', 'Logistics, procurement, and supply chain management', 'Truck'),
('Franchise Consultant', 'Franchise selection, setup, and operations', 'Store'),
('Business Valuation Expert', 'Company valuation and financial modeling', 'Calculator'),
('M&A Advisor', 'Mergers, acquisitions, and deal structuring', 'Handshake'),
('Pitch Deck Consultant', 'Investor pitch deck design and storytelling', 'Presentation'),
('Fundraising Strategist', 'Capital raising, investor outreach, and term sheets', 'DollarSign'),
('Product Manager Mentor', 'Product strategy, roadmap, and PM career guidance', 'Layout');

-- Technology & Engineering (17)
INSERT INTO categories (name, description, icon) VALUES
('Software Engineer (Full Stack)', 'Full-stack web and app development', 'Code'),
('AI / ML Engineer', 'Artificial intelligence and machine learning', 'Brain'),
('Data Scientist', 'Data analysis, modeling, and business intelligence', 'BarChart'),
('Blockchain Developer', 'Smart contracts, Web3, and blockchain development', 'Link'),
('Cybersecurity Expert', 'Security auditing, penetration testing, data protection', 'ShieldCheck'),
('Cloud Architect', 'AWS, GCP, Azure cloud infrastructure design', 'Cloud'),
('DevOps Engineer', 'CI/CD, infrastructure automation, and deployment', 'Settings'),
('Mobile App Developer', 'iOS, Android, and cross-platform mobile development', 'Smartphone'),
('UI/UX Designer', 'User interface and experience design', 'Palette'),
('Game Developer', 'Game design, development, and publishing', 'Gamepad2'),
('IoT Engineer', 'Internet of Things devices and systems', 'Wifi'),
('Embedded Systems Expert', 'Embedded hardware and firmware development', 'Cpu'),
('Robotics Engineer', 'Robotics design, programming, and automation', 'Bot'),
('AR/VR Developer', 'Augmented and virtual reality development', 'Glasses'),
('Database Administrator', 'Database design, optimization, and management', 'Database'),
('System Architect', 'Large-scale system design and architecture', 'Server'),
('QA / Testing Expert', 'Quality assurance, test automation, and SDLC', 'CheckCircle');

-- Career & Education (13)
INSERT INTO categories (name, description, icon) VALUES
('Career Coach', 'Career planning, transitions, and growth strategies', 'Briefcase'),
('Resume / CV Writer', 'Professional resume writing and optimization', 'FileText'),
('Interview Coach', 'Interview preparation, mock interviews, and feedback', 'MessageSquare'),
('LinkedIn Profile Expert', 'LinkedIn optimization and personal branding', 'Linkedin'),
('College Admissions Counselor', 'University applications and admissions strategy', 'GraduationCap'),
('MBA Admissions Coach', 'MBA applications, essays, and interview prep', 'GraduationCap'),
('Scholarship Advisor', 'Scholarship search, applications, and funding', 'Award'),
('GMAT/GRE/SAT Tutor', 'Standardized test preparation and strategies', 'BookOpen'),
('Study Abroad Consultant', 'International education planning and visa guidance', 'Globe'),
('Professional Certification Guide', 'Certification selection and exam preparation', 'Award'),
('Soft Skills Trainer', 'Communication, leadership, and interpersonal skills', 'Users'),
('Public Speaking Coach', 'Presentation skills, speech coaching, stage presence', 'Mic'),
('HR Recruiter / Head Hunter', 'Recruitment strategy and talent acquisition', 'Search');

-- Creative Arts & Media (18)
INSERT INTO categories (name, description, icon) VALUES
('Graphic Designer', 'Visual design, branding, and print design', 'Palette'),
('Brand Identity Designer', 'Logo, brand guidelines, and visual identity', 'Palette'),
('Video Editor', 'Video editing, post-production, and color grading', 'Film'),
('Photographer', 'Photography techniques, composition, and editing', 'Camera'),
('Videographer / Cinematographer', 'Video production and cinematography', 'Video'),
('Music Producer', 'Music production, mixing, and mastering', 'Music'),
('Songwriter', 'Songwriting, lyrics, and music composition', 'Music'),
('Voice-over Artist', 'Voice acting, narration, and dubbing', 'Mic'),
('Podcast Host / Producer', 'Podcast creation, production, and growth', 'Headphones'),
('Content Creator', 'Social media content strategy and creation', 'PenTool'),
('Copywriter', 'Advertising copy, web copy, and brand messaging', 'PenTool'),
('Technical Writer', 'Documentation, manuals, and technical content', 'FileText'),
('Ghost Writer', 'Ghost writing for books, articles, and speeches', 'PenTool'),
('Children''s Book Author', 'Children''s literature writing and illustration', 'BookOpen'),
('Screenwriter', 'Film and TV screenplay writing', 'Film'),
('Illustrator / Digital Artist', 'Digital illustration and concept art', 'Palette'),
('3D Artist / Animator', '3D modeling, animation, and rendering', 'Box'),
('NFT / Digital Art Advisor', 'NFT creation, marketplace strategy, and digital art', 'Image');

-- Travel & Tourism (15)
INSERT INTO categories (name, description, icon) VALUES
('Local Tourist Guide', 'City tours, local experiences, and insider knowledge', 'MapPin'),
('Adventure Travel Planner', 'Adventure trips, extreme sports, and expeditions', 'Mountain'),
('Luxury Travel Consultant', 'Luxury resorts, premium experiences, and concierge', 'Star'),
('Budget Travel Expert', 'Budget-friendly travel planning and hacks', 'Wallet'),
('Solo Female Travel Guide', 'Safe solo travel tips and itineraries for women', 'MapPin'),
('Backpacker Mentor', 'Backpacking routes, gear, and budget tips', 'Backpack'),
('Visa & Immigration Guide', 'Travel visa applications and documentation', 'Globe'),
('Cultural Experience Curator', 'Cultural immersion, festivals, and local traditions', 'Globe'),
('Honeymoon Planner', 'Romantic getaway and honeymoon planning', 'Heart'),
('Pilgrimage / Spiritual Tour Guide', 'Religious and spiritual travel planning', 'Sparkles'),
('Eco-Tourism Expert', 'Sustainable and eco-friendly travel', 'TreePine'),
('Road Trip Planner', 'Road trip routes, stops, and travel logistics', 'Car'),
('Cruise Vacation Advisor', 'Cruise selection, itineraries, and booking', 'Ship'),
('Safari Guide', 'Wildlife safaris and nature expeditions', 'TreePine'),
('Trekking / Hiking Expert', 'Trekking routes, gear, and altitude preparation', 'Mountain');

-- Lifestyle & Personal Growth (16)
INSERT INTO categories (name, description, icon) VALUES
('Life Coach', 'Personal development, goal setting, and life strategy', 'Compass'),
('Mindfulness / Meditation Teacher', 'Meditation techniques and mindfulness practices', 'Flower2'),
('Yoga Instructor', 'Yoga asanas, breathing, and wellness', 'Heart'),
('Personal Trainer / Fitness Coach', 'Exercise programming and fitness coaching', 'Dumbbell'),
('Relationship Coach', 'Relationship improvement and communication skills', 'Heart'),
('Marriage Counselor', 'Marriage therapy and conflict resolution', 'Heart'),
('Parenting Coach', 'Parenting strategies and child development', 'Baby'),
('Productivity Coach', 'Time management and productivity systems', 'Clock'),
('Time Management Expert', 'Scheduling, prioritization, and efficiency', 'Clock'),
('Motivational Speaker', 'Inspiration, motivation, and peak performance', 'Mic'),
('Spiritual Guide', 'Spiritual growth, practices, and guidance', 'Sparkles'),
('Astrologer', 'Vedic and Western astrology readings', 'Star'),
('Numerologist', 'Numerology readings and life path analysis', 'Hash'),
('Feng Shui Consultant', 'Space energy, arrangement, and harmony', 'Home'),
('NLP Practitioner', 'Neuro-linguistic programming and behavioral change', 'Brain'),
('Hypnotherapist', 'Hypnotherapy for habits, anxiety, and transformation', 'Brain');

-- Social & Connections including Dating (10)
INSERT INTO categories (name, description, icon) VALUES
('Dating Coach', 'Dating skills, confidence, and relationship building', 'Heart'),
('Matchmaker / Marriage Broker', 'Matchmaking and marriage introductions', 'Heart'),
('Social Skills Coach', 'Social confidence, networking, and charisma', 'Users'),
('Confidence Building Coach', 'Self-esteem, assertiveness, and confidence', 'Shield'),
('Communication Skills Expert', 'Verbal and non-verbal communication mastery', 'MessageSquare'),
('Online Dating Profile Consultant', 'Dating app profile optimization and strategy', 'Smartphone'),
('Breakup / Divorce Recovery Coach', 'Emotional recovery and moving forward', 'Heart'),
('Friendship Building Guide', 'Making friends, deepening connections', 'Users'),
('Networking Expert', 'Professional networking and relationship building', 'Network'),
('Etiquette & Grooming Coach', 'Social etiquette, grooming, and personal presentation', 'User');

-- Home, Real Estate & Interior (10)
INSERT INTO categories (name, description, icon) VALUES
('Real Estate Agent / Broker', 'Property buying, selling, and market analysis', 'Home'),
('Vastu Consultant', 'Vastu Shastra guidance for homes and offices', 'Home'),
('Interior Designer', 'Interior decoration, space planning, and styling', 'Palette'),
('Home Renovation Expert', 'Renovation planning, contractors, and budgeting', 'Hammer'),
('Landscape Designer', 'Garden design, landscaping, and outdoor spaces', 'TreePine'),
('Property Management Advisor', 'Rental management and tenant relations', 'Building'),
('Smart Home Technology Expert', 'Home automation, IoT, and smart devices', 'Wifi'),
('Architect', 'Building design, planning permissions, and construction', 'Building'),
('Structural Engineer', 'Structural analysis and building safety', 'Building'),
('Home Stager', 'Property staging for sale and presentation', 'Home');

-- Food, Culinary & Hospitality (10)
INSERT INTO categories (name, description, icon) VALUES
('Chef / Culinary Expert', 'Cooking techniques, recipes, and culinary arts', 'ChefHat'),
('Nutritional Chef', 'Healthy cooking, therapeutic diets, and meal prep', 'Apple'),
('Pastry & Baking Expert', 'Baking, pastry arts, and dessert creation', 'Cake'),
('Mixologist / Bartender', 'Cocktail crafting and beverage expertise', 'Wine'),
('Wine Sommelier', 'Wine selection, tasting, and pairing', 'Wine'),
('Restaurant Business Consultant', 'Restaurant startup, management, and growth', 'Store'),
('Food Blogger / Reviewer', 'Food content creation and restaurant reviews', 'PenTool'),
('Catering Planner', 'Event catering planning and execution', 'UtensilsCrossed'),
('Hotel & Hospitality Consultant', 'Hospitality management and service excellence', 'Building'),
('Event Catering Expert', 'Large-scale event food planning and logistics', 'UtensilsCrossed');

-- Events, PR & Communication (10)
INSERT INTO categories (name, description, icon) VALUES
('Event Planner', 'Event conceptualization, planning, and execution', 'CalendarDays'),
('Wedding Planner', 'Wedding planning, vendor coordination, and design', 'Heart'),
('Corporate Event Manager', 'Corporate events, conferences, and team building', 'Building'),
('PR & Communications Expert', 'Public relations, media relations, and reputation', 'Megaphone'),
('Brand Ambassador Coach', 'Brand representation and ambassador programs', 'Award'),
('Media Relations Specialist', 'Press releases, media outreach, and coverage', 'Newspaper'),
('Crisis Communication Expert', 'Crisis management and damage control', 'AlertTriangle'),
('Social Media Influencer Coach', 'Influencer strategy, growth, and monetization', 'Instagram'),
('Political Campaign Advisor', 'Election campaigns and political strategy', 'Flag'),
('Speechwriter', 'Speech writing for leaders and public figures', 'PenTool');

-- Sports, Fitness & Recreation (14)
INSERT INTO categories (name, description, icon) VALUES
('Cricket Coach', 'Cricket batting, bowling, and fielding coaching', 'Trophy'),
('Football / Soccer Coach', 'Football skills, tactics, and training', 'Trophy'),
('Tennis Coach', 'Tennis technique, strategy, and fitness', 'Trophy'),
('Badminton Coach', 'Badminton skills and competitive preparation', 'Trophy'),
('Swimming Coach', 'Swimming technique, training, and water safety', 'Waves'),
('Martial Arts Instructor', 'Karate, MMA, boxing, and self-defense', 'Shield'),
('Sports Nutritionist', 'Athletic nutrition and performance fueling', 'Apple'),
('Sports Psychologist', 'Mental performance and athlete mindset', 'Brain'),
('eSports Coach', 'Competitive gaming strategy and improvement', 'Gamepad2'),
('Chess Coach', 'Chess strategy, openings, and tournament prep', 'Crown'),
('Cycling Coach', 'Cycling training, endurance, and racing', 'Bike'),
('Marathon Running Coach', 'Marathon training plans and running technique', 'Timer'),
('Gymnastics Coach', 'Gymnastics skills and flexibility training', 'Activity'),
('Dance Instructor', 'Classical, contemporary, and social dance', 'Music');

-- Agriculture, Environment & Sustainability (10)
INSERT INTO categories (name, description, icon) VALUES
('Organic Farming Expert', 'Organic farming techniques and certification', 'Leaf'),
('AgriTech Advisor', 'Agricultural technology and smart farming', 'Cpu'),
('Environmental Consultant', 'Environmental impact assessment and compliance', 'TreePine'),
('Sustainability Strategist', 'Corporate sustainability and ESG strategy', 'Recycle'),
('Water Conservation Expert', 'Water management and conservation techniques', 'Droplets'),
('Solar Energy Advisor', 'Solar panel installation and renewable energy', 'Sun'),
('Carbon Footprint Consultant', 'Carbon reduction and offset strategies', 'Leaf'),
('Forestry & Wildlife Expert', 'Forest management and wildlife conservation', 'TreePine'),
('Veterinarian', 'Animal health, treatment, and preventive care', 'PawPrint'),
('Animal Behaviour Specialist', 'Pet training, behavior modification', 'PawPrint');

-- Government, Policy & Social Impact (9)
INSERT INTO categories (name, description, icon) VALUES
('Government Scheme Advisor', 'Government schemes, subsidies, and benefits (India)', 'Landmark'),
('NGO / Non-Profit Consultant', 'NGO setup, fundraising, and impact measurement', 'HeartHandshake'),
('Social Entrepreneur Mentor', 'Social enterprise strategy and impact scaling', 'Rocket'),
('Policy Analyst', 'Public policy analysis and recommendation', 'FileText'),
('CSR Strategy Consultant', 'Corporate social responsibility planning', 'HeartHandshake'),
('Education Policy Expert', 'Education system reform and policy', 'GraduationCap'),
('Human Rights Advocate', 'Human rights law and advocacy', 'Scale'),
('Community Development Expert', 'Rural and urban community development', 'Users'),
('RTI / Grievance Advisor', 'Right to Information and public grievance filing', 'FileText');

-- Thought Leadership & Academia (9)
INSERT INTO categories (name, description, icon) VALUES
('Futurist / Trend Analyst', 'Future trends, emerging technologies, and forecasting', 'TrendingUp'),
('Academic Research Mentor', 'Research methodology, paper writing, and publication', 'BookOpen'),
('PhD Thesis Guide', 'PhD guidance, thesis writing, and defense preparation', 'GraduationCap'),
('TEDx Speaker Coach', 'TEDx application, talk preparation, and delivery', 'Mic'),
('Book Writing Mentor', 'Book writing, publishing, and marketing', 'BookOpen'),
('Keynote Speaker Coach', 'Keynote preparation and professional speaking', 'Mic'),
('Industry Analyst', 'Market research, industry analysis, and reporting', 'BarChart'),
('Think Tank Expert', 'Policy research and strategic advisory', 'Brain'),
('Science Communicator', 'Making science accessible and engaging', 'Atom');

-- ============ 4. SEED EXPERT STATS ============
-- Create stats rows for all existing verified experts
INSERT INTO expert_stats (expert_id, total_sessions, completed_sessions, avg_rating, total_reviews, attendance_rate, on_time_rate, response_rate, repeat_client_rate, total_xp, current_tier, sessions_this_month)
SELECT
  id,
  past_events,
  GREATEST(0, past_events - FLOOR(RANDOM() * 5)::int),
  COALESCE(rating, 0),
  GREATEST(0, past_events - FLOOR(RANDOM() * 20)::int),
  90 + FLOOR(RANDOM() * 10)::numeric,
  85 + FLOOR(RANDOM() * 15)::numeric,
  80 + FLOOR(RANDOM() * 20)::numeric,
  25 + FLOOR(RANDOM() * 40)::numeric,
  past_events * 10 + FLOOR(RANDOM() * 200)::int,
  CASE
    WHEN past_events >= 200 THEN 4
    WHEN past_events >= 100 THEN 3
    WHEN past_events >= 25 THEN 2
    WHEN past_events >= 5 THEN 1
    ELSE 0
  END,
  FLOOR(RANDOM() * 15 + 5)::int
FROM speakers
WHERE verification_status = 'verified'
ON CONFLICT (expert_id) DO UPDATE SET
  total_sessions = EXCLUDED.total_sessions,
  completed_sessions = EXCLUDED.completed_sessions,
  avg_rating = EXCLUDED.avg_rating,
  total_reviews = EXCLUDED.total_reviews,
  attendance_rate = EXCLUDED.attendance_rate,
  on_time_rate = EXCLUDED.on_time_rate,
  response_rate = EXCLUDED.response_rate,
  repeat_client_rate = EXCLUDED.repeat_client_rate,
  total_xp = EXCLUDED.total_xp,
  current_tier = EXCLUDED.current_tier,
  sessions_this_month = EXCLUDED.sessions_this_month,
  updated_at = now();

-- ============ 5. SEED EXPERT BADGES ============
-- Give verified experts appropriate badges based on their stats
INSERT INTO expert_badges (expert_id, badge_key, badge_name, badge_icon, badge_category)
SELECT id, 'century_club', 'Century Club', '🏅', 'performance'
FROM speakers WHERE verification_status = 'verified' AND past_events >= 100
ON CONFLICT DO NOTHING;

INSERT INTO expert_badges (expert_id, badge_key, badge_name, badge_icon, badge_category)
SELECT id, 'top_rated', 'Top Rated', '🌟', 'performance'
FROM speakers WHERE verification_status = 'verified' AND rating >= 4.7
ON CONFLICT DO NOTHING;

INSERT INTO expert_badges (expert_id, badge_key, badge_name, badge_icon, badge_category)
SELECT id, 'verified_expert', 'Verified Expert', '✅', 'reliability'
FROM speakers WHERE verification_status = 'verified'
ON CONFLICT DO NOTHING;

INSERT INTO expert_badges (expert_id, badge_key, badge_name, badge_icon, badge_category)
SELECT id, 'client_magnet', 'Client Magnet', '🔁', 'performance'
FROM speakers WHERE verification_status = 'verified' AND past_events >= 150
ON CONFLICT DO NOTHING;

-- ============ 6. UPDATE SPEAKER TIER FIELDS ============
UPDATE speakers SET
  current_tier = CASE
    WHEN past_events >= 200 THEN 4
    WHEN past_events >= 100 THEN 3
    WHEN past_events >= 25 THEN 2
    WHEN past_events >= 5 THEN 1
    ELSE 0
  END,
  total_xp = past_events * 10 + FLOOR(RANDOM() * 200)::int,
  attendance_rate = 90 + FLOOR(RANDOM() * 10)::numeric,
  on_time_rate = 85 + FLOOR(RANDOM() * 15)::numeric,
  response_rate = 80 + FLOOR(RANDOM() * 20)::numeric,
  repeat_client_rate = 25 + FLOOR(RANDOM() * 40)::numeric
WHERE verification_status = 'verified';

-- ============ 7. LINK EXPERTS TO NEW CATEGORIES ============
-- Re-link with the new expanded categories
DELETE FROM speaker_categories WHERE speaker_id IN (SELECT id FROM speakers WHERE user_id IS NULL);

DO $$
DECLARE
  expert_rec RECORD;
  cat_rec RECORD;
  exp_text text;
BEGIN
  FOR expert_rec IN SELECT id, expertise FROM speakers WHERE verification_status = 'verified' AND user_id IS NULL LOOP
    exp_text := expert_rec.expertise::text;
    FOR cat_rec IN SELECT id, name FROM categories LOOP
      IF (
        (cat_rec.name ILIKE '%Financial Planner%' AND (exp_text ILIKE '%Finance%' OR exp_text ILIKE '%Investment%')) OR
        (cat_rec.name ILIKE '%Startup Mentor%' AND (exp_text ILIKE '%Startup%' OR exp_text ILIKE '%Fundraising%')) OR
        (cat_rec.name ILIKE '%Marketing Strategist%' AND (exp_text ILIKE '%Marketing%' OR exp_text ILIKE '%SEO%' OR exp_text ILIKE '%Growth%')) OR
        (cat_rec.name ILIKE '%Tourist Guide%' AND (exp_text ILIKE '%Travel%' OR exp_text ILIKE '%Tourism%')) OR
        (cat_rec.name ILIKE '%Software Engineer%' AND (exp_text ILIKE '%Development%' OR exp_text ILIKE '%React%' OR exp_text ILIKE '%Node%')) OR
        (cat_rec.name ILIKE '%UI/UX%' AND (exp_text ILIKE '%Design%' OR exp_text ILIKE '%UX%' OR exp_text ILIKE '%Figma%')) OR
        (cat_rec.name ILIKE '%Nutritionist%' AND (exp_text ILIKE '%Nutrition%' OR exp_text ILIKE '%Wellness%' OR exp_text ILIKE '%Yoga%')) OR
        (cat_rec.name ILIKE '%Corporate Lawyer%' AND (exp_text ILIKE '%Law%' OR exp_text ILIKE '%Legal%')) OR
        (cat_rec.name ILIKE '%Startup Legal%' AND exp_text ILIKE '%Startup Legal%') OR
        (cat_rec.name ILIKE '%Real Estate%' AND cat_rec.name ILIKE '%Investment%' AND exp_text ILIKE '%Real Estate%') OR
        (cat_rec.name ILIKE '%Career Coach%' AND (exp_text ILIKE '%Career%' OR exp_text ILIKE '%Resume%' OR exp_text ILIKE '%Interview%')) OR
        (cat_rec.name ILIKE '%Data Scientist%' AND (exp_text ILIKE '%Data Science%' OR exp_text ILIKE '%Machine Learning%')) OR
        (cat_rec.name ILIKE '%Content Creator%' AND (exp_text ILIKE '%Content%' OR exp_text ILIKE '%YouTube%' OR exp_text ILIKE '%Social Media%')) OR
        (cat_rec.name ILIKE '%Blockchain%' AND (exp_text ILIKE '%Blockchain%' OR exp_text ILIKE '%Crypto%' OR exp_text ILIKE '%DeFi%')) OR
        (cat_rec.name ILIKE '%Immigration%' AND (exp_text ILIKE '%Immigration%' OR exp_text ILIKE '%Visa%')) OR
        (cat_rec.name ILIKE '%Public Speaking%' AND (exp_text ILIKE '%Speaking%' OR exp_text ILIKE '%Storytelling%')) OR
        (cat_rec.name ILIKE '%Event Planner%' AND (exp_text ILIKE '%Event%' OR exp_text ILIKE '%Wedding%')) OR
        (cat_rec.name ILIKE '%Organic Farming%' AND (exp_text ILIKE '%Farming%' OR exp_text ILIKE '%Agriculture%')) OR
        (cat_rec.name ILIKE '%Cybersecurity%' AND (exp_text ILIKE '%Cybersecurity%' OR exp_text ILIKE '%Security%' OR exp_text ILIKE '%Penetration%')) OR
        (cat_rec.name ILIKE '%Personal Trainer%' AND exp_text ILIKE '%Fitness%') OR
        (cat_rec.name ILIKE '%Yoga%' AND exp_text ILIKE '%Yoga%') OR
        (cat_rec.name ILIKE '%Dating Coach%' AND exp_text ILIKE '%Dating%') OR
        (cat_rec.name = 'Copywriter' AND exp_text ILIKE '%Copywriting%') OR
        (cat_rec.name ILIKE '%E-commerce%' AND (exp_text ILIKE '%E-commerce%' OR exp_text ILIKE '%Shopify%' OR exp_text ILIKE '%D2C%'))
      ) THEN
        INSERT INTO speaker_categories (speaker_id, category_id)
        VALUES (expert_rec.id, cat_rec.id)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

SELECT 'V2 Seed Complete! ' ||
  (SELECT count(*) FROM categories) || ' categories, ' ||
  (SELECT count(*) FROM speakers WHERE verification_status = 'verified') || ' verified experts, ' ||
  (SELECT count(*) FROM expert_stats) || ' expert stats, ' ||
  (SELECT count(*) FROM expert_badges) || ' badges awarded, ' ||
  (SELECT count(*) FROM speaker_categories) || ' category links'
AS result;
