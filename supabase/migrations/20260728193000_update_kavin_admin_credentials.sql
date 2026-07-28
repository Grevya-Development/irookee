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
