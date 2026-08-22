import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isCurrentUserAdmin } from '@/lib/auth';

export interface SpeakerProfile {
  id: string;
  user_id: string | null;
  name: string;
  title: string;
  bio: string | null;
  expertise: string[] | null;
  image_url: string | null;
  profile_photo_url?: string | null;
  rating: number | null;
  hourly_rate: number | null;
  currency: string | null;
  location: string | null;
  languages: string[] | null;
  past_events: number | null;
  is_verified: boolean | null;
  verification_status: string | null;
  badges: string[] | null;
  topics: string[] | null;
  experience_years: number | null;
  company: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  email?: string | null;
  phone?: string | null;
  suspension_reason?: string | null;
  created_at: string;
  updated_at: string;
  categories?: string[];
  is_preview?: boolean;
  is_owner_preview?: boolean;
  is_admin_preview?: boolean;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useExperts(expertId?: string) {
  const [expert, setExpert] = useState<SpeakerProfile | null>(null);
  const [experts, setExperts] = useState<SpeakerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpert = async (id: string) => {
    setLoading(true);
    setError(null);

    if (!UUID_PATTERN.test(id)) {
      setExpert(null);
      setError('Expert not found');
      setLoading(false);
      return;
    }

    try {
      let currentUser = null;
      try {
        if (supabase.auth && typeof supabase.auth.getSession === 'function') {
          const sessionRes = await supabase.auth.getSession();
          currentUser = sessionRes?.data?.session?.user || null;
        }
      } catch {
        currentUser = null;
      }

      const { data, error: fetchError } = await supabase
        .from('speakers')
        .select(`
          *,
          speaker_categories (
            category_id,
            categories ( id, name )
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError || !data) {
        setExpert(null);
        setError('Expert profile unavailable');
        return;
      }

      const isUnapproved = Boolean(
        data.verification_status &&
        data.verification_status !== 'verified'
      );
      const isOwner = Boolean(currentUser?.id && data.user_id === currentUser.id);
      let isAdmin = false;
      if (currentUser && isUnapproved && !isOwner) {
        isAdmin = await isCurrentUserAdmin().catch(() => false);
      }

      // Restrict access for non-verified profiles to owners and admins
      if (isUnapproved && !isOwner && !isAdmin) {
        setExpert(null);
        setError('Expert profile unavailable');
        return;
      }

      const categoriesList = data.speaker_categories
        ? (data.speaker_categories as unknown as { categories: { name: string } | null }[])
            .map((sc) => sc.categories?.name)
            .filter(Boolean)
        : [];

      // Sanitize fields for general public visitors
      const sanitizedData = { ...(data as unknown as Record<string, unknown>) };
      if (!isOwner && !isAdmin) {
        delete sanitizedData.phone;
        delete sanitizedData.email;
        delete sanitizedData.verification_documents;
        delete sanitizedData.suspension_reason;
        delete sanitizedData.suspension_history;
        delete sanitizedData.custom_profession;
      }

      setExpert({
        ...sanitizedData,
        categories: categoriesList,
        is_preview: isUnapproved && (isOwner || isAdmin),
        is_owner_preview: isUnapproved && isOwner,
        is_admin_preview: isUnapproved && isAdmin,
      } as SpeakerProfile);
    } catch (err) {
      console.error('Error fetching expert:', err);
      setExpert(null);
      setError(err instanceof Error ? err.message : 'Expert profile unavailable');
    } finally {
      setLoading(false);
    }
  };

  const fetchExperts = async (limit = 50) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('speakers')
        .select('*')
        .eq('verification_status', 'verified')
        .order('rating', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      
      // Strip private fields from expert list results
      const sanitizedExperts = (data || []).map((exp) => {
        const copy = { ...exp } as Record<string, unknown>;
        delete copy.phone;
        delete copy.email;
        delete copy.verification_documents;
        delete copy.suspension_reason;
        delete copy.suspension_history;
        delete copy.custom_profession;
        return copy as unknown as SpeakerProfile;
      });

      setExperts(sanitizedExperts);
    } catch (err) {
      console.error('Error fetching experts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch experts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expertId) {
      fetchExpert(expertId);
    } else {
      fetchExperts();
    }
  }, [expertId]);

  return { expert, experts, loading, error, refetch: expertId ? () => fetchExpert(expertId) : fetchExperts };
}
