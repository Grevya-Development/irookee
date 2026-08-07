import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, LogOut, Mail, Phone, Video, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '@/lib/motion';
import { Link } from 'react-router-dom';
import CountUp from '@/components/ui/CountUp';

interface Booking {
  id: string;
  event_name: string;
  event_date: string;
  duration_hours: number;
  total_amount: number;
  currency: string;
  status: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
  created_at: string;
  meeting_link?: string;
}

const UserDashboard = () => {
  const { user, signOut } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('expertise_bookings')
        .select('*')
        .eq('consumer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your bookings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl space-y-8">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl space-y-8">
      {/* Header Banner */}
      <div className="glass-2 p-6 sm:p-8 rounded-3xl border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" /> Client Portal
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">My Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, <strong className="text-foreground">{user?.email}</strong></p>
        </div>
        <Button onClick={handleSignOut} variant="outline" size="sm" className="rounded-xl font-semibold gap-1.5">
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>

      {/* Metrics Row with CountUp */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-3"
      >
        <motion.div variants={fadeUp}>
          <Card className="glass-card p-6 rounded-2xl">
            <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Bookings</CardTitle>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Calendar className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-4xl font-black text-foreground">
                <CountUp to={bookings.length} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Confirmed & scheduled sessions</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="glass-card p-6 rounded-2xl">
            <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Upcoming Sessions</CardTitle>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Clock className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-4xl font-black text-foreground">
                <CountUp to={bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active upcoming sessions</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="glass-card p-6 rounded-2xl">
            <CardHeader className="p-0 flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Completed Calls</CardTitle>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-4xl font-black text-foreground">
                <CountUp to={bookings.filter(b => b.status === 'completed').length} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Past 1-on-1 consultations</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Bookings List */}
      <Card className="glass-2 rounded-3xl p-6 border-slate-200/80 dark:border-slate-800/80">
        <CardHeader className="p-0 pb-6">
          <CardTitle className="text-xl font-bold">My Scheduled Sessions</CardTitle>
          <CardDescription>
            Manage your expert bookings, view HD meeting links, and track session status.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {bookings.length === 0 ? (
            <div className="text-center py-16 space-y-4 glass-card rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">No Bookings Yet</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Explore our directory of verified experts and founders to book your first 1-on-1 session.
              </p>
              <Link to="/experts">
                <Button className="font-bold rounded-xl shadow-md mt-2">
                  Browse Experts
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="glass-card rounded-2xl p-5 space-y-3 hover:border-indigo-500/30 transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h3 className="font-bold text-base text-foreground">{booking.event_name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                        {formatDate(booking.event_date)}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(booking.status) as any}>
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{booking.duration_hours * 60 || 30} mins</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>Free Platform Session</span>
                    </div>
                    {booking.customer_email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{booking.customer_email}</span>
                      </div>
                    )}
                  </div>

                  {booking.meeting_link && (
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        <Video className="h-4 w-4 text-indigo-500 shrink-0" />
                        <span className="truncate">Meeting Link: {booking.meeting_link}</span>
                      </div>
                      <a
                        href={booking.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shrink-0 transition-colors shadow-sm"
                      >
                        Join Video Call
                      </a>
                    </div>
                  )}

                  {booking.notes && (
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/80">
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Notes:</strong> {booking.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;