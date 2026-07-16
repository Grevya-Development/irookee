ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check CHECK (user_type = ANY (ARRAY['consumer'::text, 'expert'::text, 'both'::text, 'admin'::text, 'suspended'::text]));
