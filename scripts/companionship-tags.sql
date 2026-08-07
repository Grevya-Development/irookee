-- Companionship: tagging providers
-- =============================================================================
-- OPTIONAL. Nothing here runs automatically, and the app works without it —
-- untagged services simply show the "no companions in your area yet" state.
--
-- The Companionship feature needs NO schema change. A provider is listed under
-- a service purely by carrying the matching tag in `speakers.topics` (or
-- `speakers.expertise`). `servicesFor()` in src/lib/searchAgent/index.ts maps
-- those tags to service slugs.
--
-- Recognised tags -> slug
-- -----------------------------------------------------------------------------
--   'Hospital Companion'   -> hospital
--   'Shopping Companion'   -> shopping
--   'Errand Companion'     -> errands
--   'Travel Companion'     -> travel
--   'Walking Companion'    -> outing
--   'Social Companion'     -> social
--   'Digital Companion'    -> digital
--   'Event Companion'      -> events
--   'Caregiver Respite'    -> caregiver-respite
--   'Recurring Companion'  -> recurring
--
-- The explicit form 'companionship:<slug>' also works, e.g.
-- 'companionship:caregiver-respite'.
-- =============================================================================


-- 1. Tag ONE existing, already-verified provider as a hospital companion.
--    Replace the email with a real provider who has agreed to offer this.
--
-- UPDATE public.speakers
--    SET topics = array_distinct(coalesce(topics, '{}') || ARRAY['Hospital Companion'])
--  WHERE email = 'replace-me@example.com';


-- 2. Postgres has no built-in array_distinct; this helper keeps repeated runs
--    from duplicating tags. Safe to create, used only by these statements.
--
-- CREATE OR REPLACE FUNCTION public.array_distinct(anyarray)
-- RETURNS anyarray LANGUAGE sql IMMUTABLE AS $$
--   SELECT array_agg(DISTINCT x) FROM unnest($1) t(x);
-- $$;


-- 3. Tag a provider with several services at once.
--
-- UPDATE public.speakers
--    SET topics = public.array_distinct(
--          coalesce(topics, '{}') ||
--          ARRAY['Hospital Companion', 'Travel Companion', 'Caregiver Respite']
--        )
--  WHERE id = '00000000-0000-0000-0000-000000000000';


-- 4. Review who is currently listed under each companionship service.
--
-- SELECT s.name,
--        s.location,
--        s.verification_status,
--        t AS companionship_tag
--   FROM public.speakers s
--   CROSS JOIN LATERAL unnest(coalesce(s.topics, '{}')) AS t
--  WHERE t ILIKE '%companion%'
--     OR t ILIKE 'caregiver respite'
--     OR t ILIKE 'companionship:%'
--  ORDER BY s.name;


-- 5. Remove a service from a provider.
--
-- UPDATE public.speakers
--    SET topics = array_remove(topics, 'Hospital Companion')
--  WHERE email = 'replace-me@example.com';


-- NOTE ON VISIBILITY
-- Only providers matching the public listing rule appear in search:
--   verification_status = 'verified'  OR  is_verified = true
--   OR verification_status IS NULL
-- Tagging a provider who is 'pending' or 'rejected' will not surface them.
