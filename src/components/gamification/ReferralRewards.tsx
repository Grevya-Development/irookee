
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Copy, Gift, Share } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ReferralRewardsProps {
  referralCode: string;
  referralsCount: number;
  rewardsEarned: number;
}

const ReferralRewards = ({ referralCode, referralsCount, rewardsEarned }: ReferralRewardsProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join irookee',
        text: `Use my referral code: ${referralCode}`,
        url: `https://irookee.com/signup?ref=${referralCode}`
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Referral Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{referralsCount}</div>
            <div className="text-sm text-gray-600">Successful Referrals</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">${rewardsEarned}</div>
            <div className="text-sm text-gray-600">Rewards Earned</div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Code</label>
          <div className="flex gap-2">
            <Input value={referralCode} readOnly className="bg-gray-50" />
            <Button 
              variant="outline" 
              size="icon"
              onClick={copyReferralCode}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={shareReferral}
            >
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">Referral Bonus</span>
          </div>
          <p className="text-sm text-yellow-700">
            Earn $10 for each successful referral when they make their first booking!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralRewards;
