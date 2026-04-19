import { useState, useEffect, useMemo, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExpertProfile } from "@/types/promptpeople";
import ExpertCard from "./ExpertCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { searchExperts } from "@/lib/searchExperts";

interface ExpertGridProps {
  limit?: number;
  categoryId?: string;
  searchQuery?: string;
}

const ExpertGrid = memo(({ limit = 20, categoryId, searchQuery }: ExpertGridProps) => {
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExperts();
  }, [categoryId, searchQuery, limit]);

  const fetchExperts = async () => {
    try {
      setLoading(true);

      // If there's a search query, use the comprehensive search engine
      if (searchQuery && searchQuery.trim()) {
        const results = await searchExperts(searchQuery);
        setExperts(results.slice(0, limit));
        return;
      }

      // Otherwise, fetch browse listing with optional category filter
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('verification_status', 'verified')
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const transformed: ExpertProfile[] = (data || []).map(speaker => ({
        id: speaker.id,
        user_id: speaker.user_id || '',
        full_name: speaker.name || "Expert",
        title: speaker.title || "",
        bio: speaker.bio || '',
        industry_expertise: speaker.expertise || [],
        years_experience: speaker.experience_years,
        location: speaker.location,
        languages: speaker.languages || [],
        hourly_rate: speaker.hourly_rate,
        status: 'approved' as const,
        verification_level: 'verified' as const,
        rating: Number(speaker.rating) || 0,
        total_sessions: speaker.past_events || 0,
        intro_video_url: speaker.video_url,
        kyc_documents: null,
        availability_timezone: null,
        is_instant_available: true,
        created_at: speaker.created_at,
        updated_at: speaker.updated_at,
      }));

      setExperts(transformed);
    } catch (error) {
      console.error('Error fetching experts:', error);
      toast({ title: "Error", description: "Failed to load experts.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const expertCards = useMemo(() =>
    experts.map((expert) => (
      <ExpertCard key={expert.id} expert={expert} />
    )),
    [experts]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (experts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No experts found. Try a different search.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {expertCards}
    </div>
  );
});

ExpertGrid.displayName = 'ExpertGrid';

export default ExpertGrid;
