import { supabase } from "@/integrations/supabase/client";
import { ExpertProfile } from "@/types/promptpeople";

type SpeakerRow = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  name?: string | null;
  title?: string | null;
  bio?: string | null;
  location?: string | null;
  languages?: string[] | null;
  hourly_rate?: number | null;
  rating?: number | null;
  expertise?: string[] | null;
  expertise_areas?: string[] | null;
  topics?: string[] | null;
  verification_status?: string | null;
  is_verified?: boolean | null;
  total_reviews?: number | null;
  past_events?: number | null;
  video_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  speaker_categories?: Array<{
    category_id?: string | null;
    categories?: {
      id?: string | null;
      name?: string | null;
    } | null;
  }> | null;
};

export interface SearchExpertsOptions {
  query?: string;
  categoryId?: string;
  limit?: number;
}

const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();

const normalizeArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

const includesNeedle = (value: unknown, needle: string) => normalize(value).includes(needle);

const arrayIncludesNeedle = (value: unknown, needle: string) =>
  normalizeArray(value).some((item) => includesNeedle(item, needle));

const getExpertise = (speaker: SpeakerRow) =>
  normalizeArray(speaker.expertise_areas).length > 0
    ? normalizeArray(speaker.expertise_areas)
    : normalizeArray(speaker.expertise);

const getCategoryNames = (speaker: SpeakerRow) =>
  (speaker.speaker_categories || [])
    .map((entry) => entry.categories?.name)
    .filter((name): name is string => Boolean(name));

const matchesQuery = (speaker: SpeakerRow, rawQuery: string) => {
  const needle = normalize(rawQuery);
  if (!needle) return true;

  return [
    includesNeedle(speaker.full_name || speaker.name, needle),
    includesNeedle(speaker.title, needle),
    includesNeedle(speaker.bio, needle),
    includesNeedle(speaker.location, needle),
    arrayIncludesNeedle(speaker.languages, needle),
    arrayIncludesNeedle(getExpertise(speaker), needle),
    arrayIncludesNeedle(speaker.topics, needle),
    getCategoryNames(speaker).some((category) => includesNeedle(category, needle)),
  ].some(Boolean);
};

const matchesCategory = (speaker: SpeakerRow, rawCategoryId?: string) => {
  const categoryId = normalize(rawCategoryId);
  if (!categoryId || categoryId === "all") return true;

  return (speaker.speaker_categories || []).some((entry) => {
    return normalize(entry.category_id) === categoryId || normalize(entry.categories?.id) === categoryId;
  });
};

export const mapSpeakerToExpertProfile = (speaker: SpeakerRow): ExpertProfile => ({
  id: speaker.id,
  user_id: speaker.user_id || "",
  full_name: speaker.full_name || speaker.name || "Expert",
  title: speaker.title || "",
  bio: speaker.bio || "",
  industry_expertise: getExpertise(speaker),
  verification_level:
    speaker.verification_status === "verified" || speaker.is_verified
      ? "verified"
      : "basic",
  total_sessions: Number(speaker.total_reviews ?? speaker.past_events) || 0,
  years_experience: null,
  location: speaker.location || null,
  languages: normalizeArray(speaker.languages),
  hourly_rate: speaker.hourly_rate ?? null,
  status: "approved",
  rating: Number(speaker.rating) || 0,
  intro_video_url: speaker.video_url || null,
  kyc_documents: null,
  availability_timezone: null,
  is_instant_available: true,
  created_at: speaker.created_at || new Date().toISOString(),
  updated_at: speaker.updated_at || speaker.created_at || new Date().toISOString(),
});

export const searchExperts = async ({
  query = "",
  categoryId,
  limit = 12,
}: SearchExpertsOptions): Promise<ExpertProfile[]> => {
  const { data, error } = await supabase
    .from("speakers")
    .select(`
      *,
      speaker_categories (
        category_id,
        categories (
          id,
          name
        )
      )
    `)
    .order("rating", { ascending: false })
    .limit(query.trim() || (categoryId && categoryId !== "all") ? 200 : limit);

  if (error) {
    console.error("Error searching experts:", error);
    throw error;
  }

  return ((data || []) as SpeakerRow[])
    .filter((speaker) => matchesCategory(speaker, categoryId))
    .filter((speaker) => matchesQuery(speaker, query))
    .slice(0, limit)
    .map(mapSpeakerToExpertProfile);
};
