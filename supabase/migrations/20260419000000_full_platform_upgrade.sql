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
