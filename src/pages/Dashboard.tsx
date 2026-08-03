import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useBookings } from '@/hooks/useBookings'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, CheckCircle, UserX, Star, MessageSquare, ArrowLeft, CalendarClock, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/sections/Footer'
import UserLoyaltyCard from '@/components/gamification/UserLoyaltyCard'
import ReviewForm from '@/components/ReviewForm'
import { formatBookingDuration, formatZonedBookingTime, getBookingDurationMinutes, getBookingStart, isPastBooking, isUpcomingBooking } from '@/lib/bookingUtils'
import { notifyBookingEvent } from '@/lib/notifications'
import { isCurrentUserAdmin } from '@/lib/auth'
import Seo from "@/components/Seo";

const getExpertName = (booking: {
  speakers?: { name?: string | null; full_name?: string | null } | null
  expert_profile?: { full_name?: string | null } | null
}) => booking.expert_profile?.full_name || booking.speakers?.full_name || booking.speakers?.name || 'Expert'

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const { bookings, loading: bookingsLoading, refetch } = useBookings(user?.id)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [reviewBooking, setReviewBooking] = useState<{ id: string; expertId: string; expertName: string } | null>(null)
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  /** Bookings this user has already reviewed, so the button reflects reality. */
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set())

  const loadReviewedBookings = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('reviews')
      .select('booking_id')
      .eq('reviewer_id', user.id)
    if (error) {
      console.error('Could not load review history:', error)
      return
    }
    setReviewedBookingIds(
      new Set((data || []).map((r) => r.booking_id).filter((id): id is string => Boolean(id)))
    )
  }

  useEffect(() => {
    loadReviewedBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, bookings.length])

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const adminStatus = await isCurrentUserAdmin()
        setIsAdmin(adminStatus)
      }
    }
    checkAdmin()
  }, [user])

  // Redirecting must happen in an effect. Calling navigate() during render made
  // React warn about updating the router while rendering and pushed a duplicate
  // history entry, which broke the browser Back button.
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=%2Fdashboard', { replace: true })
    }
  }, [authLoading, user, navigate])

  const targetBookingToCancel = bookings.find((b) => b.id === cancelBookingId)
  const startStr = targetBookingToCancel ? getBookingStart(targetBookingToCancel) : null
  const sessionStartDate = startStr ? new Date(startStr) : null
  const now = new Date()
  const hoursUntilStart = sessionStartDate ? (sessionStartDate.getTime() - now.getTime()) / 3600000 : 999
  const isLateCancellation = hoursUntilStart >= 0 && hoursUntilStart < 2
  const hasSessionStarted = hoursUntilStart < 0

  const handleCancelBooking = async () => {
    if (!cancelBookingId || !targetBookingToCancel) return

    if (hasSessionStarted && !isAdmin) {
      toast({
        title: 'Cancellation Not Allowed',
        description: 'Sessions that have already started or passed cannot be cancelled.',
        variant: 'destructive',
      })
      setCancelBookingId(null)
      return
    }

    if (isLateCancellation && cancelReason.trim().length < 10 && !isAdmin) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for cancelling less than 2 hours before session start (at least 10 characters).',
        variant: 'destructive',
      })
      return
    }

    setCancelling(true)
    const updatePayload = {
      status: 'cancelled',
      cancellation_reason: cancelReason.trim() || (isLateCancellation ? 'Late cancellation by consumer' : 'Cancelled by consumer'),
      cancelled_at: new Date().toISOString(),
      cancelled_by: user?.id,
    }

    const { error } = await supabase
      .from('expertise_bookings')
      .update(updatePayload as never)
      .eq('id', cancelBookingId)

    setCancelling(false)
    setCancelBookingId(null)
    setCancelReason('')

    if (error) {
      toast({ title: 'Could not cancel', description: error.message, variant: 'destructive' })
    } else {
      const { data: expert } = await supabase
        .from('speakers')
        .select('name, user_id, email')
        .eq('id', targetBookingToCancel.expert_id)
        .maybeSingle()

      await notifyBookingEvent({
        bookingId: targetBookingToCancel.id,
        eventType: isLateCancellation ? 'booking_cancelled_late' : 'booking_cancelled',
        userId: user?.id,
        userEmail: user?.email,
        expertUserId: expert?.user_id,
        expertEmail: expert?.email,
        expertName: expert?.name || getExpertName(targetBookingToCancel),
        customerName: targetBookingToCancel.customer_name || profile?.full_name || user?.email,
        scheduledAt: getBookingStart(targetBookingToCancel),
        durationMinutes: getBookingDurationMinutes(targetBookingToCancel),
        meetingLink: targetBookingToCancel.meeting_link,
      })

      toast({
        title: 'Booking Cancelled',
        description: isLateCancellation
          ? 'Session cancelled. The expert has been notified of your late cancellation.'
          : 'Your session has been cancelled.',
      })
      refetch()
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen py-12 container mx-auto px-4">
              <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </div>
    )
  }

  if (!user) return null

  const upcomingBookings = bookings.filter(b => isUpcomingBooking(b))

  const pastBookings = bookings.filter(b => isPastBooking(b))

  const cancelledBookings = bookings.filter(b => b.status === 'cancelled')

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>
      case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'no_show': return <Badge variant="destructive">No Show</Badge>
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge variant="secondary">{status || 'pending'}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo title="My Dashboard" description="Manage your irookee bookings, sessions and reviews." noindex />
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 max-w-6xl space-y-6 flex-1">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.full_name || user.email}</p>
          </div>
          {profile?.user_type === 'expert' ? (
            <Button onClick={() => navigate('/expert/dashboard')}>
              Expert Dashboard
            </Button>
          ) : (
            <Button onClick={() => navigate('/expert/onboarding')} variant="outline">
              Become an Expert
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{bookings.length}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{upcomingBookings.length}</div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{bookings.filter(b => b.status === 'completed').length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{bookings.filter(b => b.status === 'no_show').length}</div>
              <div className="text-sm text-muted-foreground">No Shows</div>
            </CardContent>
          </Card>
        </div>

        {/* User Loyalty & Gamification */}
        <UserLoyaltyCard userId={user.id} />

        <div className="flex gap-3">
          <Button onClick={() => navigate('/experts')}>Browse Experts</Button>
          <Button onClick={() => navigate('/search')} variant="outline">Search</Button>
          <Button onClick={() => navigate('/leaderboard')} variant="outline">Leaderboard</Button>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="h-auto flex flex-wrap justify-start">
            <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelledBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {bookingsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No upcoming sessions</p>
                  <Button className="mt-4" onClick={() => navigate('/experts')}>
                    Find Experts
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map(booking => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{getExpertName(booking)}</CardTitle>
                        {getStatusBadge(booking.status)}
                      </div>
                      <CardDescription>{booking.speakers?.title}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1 font-medium text-foreground">
                          <Calendar className="h-4 w-4 text-primary" />
                          {formatZonedBookingTime(getBookingStart(booking))}
                        </div>
                        {booking.duration_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {formatBookingDuration(booking)}
                          </div>
                        )}
                        <Badge variant="outline" className="text-green-600">Free</Badge>
                      </div>
                      {booking.meeting_link && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 mb-1">Meeting Link</p>
                          <a
                            href={booking.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline break-all"
                          >
                            {booking.meeting_link}
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              navigator.clipboard.writeText(booking.meeting_link!);
                              toast({ title: "Copied!", description: "Meeting link copied to clipboard." });
                            }}
                          >
                            Copy Link
                          </Button>
                        </div>
                      )}
                      {booking.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{booking.notes}</p>
                      )}
                      {booking.status !== 'cancelled' && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/booking?expertId=${booking.expert_id}&bookingId=${booking.id}`)}
                          >
                            <CalendarClock className="h-4 w-4 mr-1" /> Reschedule
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setCancelBookingId(booking.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {bookingsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : pastBookings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No past sessions yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pastBookings.map(booking => (
                  <Card key={booking.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{getExpertName(booking)}</p>
                          <p className="text-sm text-muted-foreground">
                            {getBookingStart(booking)
                              ? new Date(getBookingStart(booking)!).toLocaleDateString('en-IN', {
                                  month: 'short', day: 'numeric', year: 'numeric'
                                })
                              : 'Date not set'}
                            {booking.speakers?.title && ` - ${booking.speakers.title}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {booking.status === 'completed' && (
                            reviewedBookingIds.has(booking.id) ? (
                              // The label used to stay "Review" after submitting,
                              // implying no review had been left — and the button
                              // still allowed a duplicate insert.
                              <Button size="sm" variant="ghost" disabled>
                                <Star className="h-3 w-3 mr-1 fill-current" /> Reviewed
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReviewBooking({
                                  id: booking.id,
                                  expertId: booking.expert_id,
                                  expertName: getExpertName(booking)
                                })}
                              >
                                <Star className="h-3 w-3 mr-1" /> Review
                              </Button>
                            )
                          )}
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {bookingsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : cancelledBookings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No cancelled sessions</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {cancelledBookings.map(booking => (
                  <Card key={booking.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{getExpertName(booking)}</p>
                          <p className="text-sm text-muted-foreground">
                            {getBookingStart(booking)
                              ? new Date(getBookingStart(booking)!).toLocaleDateString('en-IN', {
                                  month: 'short', day: 'numeric', year: 'numeric'
                                })
                              : 'Date not set'}
                            {booking.speakers?.title && ` - ${booking.speakers.title}`}
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelBookingId} onOpenChange={(open) => { if (!open) { setCancelBookingId(null); setCancelReason(''); } }}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {isLateCancellation && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {hasSessionStarted ? 'Session Has Started' : isLateCancellation ? 'Late Cancellation Notice' : 'Cancel this session?'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-1 text-sm">
                {hasSessionStarted && !isAdmin && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-start gap-2">
                    <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                    <p>Sessions that have already started or passed cannot be cancelled. Contact support if you need assistance.</p>
                  </div>
                )}
                {isLateCancellation && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <p className="font-semibold">Cancellation within 2 hours of start time</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        A cancellation reason is required. The expert will be notified immediately of this late cancellation.
                      </p>
                    </div>
                  </div>
                )}
                {!hasSessionStarted && !isLateCancellation && (
                  <p>This will cancel your booking and notify the expert. You can always book a new session later.</p>
                )}
                {!hasSessionStarted && isLateCancellation && (
                  <div className="space-y-1.5 pt-2">
                    <Label htmlFor="cancel-reason" className="font-medium text-foreground">
                      Reason for cancellation <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="cancel-reason"
                      placeholder="Please provide a brief reason for cancelling (min 10 characters)..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={cancelling}>Keep session</AlertDialogCancel>
            {!hasSessionStarted || isAdmin ? (
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); handleCancelBooking(); }}
                disabled={cancelling || (isLateCancellation && cancelReason.trim().length < 10 && !isAdmin)}
                className="bg-red-600 hover:bg-red-700"
              >
                {cancelling ? 'Cancelling...' : 'Cancel session'}
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Form Dialog */}
      {reviewBooking && (
        <ReviewForm
          bookingId={reviewBooking.id}
          expertId={reviewBooking.expertId}
          expertName={reviewBooking.expertName}
          isOpen={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSubmit={() => { setReviewBooking(null); refetch(); }}
        />
      )}
      <Footer />
    </div>
  )
}
