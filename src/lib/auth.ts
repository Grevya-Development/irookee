import { supabase } from "@/integrations/supabase/client";

// Admin allowlist. The backend `is_admin()` RPC (backed by the user_roles table
// + RLS) is the authoritative check; this list is only a client-side convenience
// fallback. Keep it in sync with the signup trigger in supabase/migrations.
const ADMIN_EMAILS = ['kavin@grevya.com'];

export const checkUserRole = async (role: 'admin' | 'moderator' | 'user') => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const userEmail = (user.email || '').toLowerCase().trim();

    // Check admin by email allowlist
    if (role === 'admin' && ADMIN_EMAILS.some(e => e.toLowerCase().trim() === userEmail)) {
      return true;
    }

    // Check profile table user_type
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .maybeSingle();

    if (role === 'admin' && profile?.user_type === 'admin') {
      return true;
    }

    // Try RPC if available
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: role
      });
      if (!error && data) return true;
    } catch {
      // RPC not available, fall through
    }

    return false;
  } catch {
    return false;
  }
};

export const isCurrentUserAdmin = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const userEmail = (user.email || '').toLowerCase().trim();

    // Check admin by email allowlist
    if (ADMIN_EMAILS.some(e => e.toLowerCase().trim() === userEmail)) {
      return true;
    }

    // Check profile table user_type
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.user_type === 'admin') {
      return true;
    }

    // Try RPC if available
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (!error && data) return true;
    } catch {
      // RPC not available
    }

    return false;
  } catch {
    return false;
  }
};

export interface UserDestinationInfo {
  defaultPath: string;
  isExpert: boolean;
  isAdmin: boolean;
  isSuspended: boolean;
  expertStatus: string | null;
}

export const getAuthenticatedUserDestination = async (userId?: string): Promise<UserDestinationInfo> => {
  try {
    let targetUserId = userId;
    let userEmail = '';

    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          defaultPath: '/dashboard',
          isExpert: false,
          isAdmin: false,
          isSuspended: false,
          expertStatus: null,
        };
      }
      targetUserId = user.id;
      userEmail = (user.email || '').toLowerCase().trim();
    }

    // Check admin allowlist
    const isAdminEmail = userEmail ? ADMIN_EMAILS.some(e => e.toLowerCase().trim() === userEmail) : false;

    // Parallel fetch for profile and speaker records
    const [profileRes, speakerRes] = await Promise.all([
      supabase.from('profiles').select('user_type').eq('id', targetUserId).maybeSingle(),
      supabase.from('speakers').select('id, verification_status').eq('user_id', targetUserId).maybeSingle(),
    ]);

    const userType = profileRes.data?.user_type;
    const speaker = speakerRes.data;
    const isSuspended = userType === 'suspended' || speaker?.verification_status === 'suspended';
    const isAdmin = isAdminEmail || userType === 'admin';
    const isExpert = userType === 'expert' || Boolean(speaker && speaker.verification_status === 'verified');
    const hasExpertApplication = Boolean(speaker);

    let defaultPath = '/dashboard';
    if (isAdmin) {
      defaultPath = '/admin';
    } else if (isExpert || hasExpertApplication) {
      defaultPath = '/expert/dashboard';
    } else {
      defaultPath = '/dashboard';
    }

    return {
      defaultPath,
      isExpert,
      isAdmin,
      isSuspended,
      expertStatus: speaker?.verification_status || null,
    };
  } catch (error) {
    console.error('Error resolving user destination:', error);
    return {
      defaultPath: '/dashboard',
      isExpert: false,
      isAdmin: false,
      isSuspended: false,
      expertStatus: null,
    };
  }
};

