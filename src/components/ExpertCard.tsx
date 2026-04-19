import { useState } from "react";
import { ExpertProfile } from "@/types/promptpeople";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MapPin, Star, Languages, Calendar, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BookingModal from "./BookingModal";
import { Expert } from "@/types/speaker";

interface ExpertCardProps {
  expert: ExpertProfile;
}

const TIER_LABELS: Record<number, { name: string; color: string }> = {
  0: { name: "New", color: "bg-gray-100 text-gray-600" },
  1: { name: "Rising", color: "bg-blue-100 text-blue-700" },
  2: { name: "Established", color: "bg-green-100 text-green-700" },
  3: { name: "Trusted", color: "bg-yellow-100 text-yellow-700" },
  4: { name: "Elite", color: "bg-purple-100 text-purple-700" },
  5: { name: "Legend", color: "bg-amber-100 text-amber-700" },
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
      <Card className="hover:shadow-lg transition-all duration-200 flex flex-col h-full">
        <CardContent className="p-5 flex-1">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-base">
                {expert.full_name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base leading-tight truncate">
                {expert.full_name || "Expert"}
              </h3>
              <p className="text-sm text-muted-foreground truncate">{expert.title}</p>
            </div>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {expert.verification_level === "verified" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 rounded-full px-2 py-0.5 border border-green-200">
                <Shield className="h-3 w-3" /> Verified
              </span>
            )}
            <span className={`inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5 ${tierConfig.color}`}>
              {tierConfig.name}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-50 rounded-full px-2 py-0.5 border border-green-200">
              Free
            </span>
          </div>

          {/* Bio */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {expert.bio}
          </p>

          {/* Stats */}
          <div className="space-y-1.5 mb-3 text-sm">
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
              <span className="font-medium">{expert.rating}</span>
              <span className="text-muted-foreground">({expert.total_sessions} sessions)</span>
            </div>
            {expert.location && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{expert.location}</span>
              </div>
            )}
            {expert.languages?.length > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Languages className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{expert.languages.slice(0, 3).join(", ")}</span>
              </div>
            )}
            {expert.years_experience && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {expert.years_experience} yrs exp.
              </div>
            )}
          </div>

          {/* Expertise tags */}
          <div className="flex flex-wrap gap-1">
            {expert.industry_expertise?.slice(0, 2).map((skill, i) => (
              <Badge key={i} variant="outline" className="text-xs py-0 px-1.5 font-normal">
                {skill}
              </Badge>
            ))}
            {(expert.industry_expertise?.length || 0) > 2 && (
              <Badge variant="outline" className="text-xs py-0 px-1.5 font-normal">
                +{expert.industry_expertise.length - 2}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-5 pt-0">
          <div className="flex gap-2 w-full">
            <Button size="sm" className="flex-1" onClick={() => setIsBookingModalOpen(true)}>
              Book Now
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/expert/${expert.id}`)}>
              View Profile
            </Button>
          </div>
        </CardFooter>
      </Card>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        speaker={expertForBooking}
      />
    </>
  );
};

export default ExpertCard;
