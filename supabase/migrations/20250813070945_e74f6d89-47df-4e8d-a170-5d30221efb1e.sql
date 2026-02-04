
-- Add the missing icon column to the categories table
ALTER TABLE categories ADD COLUMN icon TEXT;

-- Update existing categories with their icons
UPDATE categories SET icon = '💼' WHERE name = 'Career & Job Transition';
UPDATE categories SET icon = '🎯' WHERE name = 'Industry Mentors';
UPDATE categories SET icon = '🎓' WHERE name = 'Study Abroad Guidance';
UPDATE categories SET icon = '✈️' WHERE name = 'Travel & Tourism Guides';
UPDATE categories SET icon = '🗺️' WHERE name = 'Local Help';
UPDATE categories SET icon = '🚀' WHERE name = 'Business & Startup Advisors';
UPDATE categories SET icon = '📈' WHERE name = 'Personal Skills Coaching';
UPDATE categories SET icon = '🧘' WHERE name = 'Health & Wellness Advisors';
