import { supabase } from "@/integrations/supabase/client";

// Admin allowlist. The backend `is_admin()` RPC (backed by the user_roles table
// + RLS) is the authoritative check; this list is only a client-side convenience
// fallback. Keep it in sync with the signup trigger in supabase/migrations.
const ADMIN_EMAILS = ['kavin@grevya.com'];

export const checkUserRole = async (role: 'admin' | 'moderator' | 'user') => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check admin by email first
    if (role === 'admin' && ADMIN_EMAILS.includes(user.email || '')) {
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

    // Check admin by email
    if (ADMIN_EMAILS.includes(user.email || '')) {
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
