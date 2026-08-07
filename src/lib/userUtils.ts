/**
 * User Profile Helper Utilities for Irookee
 * Ensures user profiles exist in Supabase 'profiles' table before DB operations,
 * avoiding foreign key constraint failures and undefined profile references.
 */
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfileData {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  user_type: string | null;
}

/**
 * Safely ensures a row exists in public.profiles for the given authenticated user.
 * If the profile does not exist, it creates one with safe defaults derived from user metadata.
 */
export async function ensureUserProfileExists(
  user: User,
  existingProfile?: UserProfileData | null
): Promise<{ profile: UserProfileData; customerName: string; customerEmail: string }> {
  const customerEmail = user.email || existingProfile?.email || '';
  const customerName =
    existingProfile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    customerEmail.split('@')[0] ||
    'User';

  const userType = existingProfile?.user_type || user.user_metadata?.user_type || 'consumer';
  const avatarUrl = existingProfile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  const phone = existingProfile?.phone || user.phone || null;

  try {
    const { data: fetchedProfile, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchErr) {
      console.warn('Profile lookup warning:', fetchErr.message);
    }

    if (fetchedProfile) {
      return {
        profile: fetchedProfile as UserProfileData,
        customerName: fetchedProfile.full_name || customerName,
        customerEmail: fetchedProfile.email || customerEmail,
      };
    }

    // Upsert profile if missing
    const { data: newProfile, error: upsertErr } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: customerEmail,
        full_name: customerName,
        user_type: userType,
        avatar_url: avatarUrl,
        phone,
        updated_at: new Date().toISOString(),
      } as never)
      .select('*')
      .maybeSingle();

    if (upsertErr) {
      console.error('Failed to create default user profile:', upsertErr);
    }

    const finalProfile: UserProfileData = (newProfile as unknown as UserProfileData) || {
      id: user.id,
      email: customerEmail,
      full_name: customerName,
      user_type: userType,
      avatar_url: avatarUrl,
      phone,
    };

    return {
      profile: finalProfile,
      customerName: finalProfile.full_name || customerName,
      customerEmail: finalProfile.email || customerEmail,
    };
  } catch (err) {
    console.error('Unexpected error ensuring profile existence:', err);
    return {
      profile: {
        id: user.id,
        email: customerEmail,
        full_name: customerName,
        user_type: userType,
        avatar_url: avatarUrl,
        phone,
      },
      customerName,
      customerEmail,
    };
  }
}
