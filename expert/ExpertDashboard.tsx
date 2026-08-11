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
import Footer from '@/components/sections/Footer'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import ExpertStatsCard from '@/components/gamification/ExpertStatsCard'
import ExpertTierBadge from '@/components/gamification/ExpertTierBadge'
import { canTransition, type BookingStatus } from '@/lib/bookingRules'
import { formatBookingDuration, formatZonedBookingTime, getBookingDurationMinutes, getBookingStart, isUpcomingBooking, isPastBooking } from '@/lib/bookingUtils'
import { notifyBookingEvent } from '@/lib/notifications'

interface BookingRow {
  id: string
  user_id?: string | null
  event_name: string
  event_date: string | null
  scheduled_at?: string | null
  duration_hours: number | null
  duration_minutes?: number | null
  status: string | null
  customer_name: string | null
  customer_email: string | null
  notes: string | null
  meeting_link: string | null
  created_at: string
}

export function ExpertDashboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [expertProfile, setExpertProfile] = useState<Record<string, unknown> | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileMissing, setProfileMissing] = useState(false)
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedSessions: 0,
    averageRating: 0,
    upcomingSessions: 0,
    noShows: 0,
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/auth?redirect=/expert/dashboard')
      return
    }
    loadExpertProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  const loadExpertProfile = async () => {
    if (!user) return
    setProfileLoading(true)
    setProfileError(null)
    setProfileMissing(false)
    try {
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error

      if (!data) {
        setProfileMissing(true)
        return
      }

      setExpertProfile(data)
      loadStats(data.id)
    } catch (error) {
      console.error('Error loading expert profile:', error)
      setProfileError(error instanceof Error ? error.message : 'Failed to load expert profile')
    } finally {
      setProfileLoading(false)
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
      const upcoming = allBookings.filter(b => isUpcomingBooking(b) && b.status !== 'pending').length

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

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </div>
    )
  }

  if (profileMissing || !expertProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Complete Expert Onboarding</CardTitle>
              <CardDescription>
                We could not find an expert profile for this account yet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileError && (
                <p className="text-sm text-destructive">{profileError}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Finish onboarding to create your public expert profile, upload verification documents, and access expert tools.
              </p>
              <Button onClick={() => navigate('/expert/onboarding')}>
                Complete Onboarding
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // A suspended expert previously fell through to the "Complete Expert
  // Onboarding" screen (or a blank profile tab) with no explanation, which
  // invited them to submit a duplicate application.
  if (expertProfile.verification_status === 'suspended') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl flex-1">
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-destructive" aria-hidden="true" />
                Your expert profile is suspended
              </CardTitle>
              <CardDescription>
                While suspended you cannot receive new bookings, and your profile is
                hidden from search.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {typeof expertProfile.suspension_reason === 'string' && expertProfile.suspension_reason && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm font-medium text-foreground">Reason given</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {String(expertProfile.suspension_reason)}
                  </p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Your profile, availability and past sessions are all preserved and will
                return exactly as they were once the suspension is lifted. You do not
                need to re-apply.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate('/dashboard')}>Go to my dashboard</Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Return to homepage
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  const hasUploadedDocs = Boolean(
    expertProfile?.verification_documents &&
    typeof expertProfile.verification_documents === 'object' &&
    Array.isArray((expertProfile.verification_documents as Record<string, unknown>).documents) &&
    ((expertProfile.verification_documents as Record<string, unknown>).documents as unknown[]).length > 0
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 space-y-6 flex-1">
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
            expertProfile.verification_status === 'verified' || expertProfile.is_verified ? 'default' :
            expertProfile.verification_status === 'rejected' ? 'destructive' :
            (expertProfile.verification_status === 'pending' && hasUploadedDocs) ? 'secondary' :
            'outline'
          }
          className="text-sm"
        >
          {(expertProfile.verification_status === 'verified' || expertProfile.is_verified) && <CheckCircle className="h-3 w-3 mr-1" />}
          {
            (expertProfile.verification_status === 'verified' || expertProfile.is_verified) ? 'Verified' :
            expertProfile.verification_status === 'rejected' ? 'Rejected' :
            (expertProfile.verification_status === 'pending' && hasUploadedDocs) ? 'Pending Review' :
            'Verification Not Submitted'
          }
        </Badge>
      </div>

      {expertProfile.verification_status === 'pending' && hasUploadedDocs && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg shrink-0">
              <Clock className="h-5 w-5 text-amber-700" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-amber-900">Documents Submitted – Pending Review</h4>
              <p className="text-sm text-amber-800">
                Your verification documents have been submitted and are currently being reviewed by our Admin team. Review typically takes 24–48 hours.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Button size="sm" variant="outline" className="border-amber-300 bg-white hover:bg-amber-100 text-amber-900 text-xs" onClick={() => navigate('/expert/onboarding')}>
                  Update Verification Documents
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {expertProfile.verification_status === 'pending' && !hasUploadedDocs && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
              <Clock className="h-5 w-5 text-blue-700" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-blue-900">Verification Not Submitted</h4>
              <p className="text-sm text-blue-800">
                Your expert profile is active. You can upload verification documents (e.g. ID, certificates) anytime to receive the Verified ✓ badge and build trust with clients.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Button size="sm" variant="outline" className="border-blue-300 bg-white hover:bg-blue-100 text-blue-900 text-xs" onClick={() => navigate('/expert/onboarding')}>
                  Upload Verification Documents
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {expertProfile.verification_status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg shrink-0">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-red-900">Verification Needs Attention</h4>
              <p className="text-sm text-red-800">
                Your expert profile application requires changes or updated verification documents before it can go live.
              </p>
              <div className="pt-2">
                <Button size="sm" variant="destructive" onClick={() => navigate('/expert/onboarding')}>
                  Re-submit Onboarding Documents
                </Button>
              </div>
            </div>
          </div>
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
          <BookingsList
            expertId={String(expertProfile.id)}
            expertName={String(expertProfile.name || expertProfile.full_name || "your expert")}
          />
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
      <Footer />
    </div>
  )
}

function BookingsList({ expertId, expertName }: { expertId: string; expertName: string }) {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set())
  const [confirmStatusModal, setConfirmStatusModal] = useState<{
    bookingId: string
    bookingTitle: string
    status: string
  } | null>(null)
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
    const booking = bookings.find((item) => item.id === bookingId)
    if (!booking) return

    // Shared rules, so the expert's Decline is held to the same timing guards as
    // the consumer's Cancel, and a session cannot be completed before it starts.
    const verdict = canTransition(booking, status as BookingStatus, { actor: 'expert' })
    if (!verdict.allowed) {
      toast({
        title: 'Not allowed',
        description: verdict.reason,
        variant: 'destructive',
      })
      return
    }

    const { error } = await supabase
      .from('expertise_bookings')
      .update({ status })
      .eq('id', bookingId)

    if (error) {
      // Surface the real reason instead of a generic string. A CHECK-constraint
      // violation (e.g. a status the database does not allow) is otherwise
      // indistinguishable from a network failure.
      console.error('Booking status update failed:', error)
      toast({
        title: 'Could not update booking',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      })
      return
    }

    if (status === 'confirmed' || status === 'cancelled') {
      await notifyBookingEvent({
        bookingId,
        eventType: status === 'confirmed' ? 'booking_confirmed' : 'booking_cancelled',
        userId: booking.user_id,
        userEmail: booking.customer_email,
        expertUserId: user?.id,
        expertEmail: user?.email,
        // Was hardcoded to 'Your expert', which shipped that literal string into
        // the consumer's notification on the pending route.
        expertName: expertName,
        customerName: booking.customer_name,
        scheduledAt: getBookingStart(booking),
        durationMinutes: getBookingDurationMinutes(booking),
        meetingLink: booking.meeting_link,
      })
    }
    toast({ title: 'Updated', description: `Booking marked as ${status.replace('_', ' ')}` })
    fetchBookings()
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
  const upcoming = bookings.filter(b => isUpcomingBooking(b) && b.status !== 'pending')
  const past = bookings.filter(b => isPastBooking(b))
  const cancelled = bookings.filter(b => b.status === 'cancelled')

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
                      <p className="text-sm font-medium mt-1 text-foreground">
                        {formatZonedBookingTime(getBookingStart(booking))}
                        {` - ${formatBookingDuration(booking)}`}
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
                      <Button size="sm" onClick={() => setConfirmStatusModal({ bookingId: booking.id, bookingTitle: booking.event_name, status: 'confirmed' })}>
                        <ThumbsUp className="h-3 w-3 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmStatusModal({ bookingId: booking.id, bookingTitle: booking.event_name, status: 'cancelled' })}>
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

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="h-auto flex flex-wrap justify-start">
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No upcoming sessions
              </CardContent>
            </Card>
          ) : (
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
                        <p className="text-sm font-medium mt-1 text-foreground">
                          {formatZonedBookingTime(getBookingStart(booking))}
                          {` - ${formatBookingDuration(booking)}`}
                        </p>
                        {booking.meeting_link && (
                          <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> Join Meeting
                          </a>
                        )}
                        {booking.notes && <p className="text-xs text-muted-foreground mt-1">{booking.notes}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" onClick={() => setConfirmStatusModal({ bookingId: booking.id, bookingTitle: booking.event_name, status: 'completed' })}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Complete
                        </Button>
                        <Button size="sm" variant="outline" className="text-orange-600" onClick={() => setConfirmStatusModal({ bookingId: booking.id, bookingTitle: booking.event_name, status: 'no_show' })}>
                          <UserX className="h-3 w-3 mr-1" /> No Show
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {past.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No past sessions
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {past.map(booking => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{booking.event_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.customer_name} ({booking.customer_email})
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {getBookingStart(booking) && new Date(getBookingStart(booking)!).toLocaleString('en-IN', {
                            weekday: 'short', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                          {` - ${formatBookingDuration(booking)}`}
                        </p>
                        {booking.notes && <p className="text-xs text-muted-foreground mt-1">{booking.notes}</p>}
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
          )}
        </TabsContent>

        <TabsContent value="cancelled">
          {cancelled.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No cancelled sessions
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {cancelled.map(booking => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{booking.event_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.customer_name} ({booking.customer_email})
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {getBookingStart(booking) && new Date(getBookingStart(booking)!).toLocaleString('en-IN', {
                            weekday: 'short', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                          {` - ${formatBookingDuration(booking)}`}
                        </p>
                        {booking.notes && <p className="text-xs text-muted-foreground mt-1">{booking.notes}</p>}
                      </div>
                      <Badge variant="destructive">cancelled</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Modal for status changes including No Show */}
      <AlertDialog open={!!confirmStatusModal} onOpenChange={(open) => { if (!open) setConfirmStatusModal(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmStatusModal?.status === 'no_show' ? 'Mark as No Show?' :
               confirmStatusModal?.status === 'completed' ? 'Mark Session as Completed?' :
               confirmStatusModal?.status === 'confirmed' ? 'Accept Booking Request?' :
               confirmStatusModal?.status === 'cancelled' ? 'Decline Booking Request?' :
               'Confirm Action'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmStatusModal?.status === 'no_show'
                ? `Are you sure you want to mark "${confirmStatusModal?.bookingTitle}" as a No Show? This will update the session status and record a no-show.`
                : confirmStatusModal?.status === 'completed'
                ? `Are you sure you want to mark "${confirmStatusModal?.bookingTitle}" as Completed?`
                : confirmStatusModal?.status === 'confirmed'
                ? `Are you sure you want to accept the booking request for "${confirmStatusModal?.bookingTitle}"?`
                : confirmStatusModal?.status === 'cancelled'
                ? `Are you sure you want to decline the booking request for "${confirmStatusModal?.bookingTitle}"?`
                : `Are you sure you want to update status to ${confirmStatusModal?.status}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmStatusModal) {
                  updateStatus(confirmStatusModal.bookingId, confirmStatusModal.status);
                  setConfirmStatusModal(null);
                }
              }}
              className={confirmStatusModal?.status === 'cancelled' || confirmStatusModal?.status === 'no_show' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
