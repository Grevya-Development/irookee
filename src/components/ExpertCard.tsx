import { useState } from "react";
import { ExpertProfile } from "@/types/promptpeople";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MapPin, Star, Languages, Calendar, BadgeCheck, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BookingModal from "./BookingModal";
import { Expert } from "@/types/speaker";
import { motion } from "framer-motion";

interface ExpertCardProps {
  expert: ExpertProfile;
}

const TIER_LABELS: Record<number, { name: string; variant: "default" | "secondary" | "warning" | "glow" }> = {
  0: { name: "New", variant: "secondary" },
  1: { name: "Rising", variant: "default" },
  2: { name: "Established", variant: "default" },
  3: { name: "Trusted", variant: "warning" },
  4: { name: "Elite", variant: "glow" },
  5: { name: "Legend", variant: "glow" },
};

const getExpertTier = (level: string, sessions: number): number => {
  if (level !== "verified") return 0;
  if (sessions > 100) return 3;
  if (sessions > 25) return 2;
  if (sessions > 5) return 1;
  return 0;
};

const ExpertCard = ({ expert }: ExpertCardProps) => {
  const navigate = useNavigate();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const tier = getExpertTier(expert.verification_level, expert.total_sessions);
  const tierConfig = TIER_LABELS[tier] || TIER_LABELS[0];

  const expertForBooking: Expert = {
    id: expert.id,
    user_id: expert.user_id,
    name: expert.full_name || "Expert",
    title: expert.title || "Expert",
    bio: expert.bio || "",
    expertise: expert.industry_expertise,
    image_url: null,
    rating: expert.rating,
    hourly_rate: 0,
    currency: "INR",
    availability_start: null,
    availability_end: null,
    location: expert.location,
    languages: expert.languages,
    past_events: expert.total_sessions,
    created_at: expert.created_at,
    updated_at: expert.updated_at,
    is_verified: expert.verification_level === "verified",
    badges: [],
    social_links: {},
    video_url: expert.intro_video_url,
    topics: [],
    preferred_audience: [],
    speaking_fees: { virtual: 0, in_person: 0 },
    travel_preferences: {},
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.2 }}
        className="h-full flex flex-col"
      >
        <Card className="glass-card flex flex-col h-full overflow-hidden border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-5 flex-1 space-y-3.5">
            {/* Header Avatar & Name */}
            <div className="flex items-start gap-3.5">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md ring-2 ring-white dark:ring-slate-900">
                  {expert.full_name?.charAt(0) || "E"}
                </div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-base text-foreground leading-tight truncate">
                    {expert.full_name || "Verified Expert"}
                  </h3>
                  {expert.verification_level === "verified" && (
                    <BadgeCheck className="h-4 w-4 text-indigo-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">
                  {expert.title || "Industry Practitioner"}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={tierConfig.variant}>
                {tierConfig.name}
              </Badge>
              <Badge variant="success">
                Free Session
              </Badge>
              {expert.rating >= 4.9 && (
                <Badge variant="warning">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Top Rated
                </Badge>
              )}
            </div>

            {/* Bio */}
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {expert.bio || "Available for 1-on-1 direct consultation, advice, and guidance sessions."}
            </p>

            {/* Metadata Stats */}
            <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <span>{expert.rating}</span>
                  <span className="text-muted-foreground font-normal">({expert.total_sessions} sessions)</span>
                </div>
                {expert.years_experience && (
                  <div className="flex items-center gap-1 text-slate-500 font-medium">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>{expert.years_experience} yrs exp.</span>
                  </div>
                )}
              </div>

              {expert.location && (
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{expert.location}</span>
                </div>
              )}

              {expert.languages?.length > 0 && (
                <div className="flex items-center gap-1.5 truncate">
                  <Languages className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{expert.languages.slice(0, 3).join(", ")}</span>
                </div>
              )}
            </div>

            {/* Expertise Pills */}
            <div className="flex flex-wrap gap-1 pt-1">
              {expert.industry_expertise?.slice(0, 2).map((skill, i) => (
                <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {skill}
                </span>
              ))}
              {(expert.industry_expertise?.length || 0) > 2 && (
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                  +{(expert.industry_expertise?.length || 0) - 2}
                </span>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-5 pt-0">
            <div className="flex gap-2 w-full">
              <Button size="sm" variant="default" className="flex-1 font-bold gap-1 shadow-sm" onClick={() => setIsBookingModalOpen(true)}>
                <Zap className="h-3.5 w-3.5" /> Book
              </Button>
              <Button size="sm" variant="outline" className="flex-1 font-semibold" onClick={() => navigate(`/expert/${expert.id}`)}>
                Profile
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        speaker={expertForBooking}
      />
    </>
  );
};

export default ExpertCard;
