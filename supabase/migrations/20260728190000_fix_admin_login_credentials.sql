-- Migration: 20260728190000_fix_admin_login_credentials.sql
-- Fix admin user credentials for kavin@grevya.com and grant admin user_type in profiles.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ensure user_type in profiles is set to admin for kavin@grevya.com
UPDATE public.profiles 
SET 
  user_type = 'admin',
  full_name = COALESCE(NULLIF(full_name, 'ka'), 'Kavin N R'),
  updated_at = NOW()
WHERE email = 'kavin@grevya.com';

-- 2. Ensure auth.users has confirmed email and password set for Grevya@2026
UPDATE auth.users 
SET 
  encrypted_password = crypt('Grevya@2026', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'kavin@grevya.com';

-- 3. Upsert user_roles table if present to grant admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM public.profiles
WHERE email = 'kavin@grevya.com'
ON CONFLICT (user_id, role) DO NOTHING;
