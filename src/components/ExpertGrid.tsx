import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExpertProfile } from "@/types/promptpeople";
import ExpertCard from "./ExpertCard";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpertGridSkeleton } from "@/components/ExpertCardSkeleton";
import { searchExperts } from "@/lib/searchExperts";

export interface ExpertGridFilters {
  category?: string;
  language?: string;
  location?: string;
  minRating?: number;
  sortBy?: "rating" | "sessions" | "experience";
}

interface ExpertGridProps {
  limit?: number;
  searchQuery?: string;
  filters?: ExpertGridFilters;
}

interface RawSpeaker {
  id: string;
  user_id: string | null;
  name: string | null;
  title: string | null;
  bio: string | null;
  expertise: string[] | null;
  experience_years: number | null;
  location: string | null;
  languages: string[] | null;
  hourly_rate: number | null;
  rating: number | string | null;
  past_events: number | null;
  is_verified: boolean | null;
  video_url: string | null;
  created_at: string;
  updated_at: string;
  speaker_categories?: { categories: { id: string; name: string } | null }[];
}

const transform = (speaker: RawSpeaker): ExpertProfile => ({
  id: speaker.id,
  user_id: speaker.user_id || "",
  full_name: speaker.name || "Expert",
  title: speaker.title || "",
  bio: speaker.bio || "",
  industry_expertise: speaker.expertise || [],
  years_experience: speaker.experience_years,
  location: speaker.location,
  languages: speaker.languages || [],
  hourly_rate: speaker.hourly_rate,
  status: "approved" as const,
  // The "Verified" tick reflects the admin-granted is_verified badge, not the
  // listing/approval status.
  verification_level: speaker.is_verified ? ("verified" as const) : ("basic" as const),
  rating: Number(speaker.rating) || 0,
  total_sessions: speaker.past_events || 0,
  intro_video_url: speaker.video_url,
  kyc_documents: null,
  availability_timezone: null,
  is_instant_available: true,
  created_at: speaker.created_at,
  updated_at: speaker.updated_at,
});

const ExpertGrid = memo(({ limit = 20, searchQuery, filters }: ExpertGridProps) => {
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { category, language, location, minRating, sortBy } = filters || {};

  const fetchExperts = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      // Free-text search path uses the relevance search engine.
      if (searchQuery && searchQuery.trim()) {
        const results = await searchExperts(searchQuery);
        setExperts(results.slice(0, limit));
        return;
      }

      const { data, error: dbError } = await supabase
        .from("speakers")
        .select("*, speaker_categories(categories(id, name))")
        .eq("verification_status", "verified");

      if (dbError) throw dbError;

      let rows = (data || []) as unknown as RawSpeaker[];

      // Apply filters client-side (small dataset; keeps filtering robust).
      if (category) {
        const cat = category.toLowerCase();
        rows = rows.filter((r) =>
          (r.speaker_categories || []).some(
            (sc) =>
              sc.categories?.id === category ||
              sc.categories?.name?.toLowerCase() === cat
          )
        );
      }
      if (language) {
        const l = language.toLowerCase();
        rows = rows.filter((r) =>
          (r.languages || []).some((lang) => lang.toLowerCase().includes(l))
        );
      }
      if (location) {
        const loc = location.toLowerCase();
        rows = rows.filter((r) => (r.location || "").toLowerCase().includes(loc));
      }
      if (minRating) {
        rows = rows.filter((r) => (Number(r.rating) || 0) >= minRating);
      }

      rows.sort((a, b) => {
        if (sortBy === "sessions") return (b.past_events || 0) - (a.past_events || 0);
        if (sortBy === "experience")
          return (b.experience_years || 0) - (a.experience_years || 0);
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      });

      setExperts(rows.slice(0, limit).map(transform));
    } catch (e) {
      console.error("Error fetching experts:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, limit, category, language, location, minRating, sortBy]);

  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  const expertCards = useMemo(
    () => experts.map((expert) => <ExpertCard key={expert.id} expert={expert} />),
    [experts]
  );

  if (loading) {
    return <ExpertGridSkeleton count={Math.min(limit, 8)} />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <p className="text-lg font-medium mb-1">Couldn't load experts</p>
        <p className="text-muted-foreground mb-4">
          Something went wrong while fetching experts. Please try again.
        </p>
        <Button variant="outline" onClick={fetchExperts}>
          Retry
        </Button>
      </div>
    );
  }

  if (experts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No experts found. Try adjusting your filters or search.
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

ExpertGrid.displayName = "ExpertGrid";

export default ExpertGrid;
