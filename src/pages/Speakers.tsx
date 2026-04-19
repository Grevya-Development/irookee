import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/sections/Footer";
import SearchFilters from "@/components/SearchFilters";
import ExpertCard from "@/components/ExpertCard";
import type { ExpertProfile, SearchFilters as SearchFiltersType } from "@/types/promptpeople";
import { Loader2, Users } from "lucide-react";

const Speakers = () => {
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFiltersType>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExperts();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchExperts = async () => {
    try {
      setLoading(true);

      // If a category filter is selected, we need to join through speaker_categories
      if (filters.category) {
        const { data: speakerIds, error: joinError } = await supabase
          .from("speaker_categories")
          .select("speaker_id")
          .eq("category_id", filters.category);

        if (joinError) throw joinError;

        const ids = (speakerIds || []).map((r) => r.speaker_id);

        if (ids.length === 0) {
          setExperts([]);
          setLoading(false);
          return;
        }

        let query = supabase
          .from("speakers")
          .select("*")
          .eq("verification_status", "verified")
          .in("id", ids);

        query = applyFiltersToQuery(query);
        query = applySorting(query);

        const { data, error } = await query;
        if (error) throw error;

        setExperts(transformSpeakers(data || []));
      } else {
        let query = supabase
          .from("speakers")
          .select("*")
          .eq("verification_status", "verified");

        query = applyFiltersToQuery(query);
        query = applySorting(query);

        const { data, error } = await query;
        if (error) throw error;

        setExperts(transformSpeakers(data || []));
      }
    } catch (err) {
      console.error("Error fetching experts:", err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFiltersToQuery = (query: any) => {
    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`);
    }
    if (filters.language) {
      query = query.contains("languages", [filters.language]);
    }
    if (filters.minRating) {
      query = query.gte("rating", filters.minRating);
    }
    return query;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applySorting = (query: any) => {
    switch (filters.sortBy) {
      case "sessions":
        return query.order("past_events", { ascending: false });
      case "experience":
        return query.order("experience_years", { ascending: false, nullsFirst: false });
      case "rating":
      default:
        return query.order("rating", { ascending: false });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformSpeakers = (data: any[]): ExpertProfile[] => {
    return data.map((speaker) => ({
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
      verification_level:
        speaker.verification_status === "verified"
          ? ("verified" as const)
          : ("basic" as const),
      rating: Number(speaker.rating) || 0,
      total_sessions: speaker.past_events || 0,
      intro_video_url: speaker.video_url,
      kyc_documents: null,
      availability_timezone: null,
      is_instant_available: true,
      created_at: speaker.created_at,
      updated_at: speaker.updated_at,
    }));
  };

  const handleFilterChange = useCallback((newFilters: SearchFiltersType) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 pt-28 pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Browse Experts
          </h1>
          <p className="text-lg text-muted-foreground flex items-center gap-2">
            <Users className="h-5 w-5" />
            {loading
              ? "Loading experts..."
              : `${experts.length} expert${experts.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <SearchFilters
            onFilterChange={handleFilterChange}
            categories={categories}
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : experts.length === 0 ? (
          <div className="text-center py-24">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No experts found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {experts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Speakers;
