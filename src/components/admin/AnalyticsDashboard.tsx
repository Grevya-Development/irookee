import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({
    totalExperts: 0,
    verifiedExperts: 0,
    pendingExperts: 0,
    rejectedExperts: 0,
    totalBookings: 0,
    completedBookings: 0,
    confirmedBookings: 0,
    noShowBookings: 0,
    cancelledBookings: 0,
    totalCategories: 0,
    avgRating: 0,
    totalReviews: 0,
    totalUsers: 0,
  });
  const [categoryStats, setCategoryStats] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const safeCount = async (table: string, filters?: Record<string, string>) => {
    try {
      let query = supabase.from(table as any).select('id', { count: 'exact', head: true });
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

  const fetchAnalytics = async () => {
    try {
      const [
        totalExperts, verifiedExperts, pendingExperts, rejectedExperts,
        totalBookings, completedBookings, confirmedBookings, noShowBookings, cancelledBookings,
        totalCategories, totalReviews, totalUsers,
      ] = await Promise.all([
        safeCount('speakers'),
        safeCount('speakers', { verification_status: 'verified' }),
        safeCount('speakers', { verification_status: 'pending' }),
        safeCount('speakers', { verification_status: 'rejected' }),
        safeCount('expertise_bookings'),
        safeCount('expertise_bookings', { status: 'completed' }),
        safeCount('expertise_bookings', { status: 'confirmed' }),
        safeCount('expertise_bookings', { status: 'no_show' }),
        safeCount('expertise_bookings', { status: 'cancelled' }),
        safeCount('categories'),
        safeCount('reviews'),
        safeCount('profiles'),
      ]);

      // Average rating
      let avgRating = 0;
      try {
        const { data: ratings } = await supabase.from('speakers').select('rating').not('rating', 'is', null).gt('rating', 0);
        if (ratings && ratings.length > 0) {
          avgRating = Math.round((ratings.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / ratings.length) * 10) / 10;
        }
      } catch { /* ignore */ }

      // Category distribution
      try {
        const { data: catData } = await supabase.from('speaker_categories' as any).select('category_id, categories ( name )');
        const catCounts: Record<string, number> = {};
        (catData || []).forEach((row: any) => {
          const name = row.categories?.name || 'Unknown';
          catCounts[name] = (catCounts[name] || 0) + 1;
        });
        setCategoryStats(
          Object.entries(catCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        );
      } catch { /* ignore */ }

      setStats({
        totalExperts, verifiedExperts, pendingExperts, rejectedExperts,
        totalBookings, completedBookings, confirmedBookings, noShowBookings, cancelledBookings,
        totalCategories, avgRating, totalReviews, totalUsers,
      });
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const successRate = stats.totalBookings > 0 ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Platform Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard value={stats.totalUsers} label="Total Users" color="text-blue-600" />
        <MetricCard value={stats.totalExperts} label="Total Experts" color="text-indigo-600" />
        <MetricCard value={stats.verifiedExperts} label="Verified" color="text-green-600" />
        <MetricCard value={stats.pendingExperts} label="Pending Review" color="text-yellow-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expert Breakdown */}
        <Card>
          <CardHeader><CardTitle>Expert Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatusBar label="Verified" count={stats.verifiedExperts} total={stats.totalExperts} color="bg-green-500" />
              <StatusBar label="Pending" count={stats.pendingExperts} total={stats.totalExperts} color="bg-yellow-500" />
              <StatusBar label="Rejected" count={stats.rejectedExperts} total={stats.totalExperts} color="bg-red-500" />
            </div>
          </CardContent>
        </Card>

        {/* Booking Breakdown */}
        <Card>
          <CardHeader><CardTitle>Booking Overview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg">
                <div className="text-2xl font-bold">{stats.totalBookings}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.confirmedBookings}</div>
                <div className="text-xs text-muted-foreground">Confirmed</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.completedBookings}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.noShowBookings}</div>
                <div className="text-xs text-muted-foreground">No Shows</div>
              </div>
            </div>
            {stats.totalBookings > 0 && (
              <div className={`p-3 rounded-lg ${successRate >= 70 ? 'bg-green-50' : successRate >= 40 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                <div className={`text-lg font-bold ${successRate >= 70 ? 'text-green-700' : successRate >= 40 ? 'text-yellow-700' : 'text-red-700'}`}>
                  {successRate}% Success Rate
                </div>
                <div className="text-xs text-muted-foreground">{stats.completedBookings} completed of {stats.totalBookings} total</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ratings */}
        <Card>
          <CardHeader><CardTitle>Platform Quality</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.avgRating || '—'}</div>
                <div className="text-xs text-muted-foreground">Avg Rating</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <div className="text-2xl font-bold">{stats.totalReviews}</div>
                <div className="text-xs text-muted-foreground">Reviews</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.totalCategories}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader><CardTitle>Top Categories</CardTitle></CardHeader>
          <CardContent>
            {categoryStats.length > 0 ? (
              <div className="space-y-2">
                {categoryStats.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate flex-1">{cat.name}</span>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="w-24 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-primary rounded-full h-1.5" style={{ width: `${Math.min(100, (cat.count / (categoryStats[0]?.count || 1)) * 100)}%` }} />
                      </div>
                      <span className="text-muted-foreground w-6 text-right">{cat.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No category data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function MetricCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium w-20">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} rounded-full h-2 transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
    </div>
  );
}

export default AnalyticsDashboard;
