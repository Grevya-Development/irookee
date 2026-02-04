
import { supabase } from "@/integrations/supabase/client";

export const getGuestProfiles = async () => {
  const { data, error } = await supabase
    .from('guest_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching guest profiles:', error);
    throw error;
  }

  return data;
};

export const approveGuestProfile = async (profileId: string) => {
  try {
    // Get the guest profile first
    const { data: profile, error: fetchError } = await supabase
      .from('guest_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (fetchError) throw fetchError;

    // Update the status to approved
    const { error: updateError } = await supabase
      .from('guest_profiles')
      .update({ 
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', profileId);

    if (updateError) throw updateError;

    console.log(`Profile approved for ${profile.email}. They can now sign up and create an account.`);
    return true;
  } catch (error) {
    console.error('Error approving profile:', error);
    throw error;
  }
};

export const rejectGuestProfile = async (profileId: string) => {
  const { error } = await supabase
    .from('guest_profiles')
    .update({ 
      status: 'rejected'
    })
    .eq('id', profileId);

  if (error) {
    console.error('Error rejecting profile:', error);
    throw error;
  }

  return true;
};
