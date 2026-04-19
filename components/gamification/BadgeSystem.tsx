
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Star, Users, Calendar } from "lucide-react";

interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  earned: boolean;
  earnedDate?: string;
}

interface BadgeSystemProps {
  userBadges: UserBadge[];
}

const BadgeSystem = ({ userBadges }: BadgeSystemProps) => {
  const earnedBadges = userBadges.filter(badge => badge.earned);
  const availableBadges = userBadges.filter(badge => !badge.earned);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Your Badges ({earnedBadges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {earnedBadges.map((badge) => (
              <div key={badge.id} className="text-center p-4 border rounded-lg bg-primary-50">
                <badge.icon className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                <h4 className="font-semibold text-sm">{badge.name}</h4>
                <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                {badge.earnedDate && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Earned: {badge.earnedDate}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {availableBadges.map((badge) => (
              <div key={badge.id} className="text-center p-4 border rounded-lg bg-gray-50 opacity-60">
                <badge.icon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <h4 className="font-semibold text-sm">{badge.name}</h4>
                <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BadgeSystem;
