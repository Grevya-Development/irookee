import { useState } from "react";
import { ExpertProfile } from "@/types/promptpeople";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MapPin, Star, Clock, Shield, Languages, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BookingModal from "./BookingModal";
import { Expert } from "@/types/speaker";

interface ExpertCardProps {
  expert: ExpertProfile;
}

const ExpertCard = ({ expert }: ExpertCardProps) => {  
  const navigate = useNavigate();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const getVerificationIcon = (level: string) => {
    switch (level) {
      case 'verified':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'premium':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatRate = (rate: number | null) => {
    if (!rate) return "Contact for pricing";
    return `₹${rate}/hr`;
  };

  // Convert ExpertProfile to Expert for the booking modal
  const expertForBooking: Expert = {
    id: expert.id,
    user_id: expert.user_id,
    name: expert.full_name || "Expert",
    title: expert.title || 'Expert',
    bio: expert.bio || "",
    expertise: expert.industry_expertise,
    image_url: null,
    rating: expert.rating,
    hourly_rate: expert.hourly_rate || 0,
    currency: 'INR',
    availability_start: null,
    availability_end: null,
    location: expert.location,
    languages: expert.languages,
    past_events: expert.total_sessions,
    created_at: expert.created_at,
    updated_at: expert.updated_at,
    is_verified: expert.verification_level === 'verified',
    badges: [expert.verification_level],
    social_links: {},
    video_url: expert.intro_video_url,
    topics: [],
    preferred_audience: [],
    speaking_fees: { virtual: expert.hourly_rate || 0, in_person: (expert.hourly_rate || 0) * 1.5 },
    travel_preferences: {}
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold text-lg">
                  {expert.full_name?.charAt(0) || "U"}
                </span>
              </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {expert.full_name ? expert.full_name : "No Name"}
                  </h3>

                  <p className="text-sm text-primary">
                    {expert.title ? expert.title : ""}
                  </p>
                <div className="flex items-center gap-1">
                  {getVerificationIcon(expert.verification_level)}
                  <span className="text-sm text-muted-foreground capitalize">
                    {expert.verification_level}
                  </span>
                </div>
              </div>
            </div>
            {expert.is_instant_available && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Clock className="h-3 w-3 mr-1" />
                Available Now
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {expert.bio}
          </p>

          <div className="space-y-2 mb-4">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{expert.rating}</span>
              <span className="text-xs text-muted-foreground">
                ({expert.total_sessions} sessions)
              </span>
            </div>

            {/* Location */}
            {expert.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {expert.location}
              </div>
            )}

            {/* Languages */}
            {expert.languages?.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Languages className="h-4 w-4" />
                {expert.languages?.slice(0, 2).join(", ")}
                {expert.languages?.length > 2 && ` +${expert.languages.length - 2}`}
              </div>
            )}

            {/* Experience */}
            {expert.years_experience && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {expert.years_experience} years experience
              </div>
            )}
          </div>

          {/* Expertise Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {expert.industry_expertise?.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {expert.industry_expertise?.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{(expert.industry_expertise?.length || 0) - 3} more
              </Badge>
            )}
          </div>

          <div className="text-lg font-semibold text-primary">
            {formatRate(expert.hourly_rate)}
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <div className="flex gap-2 w-full">
            {expert.is_instant_available && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => setIsBookingModalOpen(true)}
              >
                Book Now
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate(`/speakers?expert=${expert.id}`)}
            >
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
