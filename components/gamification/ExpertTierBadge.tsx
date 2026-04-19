import { Badge } from "@/components/ui/badge";

interface ExpertTierBadgeProps {
  tier: number;
}

const TIER_CONFIG: Record<
  number,
  { name: string; icon: string; color: string; bgColor: string; borderColor: string }
> = {
  0: {
    name: "Newcomer",
    icon: "\u{1F331}",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
  },
  1: {
    name: "Rising",
    icon: "\u{2B50}",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
  },
  2: {
    name: "Established",
    icon: "\u{2705}",
    color: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
  },
  3: {
    name: "Trusted",
    icon: "\u{1F3C6}",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-300",
  },
  4: {
    name: "Elite",
    icon: "\u{1F48E}",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
  },
  5: {
    name: "Legend",
    icon: "\u{1F451}",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-300",
  },
};

const ExpertTierBadge = ({ tier }: ExpertTierBadgeProps) => {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG[0];

  return (
    <Badge
      variant="outline"
      className={`${config.bgColor} ${config.color} ${config.borderColor} gap-1`}
    >
      <span>{config.icon}</span>
      <span>{config.name}</span>
    </Badge>
  );
};

export { TIER_CONFIG };
export default ExpertTierBadge;
