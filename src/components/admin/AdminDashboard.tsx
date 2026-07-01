import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, Calendar, TrendingUp, Activity, ShieldAlert, Database, DollarSign, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import UserManagement from "./UserManagement";
import ExpertApproval from "./ExpertApproval";
import PaymentTracking from "./PaymentTracking";
import AnalyticsDashboard from "./AnalyticsDashboard";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExperts: 0,
    activeExperts: 0,
    totalBookings: 0,
    pendingVerifications: 0,
    revenue: 0,
    databaseOnline: false,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const [profilesRes, totalExpertsRes, verifiedExpertsRes, bookingsRes, pendingRes, revenueRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('speakers').select('id', { count: 'exact', head: true }),
        supabase.from('speakers').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        supabase.from('expertise_bookings').select('id', { count: 'exact', head: true }),
        supabase.from('speakers').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('expertise_bookings').select('total_amount').neq('status', 'cancelled'),
      ]);

      const firstError = profilesRes.error || totalExpertsRes.error || verifiedExpertsRes.error || bookingsRes.error || pendingRes.error || revenueRes.error;
      if (firstError) throw firstError;

      const revenue = (revenueRes.data || []).reduce((sum, booking) => sum + (Number(booking.total_amount) || 0), 0);

      setStats({
        totalUsers: profilesRes.count || 0,
        totalExperts: totalExpertsRes.count || 0,
        activeExperts: verifiedExpertsRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        pendingVerifications: pendingRes.count || 0,
        revenue,
        databaseOnline: true,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setStatsError(error instanceof Error ? error.message : 'Could not load admin dashboard stats');
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Production operations, approvals, bookings, and platform health</p>
          </div>
          <Badge variant={stats.databaseOnline ? "default" : "destructive"} className="w-fit">
            <Activity className="h-3 w-3 mr-1" />
            {stats.databaseOnline ? "Supabase connected" : "Connection issue"}
          </Badge>
        </div>

        {statsError && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4 text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {statsError}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-7 gap-4 mb-8">
          <StatCard title="Total Users" value={stats.totalUsers} description="Registered users" icon={<Users className="h-4 w-4 text-muted-foreground" />} loading={statsLoading} />
          <StatCard title="Total Experts" value={stats.totalExperts} description="All expert profiles" icon={<Users className="h-4 w-4 text-muted-foreground" />} loading={statsLoading} />
          <StatCard title="Verified Experts" value={stats.activeExperts} description="Approved & active" icon={<UserCheck className="h-4 w-4 text-muted-foreground" />} loading={statsLoading} />
          <StatCard title="Pending Experts" value={stats.pendingVerifications} description="Awaiting review" icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} loading={statsLoading} />
          <StatCard title="Total Bookings" value={stats.totalBookings} description="All-time sessions" icon={<Calendar className="h-4 w-4 text-muted-foreground" />} loading={statsLoading} />
          <StatCard title="Revenue" value={`INR ${stats.revenue.toLocaleString('en-IN')}`} description="Recorded bookings" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} loading={statsLoading} />
          <StatCard title="Health" value={stats.databaseOnline ? "OK" : "Down"} description="Platform checks" icon={<Database className="h-4 w-4 text-muted-foreground" />} loading={statsLoading} />
        </div>

        <Tabs defaultValue="experts" className="space-y-4">
          <TabsList className="h-auto flex flex-wrap justify-start">
            <TabsTrigger value="experts">Expert Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="health">System Health</TabsTrigger>
          </TabsList>

          <TabsContent value="experts">
            <ExpertApproval />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="bookings">
            <PaymentTracking />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="moderation">
            <PlatformModeration />
          </TabsContent>

          <TabsContent value="health">
            <SystemHealth databaseOnline={stats.databaseOnline} statsError={statsError} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

function StatCard({
  title,
  value,
  description,
  icon,
  loading,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: ReactNode;
  loading: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PlatformModeration() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Reported Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active user reports found.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Reported Experts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active expert reports found.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Suspicious Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Future-ready queue for fraud, spam, and abuse signals.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SystemHealth({ databaseOnline, statsError }: { databaseOnline: boolean; statsError: string | null }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant={databaseOnline ? "default" : "destructive"}>
            {databaseOnline ? "Connected" : "Needs attention"}
          </Badge>
          <p className="text-sm text-muted-foreground">
            {statsError || "Core Supabase read checks are responding."}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Error Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Console and runtime errors should be monitored through deployment logs until a dedicated error service is connected.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminDashboard;
