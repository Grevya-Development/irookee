import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ExpertProfile } from "@/types/promptpeople";
import ExpertCard from "./ExpertCard";
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpertGridSkeleton } from "@/components/ExpertCardSkeleton";
import { searchExperts, searchExpertsDetailed } from "@/lib/searchExperts";
import type { SearchFilters as SearchFiltersType } from "@/types/promptpeople";

export interface ExpertGridFilters {
  category?: string;
  language?: string;
  location?: string;
  minRating?: number;
  sortBy?: "rating" | "sessions" | "experience";
}

interface ExpertGridProps {
  limit?: number;
  categoryId?: string;
  searchQuery?: string;
  filters?: ExpertGridFilters | SearchFiltersType;
  /** Lets the owner of the filter state reset it. Navigating alone cannot clear
   *  filters, because they live in the parent's React state. */
  onClearFilters?: () => void;
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

const ExpertGrid = memo(({ limit = 20, categoryId, searchQuery, filters = {}, onClearFilters }: ExpertGridProps) => {
  const navigate = useNavigate();
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  /** expert id -> why the search agent matched them */
  const [reasons, setReasons] = useState<Map<string, string[]>>(new Map());

  const category = filters?.category;
  const language = filters?.language;
  const location = filters?.location;
  const minRating = filters?.minRating;
  const sortBy = filters?.sortBy;

  const fetchExperts = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const results = await searchExpertsDetailed({
        category: category || categoryId,
        language,
        location,
        minRating,
        sortBy,
        query: searchQuery,
        limit,
      });

      setExperts(results.map((r) => r.profile));
      setReasons(
        new Map(results.filter((r) => r.reasons.length > 0).map((r) => [r.profile.id, r.reasons]))
      );
    } catch (e) {
      console.error("Error fetching experts:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, limit, category, categoryId, language, location, minRating, sortBy]);

  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  const expertCards = useMemo(
    () =>
      experts.map((expert) => {
        const why = reasons.get(expert.id);
        return (
          <div key={expert.id} className="flex flex-col gap-1.5">
            <ExpertCard expert={expert} />
            {why && why.length > 0 && (
              <p className="flex flex-wrap items-center gap-1.5 px-1 text-xs text-muted-foreground">
                <span className="sr-only">Matched your search because of:</span>
                <span aria-hidden="true">Matched on</span>
                {why.map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary"
                  >
                    {reason}
                  </span>
                ))}
              </p>
            )}
          </div>
        );
      }),
    [experts, reasons]
  );

  const [recommendedExperts, setRecommendedExperts] = useState<ExpertProfile[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);

  useEffect(() => {
    if (experts.length === 0 && !loading) {
      setLoadingRecommended(true);
      searchExperts({ sortBy: "rating", limit: 4 })
        .then((recs) => setRecommendedExperts(recs))
        .catch((err) => console.error("Error fetching recommended experts:", err))
        .finally(() => setLoadingRecommended(false));
    }
  }, [experts.length, loading]);

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
    const suggestedTerms = ["Startups", "Fundraising", "Product Strategy", "AI & ML", "Marketing", "Career Advice"];

    return (
      <div className="space-y-10 py-6">
        <div className="text-center max-w-lg mx-auto p-8 rounded-2xl border bg-card/50 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">No experts match your search</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? `No results found for "${searchQuery}".` : "No experts match the selected filters."} Try refining your query or clear active filters.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                onClearFilters?.();
                navigate("/experts");
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Clear Search & Filters
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Popular Search Suggestions
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedTerms.map((term) => (
                <Button
                  key={term}
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigate(`/experts?q=${encodeURIComponent(term)}`);
                  }}
                  className="text-xs h-7 rounded-full bg-secondary/60 hover:bg-secondary"
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Fallback Recommended Experts */}
        {recommendedExperts.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="text-xl font-bold">Recommended Top Experts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendedExperts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>
          </div>
        )}
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
