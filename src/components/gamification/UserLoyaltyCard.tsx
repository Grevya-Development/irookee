import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Coins,
  Calendar,
  AlertTriangle,
  Compass,
  Heart,
} from "lucide-react";
import BadgeGrid from "./BadgeGrid";

interface UserLoyaltyCardProps {
  userId: string;
}

interface UserStats {
  id: string;
  user_id: string;
  loyalty_tier: number;
  rookee_points: number;
  sessions_attended: number;
  attendance_rate: number;
  no_show_count: number;
  categories_explored: number;
  created_at: string;
}

interface UserBadge {
  badge_key: string;
  badge_name: string;
  badge_icon: string;
  badge_category: string;
  earned_at: string;
}

const LOYALTY_TIERS: Record<
  number,
  { name: string; icon: string; color: string; bgColor: string; borderColor: string }
> = {
  0: {
    name: "Explorer",
    icon: "\u{1F535}",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
  },
  1: {
    name: "Seeker",
    icon: "\u{1F7E2}",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
  },
  2: {
    name: "Achiever",
    icon: "\u{1F7E1}",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-300",
  },
  3: {
    name: "Champion",
    icon: "\u{1F7E0}",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
  },
  4: {
    name: "Legend",
    icon: "\u{1F534}",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
  },
};

const UserLoyaltyCard = ({ userId }: UserLoyaltyCardProps) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [statsResult, badgesResult] = await Promise.all([
        supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("user_badges")
          .select("badge_key, badge_name, badge_icon, badge_category, earned_at")
          .eq("user_id", userId)
          .order("earned_at", { ascending: false }),
      ]);

      if (statsResult.data) {
        setStats(statsResult.data as unknown as UserStats);
      }

      if (badgesResult.data) {
        setBadges(badgesResult.data as unknown as UserBadge[]);
      }

      setLoading(false);
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Heart className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No loyalty data available yet. Start attending sessions to earn
            points!
          </p>
        </CardContent>
      </Card>
    );
  }

  const tierConfig = LOYALTY_TIERS[stats.loyalty_tier] ?? LOYALTY_TIERS[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Loyalty Status
          </CardTitle>
          <Badge
            variant="outline"
            className={`${tierConfig.bgColor} ${tierConfig.color} ${tierConfig.borderColor} gap-1`}
          >
            <span>{tierConfig.icon}</span>
            <span>{tierConfig.name}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tier highlight */}
        <div
          className={`flex items-center gap-3 p-3 rounded-lg ${tierConfig.bgColor}`}
        >
          <span className="text-3xl">{tierConfig.icon}</span>
          <div>
            <p className={`font-semibold ${tierConfig.color}`}>
              {tierConfig.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Your current loyalty tier
            </p>
          </div>
        </div>

        {/* Rookee Points */}
        <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/10">
          <Coins className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
          <div className="text-3xl font-bold text-primary">
            {stats.rookee_points.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Rookee Points</div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-xl font-bold">{stats.sessions_attended}</div>
            <div className="text-xs text-muted-foreground">
              Sessions Attended
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Compass className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-xl font-bold">{stats.categories_explored}</div>
            <div className="text-xs text-muted-foreground">
              Categories Explored
            </div>
          </div>
        </div>

        {/* Attendance rate */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Attendance Rate</span>
            <span className="font-medium">
              {Math.round(stats.attendance_rate)}%
            </span>
          </div>
          <Progress value={stats.attendance_rate} className="h-1.5" />
        </div>

        {/* No-show warning */}
        {stats.no_show_count > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {stats.no_show_count} no-show{stats.no_show_count > 1 ? "s" : ""}{" "}
              recorded
            </span>
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Badges Earned</h4>
              <Badge variant="secondary" className="text-xs">
                {badges.length}
              </Badge>
            </div>
            <BadgeGrid badges={badges} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserLoyaltyCard;
