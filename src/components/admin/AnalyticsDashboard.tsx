/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Percent
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line
} from "recharts";

type TimeRange = "7d" | "30d" | "90d" | "all";

interface BookingItem {
  created_at: string;
  status: string;
  total_amount: number | null;
}

interface ProfileItem {
  created_at: string;
}

interface SpeakerItem {
  created_at: string;
  verification_status: string;
}

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [loading, setLoading] = useState(true);

  // All-time Point-in-Time Metrics
  const [allTimeStats, setAllTimeStats] = useState({
    totalUsers: 0,
    totalExperts: 0,
    verifiedExperts: 0,
    pendingExperts: 0,
    totalReports: 0,
  });

  // Period-specific Interactive Metrics
  const [periodStats, setPeriodStats] = useState({
    bookings: 0,
    bookingsDiff: 0,
    successRate: 0,
    successRateDiff: 0,
    userGrowth: 0,
    userGrowthDiff: 0,
    expertGrowth: 0,
    expertGrowthDiff: 0,
    revenue: 0,
    revenueDiff: 0,
  });

  // Chart Data
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [bookingOverviewData, setBookingOverviewData] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const safeCount = async (table: string, filters?: Record<string, string>) => {
    try {
      let query = supabase.from(table as never).select('id', { count: 'exact', head: true });
      if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
          query = query.eq(key, val);
        });
      }
      const { count } = await query;
      return count || 0;
    } catch {
      return 0;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch All-Time Point-in-Time Counts
      const [
        totalUsers,
        totalExperts,
        verifiedExperts,
        pendingExperts,
        totalReports
      ] = await Promise.all([
        safeCount("profiles"),
        safeCount("speakers"),
        safeCount("speakers", { verification_status: "verified" }),
        safeCount("speakers", { verification_status: "pending" }),
        safeCount("expert_reports"),
      ]);

      setAllTimeStats({
        totalUsers,
        totalExperts,
        verifiedExperts,
        pendingExperts,
        totalReports,
      });

      // 2. Fetch Time-Series Data Based on Selected Range
      const now = new Date();
      let days = 30;
      if (timeRange === "7d") days = 7;
      else if (timeRange === "90d") days = 90;
      else if (timeRange === "all") days = 365; // Default to past 1 year for all-time trends visualization

      const currentPeriodStart = new Date(now.getTime() - days * 24 * 3600 * 1000);
      const prevPeriodStart = new Date(now.getTime() - days * 2 * 24 * 3600 * 1000);

      // Fetch bookings, profiles, speakers
      const [bookingsRes, profilesRes, speakersRes, categoriesRes] = await Promise.all([
        supabase
          .from("expertise_bookings")
          .select("created_at, status, total_amount")
          .gte("created_at", prevPeriodStart.toISOString()),
        supabase
          .from("profiles")
          .select("created_at")
          .gte("created_at", prevPeriodStart.toISOString()),
        supabase
          .from("speakers")
          .select("created_at, verification_status")
          .gte("created_at", prevPeriodStart.toISOString()),
        supabase
          .from("speaker_categories" as never)
          .select("category_id, categories ( name )"),
      ]);

      const bookings = (bookingsRes.data || []) as BookingItem[];
      const profiles = (profilesRes.data || []) as ProfileItem[];
      const speakers = (speakersRes.data || []) as SpeakerItem[];

      // Filter current vs previous period data
      const currentBookings = bookings.filter(b => new Date(b.created_at) >= currentPeriodStart);
      const prevBookings = bookings.filter(b => new Date(b.created_at) >= prevPeriodStart && new Date(b.created_at) < currentPeriodStart);

      const currentProfiles = profiles.filter(p => new Date(p.created_at) >= currentPeriodStart);
      const prevProfiles = profiles.filter(p => new Date(p.created_at) >= prevPeriodStart && new Date(p.created_at) < currentPeriodStart);

      const currentSpeakers = speakers.filter(s => new Date(s.created_at) >= currentPeriodStart);
      const prevSpeakers = speakers.filter(s => new Date(s.created_at) >= prevPeriodStart && new Date(s.created_at) < currentPeriodStart);

      // Total Bookings metrics
      const currentBookingsCount = currentBookings.length;
      const prevBookingsCount = prevBookings.length;
      const bookingsDiff = prevBookingsCount > 0 ? Math.round(((currentBookingsCount - prevBookingsCount) / prevBookingsCount) * 100) : 0;

      // Success Rate metrics
      const currentCompleted = currentBookings.filter(b => b.status === "completed").length;
      const currentSuccessRate = currentBookingsCount > 0 ? Math.round((currentCompleted / currentBookingsCount) * 100) : 0;
      const prevCompleted = prevBookings.filter(b => b.status === "completed").length;
      const prevSuccessRate = prevBookingsCount > 0 ? Math.round((prevCompleted / prevBookingsCount) * 100) : 0;
      const successRateDiff = currentSuccessRate - prevSuccessRate;

      // User Growth metrics
      const currentUserCount = currentProfiles.length;
      const prevUserCount = prevProfiles.length;
      const userGrowthDiff = prevUserCount > 0 ? Math.round(((currentUserCount - prevUserCount) / prevUserCount) * 100) : 0;

      // Expert Growth metrics
      const currentExpertCount = currentSpeakers.filter(s => s.verification_status === "verified").length;
      const prevExpertCount = prevSpeakers.filter(s => s.verification_status === "verified").length;
      const expertGrowthDiff = prevExpertCount > 0 ? Math.round(((currentExpertCount - prevExpertCount) / prevExpertCount) * 100) : 0;

      // Revenue metrics
      const currentRevenue = currentBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const prevRevenue = prevBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const revenueDiff = prevRevenue > 0 ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100) : 0;

      setPeriodStats({
        bookings: currentBookingsCount,
        bookingsDiff,
        successRate: currentSuccessRate,
        successRateDiff,
        userGrowth: currentUserCount,
        userGrowthDiff,
        expertGrowth: currentExpertCount,
        expertGrowthDiff,
        revenue: currentRevenue,
        revenueDiff,
      });

      // 3. Category distribution
      const catCounts: Record<string, number> = {};
      ((categoriesRes.data || []) as any[]).forEach((row) => {
        const name = row.categories?.name || "Unknown";
        catCounts[name] = (catCounts[name] || 0) + 1;
      });
      setCategoryStats(
        Object.entries(catCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      );

      // 4. Generate Chart Trends Data (aggregate by date)
      const dateMap: Record<string, { bookings: number; completed: number; users: number; experts: number }> = {};
      
      // Initialize date map for selected days
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        dateMap[dateStr] = { bookings: 0, completed: 0, users: 0, experts: 0 };
      }

      currentBookings.forEach((b) => {
        const dateStr = new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (dateMap[dateStr]) {
          dateMap[dateStr].bookings += 1;
          if (b.status === "completed") {
            dateMap[dateStr].completed += 1;
          }
        }
      });

      currentProfiles.forEach((p) => {
        const dateStr = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (dateMap[dateStr]) {
          dateMap[dateStr].users += 1;
        }
      });

      currentSpeakers.forEach((s) => {
        const dateStr = new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (dateMap[dateStr]) {
          dateMap[dateStr].experts += 1;
        }
      });

      const trendChartData = Object.entries(dateMap).map(([date, val]) => ({
        date,
        ...val
      }));
      setTrendsData(trendChartData);

      // 5. Booking Status distribution for bar chart
      const statusCounts = {
        Confirmed: currentBookings.filter(b => b.status === "confirmed").length,
        Completed: currentBookings.filter(b => b.status === "completed").length,
        Cancelled: currentBookings.filter(b => b.status === "cancelled").length,
        "No Show": currentBookings.filter(b => b.status === "no_show").length,
      };
      
      const overviewChartData = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));
      setBookingOverviewData(overviewChartData);

    } catch (error) {
      console.error("Failed to load analytics dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Analyzing stats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. All-time Platform Overview Summary */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <MetricCard value={allTimeStats.totalUsers} label="Total Users" icon={<Users className="h-4 w-4" />} color="border-blue-100 bg-blue-50/30 text-blue-700" />
        <MetricCard value={allTimeStats.totalExperts} label="Total Experts" icon={<Briefcase className="h-4 w-4" />} color="border-indigo-100 bg-indigo-50/30 text-indigo-700" />
        <MetricCard value={allTimeStats.verifiedExperts} label="Verified Experts" icon={<CheckCircle2 className="h-4 w-4" />} color="border-green-100 bg-green-50/30 text-green-700" />
        <MetricCard value={allTimeStats.pendingExperts} label="Pending Review" icon={<Calendar className="h-4 w-4" />} color="border-yellow-100 bg-yellow-50/30 text-yellow-700" />
        <MetricCard value={allTimeStats.totalReports} label="Active Reports" icon={<ShieldAlert className="h-4 w-4" />} color="border-red-100 bg-red-50/30 text-red-700" />
      </motion.div>

      {/* 2. Interactive Insights & Period Filter Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Interactive Insights</h2>
          <p className="text-sm text-muted-foreground">Select a range to filter comparative metrics, charts, and trends.</p>
        </div>
        <Select value={timeRange} onValueChange={(val) => setTimeRange(val as TimeRange)}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Select Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="all">Last 1 Year (All Time)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 3. Period KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Period Bookings"
          value={periodStats.bookings}
          change={periodStats.bookingsDiff}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          unit="bookings"
        />
        <KPICard
          title="Success Rate"
          value={`${periodStats.successRate}%`}
          change={periodStats.successRateDiff}
          icon={<Percent className="h-4 w-4 text-muted-foreground" />}
          isRateComparison
          unit="percentage points"
        />
        <KPICard
          title="New Users"
          value={periodStats.userGrowth}
          change={periodStats.userGrowthDiff}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          unit="registrations"
        />
        <KPICard
          title="Approved Experts"
          value={periodStats.expertGrowth}
          change={periodStats.expertGrowthDiff}
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
          unit="profiles"
        />
        <KPICard
          title="Value Generated"
          value={`₹${periodStats.revenue}`}
          change={periodStats.revenueDiff}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          unit="INR value"
        />
      </div>

      {/* 4. Visual Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trends Chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" /> Booking Trends
              </CardTitle>
              <CardDescription>Daily frequency of total session bookings created vs completed.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" style={{ fontSize: 12 }} />
                  <Area type="monotone" name="Total Booked" dataKey="bookings" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" />
                  <Area type="monotone" name="Completed" dataKey="completed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* User & Expert Growth Trends */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" /> Registration Growth
              </CardTitle>
              <CardDescription>Daily registration volume of seekers and onboarding experts.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" style={{ fontSize: 12 }} />
                  <Line type="monotone" name="New Seekers" dataKey="users" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="New Experts" dataKey="experts" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Overview Status Breakdown Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-indigo-600" /> Booking Overview
              </CardTitle>
              <CardDescription>Total session count distribution partitioned by final status.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingOverviewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="count" name="Sessions" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Expert Categories */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-600" /> Top Categories
              </CardTitle>
              <CardDescription>Visual distribution of active expert profiles by categories.</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryStats.length > 0 ? (
                <div className="space-y-4 pt-2">
                  {categoryStats.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-semibold truncate flex-1 text-gray-700">{cat.name}</span>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="w-32 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-indigo-600 rounded-full h-2 transition-all duration-500"
                            style={{ width: `${Math.min(100, (cat.count / (categoryStats[0]?.count || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-gray-900 font-bold w-6 text-right">{cat.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                  No category distribution data found.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

// All-time Point-in-time Metric Card Helper
function MetricCard({ value, label, icon, color }: { value: number; label: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all border">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="text-3xl font-extrabold tracking-tight">{value}</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
          </div>
          <div className={`p-2.5 rounded-xl border ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Period KPICard Helper with percentage comparison trends
function KPICard({
  title,
  value,
  change,
  icon,
  isRateComparison = false,
  unit = ""
}: {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  isRateComparison?: boolean;
  unit?: string;
}) {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <Card className="hover:shadow-md transition-shadow border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="flex items-center text-xs">
          {isNeutral ? (
            <span className="text-muted-foreground font-medium">Flat vs prev period</span>
          ) : (
            <span className={`flex items-center font-bold gap-0.5 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(change)}{isRateComparison ? 'pp' : '%'}
              <span className="text-muted-foreground font-normal ml-1">vs last period</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AnalyticsDashboard;
