import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BadgeItem {
  badge_key: string;
  badge_name: string;
  badge_icon: string;
  badge_category: string;
  earned_at: string;
}

interface BadgeGridProps {
  badges: BadgeItem[];
}

const BadgeGrid = ({ badges }: BadgeGridProps) => {
  if (badges.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No badges earned yet.
      </p>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {badges.map((badge) => (
          <Tooltip key={badge.badge_key}>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg border bg-muted/40 hover:bg-muted transition-colors cursor-default">
                <span className="text-2xl" role="img" aria-label={badge.badge_name}>
                  {badge.badge_icon}
                </span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-1">
                  {badge.badge_name}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-center">
              <p className="font-medium">{badge.badge_name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {badge.badge_category}
              </p>
              <p className="text-xs text-muted-foreground">
                Earned {formatDate(badge.earned_at)}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default BadgeGrid;
