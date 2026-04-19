
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Coins, Gift } from "lucide-react";

interface LoyaltyPointsProps {
  currentPoints: number;
  nextRewardThreshold: number;
  totalEarned: number;
}

const LoyaltyPoints = ({ currentPoints, nextRewardThreshold, totalEarned }: LoyaltyPointsProps) => {
  const progressPercentage = (currentPoints / nextRewardThreshold) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-600" />
          Loyalty Points
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-600">{currentPoints}</div>
          <div className="text-sm text-gray-600">Current Points</div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to next reward</span>
            <span>{currentPoints}/{nextRewardThreshold}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-xl font-semibold">{totalEarned}</div>
            <div className="text-xs text-gray-600">Total Earned</div>
          </div>
          <div className="text-center">
            <Gift className="w-6 h-6 mx-auto mb-1 text-green-600" />
            <div className="text-xs text-gray-600">Next Reward</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoyaltyPoints;
