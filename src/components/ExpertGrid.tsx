import { useState, useEffect, useMemo, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExpertProfile } from "@/types/promptpeople";
import ExpertCard from "./ExpertCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ExpertGridProps {
  limit?: number;
  categoryId?: string;
  searchQuery?: string;
}

const ExpertGrid = memo(({ limit = 12, categoryId, searchQuery }: ExpertGridProps) => {
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExperts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, searchQuery, limit]);

  const fetchExperts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('speakers')
        .select('id, full_name, name, title, bio, location, languages, hourly_rate, rating, expertise_areas, verification_status, total_reviews, created_at, updated_at')
        .limit(limit);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform speakers data to match ExpertProfile interface
      const transformedExperts: ExpertProfile[] = (data || []).map(speaker => ({
        id: speaker.id,
        user_id: speaker.user_id || '',
        full_name: speaker.full_name ?? speaker.name ?? "Expert",
        title: speaker.title || "",
        bio: speaker.bio || '',
        // industry_expertise: speaker.expertise || [],
        industry_expertise: speaker.expertise_areas || [],
        verification_level:
          speaker.verification_status === 'verified'
            ? 'verified'
            : 'basic',
        total_sessions: speaker.total_reviews || 0,
        years_experience: null,
        location: speaker.location,
        languages: speaker.languages || [],
        hourly_rate: speaker.hourly_rate,
        status: 'approved' as const,
        // verification_level: speaker.is_verified ? 'verified' as const : 'basic' as const,
        rating: Number(speaker.rating) || 0,
        // total_sessions: speaker.past_events || 0,
        intro_video_url: speaker.video_url,
        kyc_documents: null,
        availability_timezone: null,
        is_instant_available: true,
        created_at: speaker.created_at,
        updated_at: speaker.updated_at
      }));
      setExperts(transformedExperts);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load experts. Please try again.",
        variant: "destructive",
      });
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
          No experts found. Try adjusting your search criteria.
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
