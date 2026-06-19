import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformStats {
  expertCount: number;
  categoryCount: number;
  avgRating: number;
}

/**
 * Real, live platform stats for the hero section. Replaces the previously
 * hardcoded "20+ / 40+ / 4.8" numbers with verifiable counts so the social
 * proof is credible. Counts use Supabase `head` + `count: 'exact'` so we never
 * download the rows. Cached via react-query (5 min) to keep the landing fast.
 */
async function fetchPlatformStats(): Promise<PlatformStats> {
  const [expertsRes, categoriesRes, ratingsRes] = await Promise.all([
    supabase
      .from("speakers")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "verified"),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase
      .from("speakers")
      .select("rating")
      .eq("verification_status", "verified")
      .not("rating", "is", null),
  ]);

  const ratings = (ratingsRes.data || [])
    .map((r: { rating: number | null }) => Number(r.rating))
    .filter((n) => !Number.isNaN(n) && n > 0);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

  return {
    expertCount: expertsRes.count ?? 0,
    categoryCount: categoriesRes.count ?? 0,
    avgRating: Math.round(avgRating * 10) / 10,
  };
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: fetchPlatformStats,
    staleTime: 5 * 60 * 1000,
  });
}
