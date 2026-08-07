import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Trophy, Star, CalendarCheck, ShieldCheck } from "lucide-react";
import ExpertTierBadge from "./ExpertTierBadge";

interface LeaderboardEntry {
  expert_id: string;
  total_sessions: number;
  avg_rating: number;
  attendance_rate: number;
  on_time_rate: number;
  current_tier: number;
  speaker_name: string | null;
}

type SortMode = "most_booked" | "top_rated" | "most_reliable";

const LeaderboardTable = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SortMode>("most_booked");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      // Determine sort column based on active tab
      let orderColumn: string;
      switch (activeTab) {
        case "top_rated":
          orderColumn = "avg_rating";
          break;
        case "most_reliable":
          orderColumn = "attendance_rate";
          break;
        case "most_booked":
        default:
          orderColumn = "total_sessions";
          break;
      }

      const { data: statsData } = await supabase
        .from("expert_stats")
        .select("expert_id, total_sessions, avg_rating, attendance_rate, on_time_rate, current_tier")
        .order(orderColumn, { ascending: false })
        .limit(20);

      if (!statsData || statsData.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      // Fetch speaker names for the expert IDs
      const expertIds = (statsData as unknown as LeaderboardEntry[]).map(
        (s) => s.expert_id
      );

      const { data: speakersData } = await supabase
        .from("speakers")
        .select("id, name")
        .in("id", expertIds);

      const speakerMap = new Map<string, string>();
      if (speakersData) {
        for (const s of speakersData) {
          speakerMap.set(s.id, s.name);
        }
      }

      const merged: LeaderboardEntry[] = (
        statsData as unknown as LeaderboardEntry[]
      ).map((entry) => ({
        ...entry,
        speaker_name: speakerMap.get(entry.expert_id) ?? null,
      }));

      setEntries(merged);
      setLoading(false);
    };

    fetchLeaderboard();
  }, [activeTab]);

  const renderStars = (rating: number) => {
    const rounded = Math.round(rating * 10) / 10;
    return (
      <span className="flex items-center gap-1">
        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">{rounded.toFixed(1)}</span>
      </span>
    );
  };

  const getRankDisplay = (index: number) => {
    if (index === 0) return <span className="text-lg">🥇</span>;
    if (index === 1) return <span className="text-lg">🥈</span>;
    if (index === 2) return <span className="text-lg">🥉</span>;
    return <span className="text-sm text-muted-foreground font-medium">{index + 1}</span>;
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="text-center py-12">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No leaderboard data available yet.
          </p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Expert</TableHead>
            <TableHead className="text-center">Rating</TableHead>
            <TableHead className="text-center">Sessions</TableHead>
            <TableHead className="text-center hidden sm:table-cell">
              Attendance
            </TableHead>
            <TableHead className="text-right">Tier</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow key={entry.expert_id}>
              <TableCell className="text-center">
                {getRankDisplay(index)}
              </TableCell>
              <TableCell className="font-medium">
                {entry.speaker_name ?? "Unknown Expert"}
              </TableCell>
              <TableCell className="text-center">
                {renderStars(entry.avg_rating)}
              </TableCell>
              <TableCell className="text-center">
                {entry.total_sessions}
              </TableCell>
              <TableCell className="text-center hidden sm:table-cell">
                {Math.round(entry.attendance_rate)}%
              </TableCell>
              <TableCell className="text-right">
                <ExpertTierBadge tier={entry.current_tier} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Expert Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as SortMode)}
        >
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="most_booked" className="gap-1.5">
              <CalendarCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Most Booked</span>
              <span className="sm:hidden">Booked</span>
            </TabsTrigger>
            <TabsTrigger value="top_rated" className="gap-1.5">
              <Star className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Top Rated</span>
              <span className="sm:hidden">Rated</span>
            </TabsTrigger>
            <TabsTrigger value="most_reliable" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Most Reliable</span>
              <span className="sm:hidden">Reliable</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="most_booked">{renderTable()}</TabsContent>
          <TabsContent value="top_rated">{renderTable()}</TabsContent>
          <TabsContent value="most_reliable">{renderTable()}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LeaderboardTable;
