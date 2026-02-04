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