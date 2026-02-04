
import { useState } from "react";
import { Expert } from "@/types/speaker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, DollarSign, Calendar } from "lucide-react";
import BookingModal from "./BookingModal";

interface ExpertCardProps {
  expert: Expert;
}

const ExpertCard = ({ expert }: ExpertCardProps) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6">
        <div className="flex flex-col items-center text-center">
          <img
            src={expert.image_url || "/placeholder.svg"}
            alt={expert.name}
            className="w-20 h-20 rounded-full object-cover mb-4"
          />
          
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {expert.name}
          </h3>
          
          <p className="text-sm text-blue-600 font-medium mb-3">
            {expert.title}
          </p>
          
          {expert.bio && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {expert.bio}
            </p>
          )}
          
          <div className="w-full space-y-3">
            {/* Rating */}
            <div className="flex items-center justify-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{expert.rating}</span>
              <span className="text-xs text-gray-500">({expert.past_events} events)</span>
            </div>
            
            {/* Location */}
            {expert.location && (
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                {expert.location}
              </div>
            )}
            
            {/* Hourly Rate */}
            <div className="flex items-center justify-center gap-1 text-sm text-gray-900 font-medium">
              <DollarSign className="h-4 w-4" />
              ${expert.hourly_rate}/hr
            </div>
            
            {/* Expertise Tags */}
            <div className="flex flex-wrap gap-1 justify-center">
              {expert.expertise.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {expert.expertise.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{expert.expertise.length - 3} more
                </Badge>
              )}
            </div>
            
            {/* Verification Badge */}
            {expert.is_verified && (
              <div className="flex justify-center">
                <Badge className="bg-green-100 text-green-800 text-xs">
                  ✓ Verified Expert
                </Badge>
              </div>
            )}
            
            {/* Languages */}
            {expert.languages.length > 0 && (
              <div className="text-xs text-gray-500">
                Languages: {expert.languages.join(", ")}
              </div>
            )}

            {/* Book Now Button */}
            <Button 
              onClick={() => setIsBookingModalOpen(true)}
              className="w-full mt-4"
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Book Now
            </Button>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        speaker={expert}
      />
    </>
  );
};

export default ExpertCard;
