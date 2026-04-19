import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvailabilityManager } from './AvailabilityManager'
import { Calendar, Star, Users, TrendingUp, Clock, UserX, CheckCircle, Video, ExternalLink, XCircle, ThumbsUp, MessageSquare, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Navigation from '@/components/Navigation'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import ExpertStatsCard from '@/components/gamification/ExpertStatsCard'
import ExpertTierBadge from '@/components/gamification/ExpertTierBadge'

interface BookingRow {
  id: string
  event_name: string
  event_date: string | null
  duration_hours: number | null
  status: string | null
  customer_name: string | null
  customer_email: string | null
  notes: string | null
  meeting_link: string | null
  created_at: string
}

export function ExpertDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [expertProfile, setExpertProfile] = useState<Record<string, unknown> | null>(null)
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedSessions: 0,
    averageRating: 0,
    upcomingSessions: 0,
    noShows: 0,
  })

  useEffect(() => {
    if (user) {
      loadExpertProfile()
    }
  }, [user])

  const loadExpertProfile = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error

      if (!data) {
        navigate('/expert/onboarding')
        return
      }

      setExpertProfile(data)
      loadStats(data.id)
    } catch (error) {
      console.error('Error loading expert profile:', error)
    }
  }

  const loadStats = async (expertId: string) => {
    try {
      const { data: bookings } = await supabase
        .from('expertise_bookings')
        .select('*')
        .eq('expert_id', expertId)

      const allBookings = bookings || []
      const completed = allBookings.filter(b => b.status === 'completed').length
      const noShows = allBookings.filter(b => b.status === 'no_show').length
      const upcoming = allBookings.filter(b => {
        return b.status === 'confirmed' && b.event_date && new Date(b.event_date) > new Date()
      }).length

      const { data: expertData } = await supabase
        .from('speakers')
        .select('rating')
        .eq('id', expertId)
        .single()

      setStats({
        totalBookings: allBookings.length,
        completedSessions: completed,
        averageRating: Number(expertData?.rating) || 0,
        upcomingSessions: upcoming,
        noShows,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  if (!expertProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
      </Button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expert Dashboard</h1>
          <p className="text-muted-foreground">Manage your profile, availability, and sessions</p>
        </div>
        <Badge
          variant={
            expertProfile.verification_status === 'verified' ? 'default' :
            expertProfile.verification_status === 'pending' ? 'secondary' :
            'destructive'
          }
          className="text-sm"
        >
          {expertProfile.verification_status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
          {String(expertProfile.verification_status || 'pending')}
        </Badge>
      </div>

      {expertProfile.verification_status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>Verification Pending:</strong> Your profile is under review. Once verified, people can discover and book sessions with you.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.upcomingSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Shows</CardTitle>
            <UserX className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.noShows}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="stats">Stats & Badges</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <BookingsList expertId={String(expertProfile.id)} />
        </TabsContent>

        <TabsContent value="availability">
          <AvailabilityManager expertId={String(expertProfile.id)} />
        </TabsContent>

        <TabsContent value="stats">
          <ExpertStatsCard expertId={String(expertProfile.id)} />
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expert Profile</CardTitle>
              <CardDescription>Your public profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-lg">{String(expertProfile.name)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Title</p>
                  <p className="text-lg">{String(expertProfile.title)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p>{String(expertProfile.location || 'Not set')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Experience</p>
                  <p>{expertProfile.experience_years ? `${expertProfile.experience_years} years` : 'Not set'}</p>
                </div>
              </div>
              {expertProfile.expertise && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expertise</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(expertProfile.expertise as string[]).map((area: string, index: number) => (
                      <Badge key={index} variant="outline">{area}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {expertProfile.bio && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bio</p>
                  <p className="text-sm">{String(expertProfile.bio)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}

function BookingsList({ expertId }: { expertId: string }) {
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    fetchBookings()
  }, [expertId])

  const fetchBookings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('expertise_bookings')
      .select('*')
      .eq('expert_id', expertId)
      .order('event_date', { ascending: false })

    if (error) {
      console.error("Error:", error)
    } else {
      const bookingsData = (data || []) as BookingRow[]
      setBookings(bookingsData)

      // Check which completed bookings have reviews
      const completedIds = bookingsData
        .filter(b => b.status === 'completed')
        .map(b => b.id)

      if (completedIds.length > 0) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('booking_id')
          .in('booking_id', completedIds)

        if (reviews) {
          setReviewedBookingIds(new Set(
            reviews.map(r => r.booking_id).filter((id): id is string => id !== null)
          ))
        }
      }
    }
    setLoading(false)
  }

  const updateStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase
      .from('expertise_bookings')
      .update({ status })
      .eq('id', bookingId)

    if (error) {
      toast({ title: "Error", description: "Failed to update booking", variant: "destructive" })
    } else {
      toast({ title: "Updated", description: `Booking marked as ${status}` })
      fetchBookings()
    }
  }

  if (loading) return <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No bookings yet. Share your profile to get your first session!</p>
        </CardContent>
      </Card>
    )
  }

  const pending = bookings.filter(b => b.status === 'pending')
  const upcoming = bookings.filter(b => b.status === 'confirmed' && b.event_date && new Date(b.event_date) > new Date())
  const past = bookings.filter(b => b.status === 'completed' || b.status === 'no_show' || b.status === 'cancelled' ||
    (b.status === 'confirmed' && b.event_date && new Date(b.event_date) <= new Date()))

  return (
    <div className="space-y-6">
      {/* Pending - Need Accept/Decline */}
      {pending.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-3 text-amber-700">Pending Requests ({pending.length})</h3>
          <div className="space-y-3">
            {pending.map(booking => (
              <Card key={booking.id} className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{booking.event_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.customer_name} ({booking.customer_email})
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {booking.event_date && new Date(booking.event_date).toLocaleString('en-IN', {
                          weekday: 'short', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                        {booking.duration_hours && ` - ${booking.duration_hours}h`}
                      </p>
                      {booking.notes && <p className="text-xs text-muted-foreground mt-1">{booking.notes}</p>}
                      {booking.meeting_link && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                          <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 font-medium">
                            <Video className="h-4 w-4" /> Join Meeting
                          </a>
                          <p className="text-xs text-blue-500 mt-0.5 break-all">{booking.meeting_link}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => updateStatus(booking.id, 'confirmed')}>
                        <ThumbsUp className="h-3 w-3 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateStatus(booking.id, 'cancelled')}>
                        <XCircle className="h-3 w-3 mr-1" /> Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Confirmed */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-3">Upcoming Sessions ({upcoming.length})</h3>
          <div className="space-y-3">
            {upcoming.map(booking => (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{booking.event_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.customer_name} ({booking.customer_email})
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {booking.event_date && new Date(booking.event_date).toLocaleString('en-IN', {
                          weekday: 'short', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                        {booking.duration_hours && ` - ${booking.duration_hours}h`}
                      </p>
                      {booking.meeting_link && (
                        <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> Join Meeting
                        </a>
                      )}
                      {booking.notes && <p className="text-xs text-muted-foreground mt-1">{booking.notes}</p>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => updateStatus(booking.id, 'completed')}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Complete
                      </Button>
                      <Button size="sm" variant="outline" className="text-orange-600" onClick={() => updateStatus(booking.id, 'no_show')}>
                        <UserX className="h-3 w-3 mr-1" /> No Show
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-3">Past Sessions ({past.length})</h3>
          <div className="space-y-2">
            {past.map(booking => (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{booking.event_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.customer_name} - {booking.event_date && new Date(booking.event_date).toLocaleDateString()}
                      </p>
                      {booking.status === 'completed' && !reviewedBookingIds.has(booking.id) && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> No review received yet
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        booking.status === 'completed' ? 'default' :
                        booking.status === 'no_show' ? 'destructive' :
                        booking.status === 'cancelled' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
