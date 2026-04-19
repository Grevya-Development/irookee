import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Star,
  Calendar,
  Clock,
  MessageSquare,
  Users,
  BarChart3,
} from "lucide-react";
import ExpertTierBadge, { TIER_CONFIG } from "./ExpertTierBadge";
import BadgeGrid from "./BadgeGrid";

interface ExpertStatsCardProps {
  expertId: string;
}

interface ExpertStats {
  id: string;
  expert_id: string;
  total_sessions: number;
  avg_rating: number;
  attendance_rate: number;
  on_time_rate: number;
  response_rate: number;
  repeat_client_rate: number;
  current_tier: number;
  created_at: string;
}

interface ExpertBadge {
  badge_key: string;
  badge_name: string;
  badge_icon: string;
  badge_category: string;
  earned_at: string;
}

const ExpertStatsCard = ({ expertId }: ExpertStatsCardProps) => {
  const [stats, setStats] = useState<ExpertStats | null>(null);
  const [badges, setBadges] = useState<ExpertBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [statsResult, badgesResult] = await Promise.all([
        supabase
          .from("expert_stats")
          .select("*")
          .eq("expert_id", expertId)
          .maybeSingle(),
        supabase
          .from("expert_badges")
          .select("badge_key, badge_name, badge_icon, badge_category, earned_at")
          .eq("expert_id", expertId)
          .order("earned_at", { ascending: false }),
      ]);

      if (statsResult.data) {
        setStats(statsResult.data as unknown as ExpertStats);
      }

      if (badgesResult.data) {
        setBadges(badgesResult.data as unknown as ExpertBadge[]);
      }

      setLoading(false);
    };

    if (expertId) {
      fetchData();
    }
  }, [expertId]);

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
          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No stats available yet for this expert.
          </p>
        </CardContent>
      </Card>
    );
  }

  const tierConfig = TIER_CONFIG[stats.current_tier] ?? TIER_CONFIG[0];

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.5;
    const stars: React.ReactNode[] = [];

    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 fill-yellow-400 text-yellow-400"
          />
        );
      } else if (i === full && hasHalf) {
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 fill-yellow-400/50 text-yellow-400"
          />
        );
      } else {
        stars.push(
          <Star key={i} className="h-4 w-4 text-gray-300" />
        );
      }
    }

    return stars;
  };

  const rateRow = (
    label: string,
    value: number,
    icon: React.ReactNode
  ) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-medium">{Math.round(value)}%</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Expert Stats
          </CardTitle>
          <ExpertTierBadge tier={stats.current_tier} />
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
              {tierConfig.name} Tier
            </p>
            <p className="text-xs text-muted-foreground">
              Current expert level
            </p>
          </div>
        </div>

        {/* Key stats row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{stats.total_sessions}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              Total Sessions
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              {renderStars(stats.avg_rating)}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.avg_rating.toFixed(1)} Rating
            </div>
          </div>
        </div>

        {/* Rate metrics */}
        <div className="space-y-3">
          {rateRow(
            "Attendance",
            stats.attendance_rate,
            <Clock className="h-3.5 w-3.5" />
          )}
          {rateRow(
            "On-time",
            stats.on_time_rate,
            <Clock className="h-3.5 w-3.5" />
          )}
          {rateRow(
            "Response",
            stats.response_rate,
            <MessageSquare className="h-3.5 w-3.5" />
          )}
          {rateRow(
            "Repeat Clients",
            stats.repeat_client_rate,
            <Users className="h-3.5 w-3.5" />
          )}
        </div>

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

        {/* Member since */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Member since{" "}
            {new Date(stats.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpertStatsCard;
