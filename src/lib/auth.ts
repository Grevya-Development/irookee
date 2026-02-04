import { supabase } from "@/integrations/supabase/client";

export const checkUserRole = async (role: 'admin' | 'moderator' | 'user') => {
  try {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: (await supabase.auth.getUser()).data.user?.id,
      _role: role
    });

    if (error) {
      console.error('Error checking user role:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
};

export const isCurrentUserAdmin = async () => {
  try {
    const { data, error } = await supabase.rpc('is_admin');

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};