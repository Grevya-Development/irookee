-- Migration: 20260728180000_production_bugs_fixes_and_validation.sql
-- Production database validation, avatar synchronization, and booking integrity triggers.

-- 1. Database trigger to automatically sync avatar_url from profiles to speakers table
CREATE OR REPLACE FUNCTION public.sync_profile_avatar_to_speaker()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.avatar_url IS NOT NULL AND NEW.avatar_url <> COALESCE(OLD.avatar_url, '') THEN
    UPDATE public.speakers
    SET 
      image_url = NEW.avatar_url,
      profile_photo_url = NEW.avatar_url,
      updated_at = NOW()
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_avatar_to_speaker ON public.profiles;
CREATE TRIGGER trg_sync_profile_avatar_to_speaker
  AFTER UPDATE OF avatar_url ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_avatar_to_speaker();

-- 2. PostgreSQL function to validate expertise areas and phone at DB level
CREATE OR REPLACE FUNCTION public.validate_expert_data_db()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate phone if present
  IF NEW.phone IS NOT NULL AND NEW.phone <> '' THEN
    IF NOT (NEW.phone ~ '^\+?[1-9]\d{7,14}$') AND NOT (NEW.phone ~ '^[6-9]\d{9}$') THEN
      RAISE EXCEPTION 'Invalid phone number format: %', NEW.phone;
    END IF;
  END IF;

  -- Validate title if present
  IF NEW.title IS NOT NULL AND NEW.title <> '' THEN
    IF NEW.title ~ '^[0-9\s\-_, .()]+$' THEN
      RAISE EXCEPTION 'Professional title cannot be numeric-only: %', NEW.title;
    END IF;
    IF NEW.title ~* '(<script|javascript:|DROP TABLE|DELETE FROM|SELECT \*|--)' THEN
      RAISE EXCEPTION 'Invalid content in professional title: %', NEW.title;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_expert_data_db ON public.speakers;
CREATE TRIGGER trg_validate_expert_data_db
  BEFORE INSERT OR UPDATE ON public.speakers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_expert_data_db();
