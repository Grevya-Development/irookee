import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useBookings } from '@/hooks/useBookings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNavigate } from 'react-router-dom'
import { Calendar, DollarSign, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Booking } from '@/lib/supabase'

const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'in_progress'])

const getBookingDate = (booking: Booking) => booking.scheduled_at || booking.event_date || booking.created_at

const getExpertName = (booking: Booking) =>
  booking.expert_profile?.full_name || booking.speakers?.full_name || 'Expert'

const getExpertTitle = (booking: Booking) =>
  booking.expert_profile?.title || booking.speakers?.title || ''

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const { bookings, loading: bookingsLoading, error, refetch } = useBookings(user?.id)
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth')
    }
  }, [authLoading, navigate, user])

  if (authLoading) {
    return (
      <div className="min-h-screen py-12 container mx-auto px-4">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  const upcomingBookings = bookings.filter(booking => {
    const date = getBookingDate(booking)
    return (
      ACTIVE_STATUSES.has(booking.status) &&
      date &&
      new Date(date).getTime() > Date.now()
    )
  })

  const pastBookings = bookings.filter(booking => booking.status === 'completed')
  const cancelledBookings = bookings.filter(booking => booking.status === 'cancelled')

  const cancelBooking = async (bookingId: string) => {
    const { error: updateError } = await supabase
      .from('expertise_bookings' as never)
      .update({ status: 'cancelled' } as never)
      .eq('id', bookingId)

    if (updateError) {
      toast.error('Unable to cancel this booking. Please try again.')
      return
    }

    toast.success('Booking cancelled.')
    refetch()
  }

  const renderBookingCard = (booking: Booking, showActions = false) => {
    const date = getBookingDate(booking)

    return (
      <Card key={booking.id}>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{getExpertName(booking)}</CardTitle>
              <CardDescription>{getExpertTitle(booking)}</CardDescription>
            </div>
            <Badge>{booking.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              {date ? new Date(date).toLocaleString() : 'Date not set'}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {booking.duration_minutes ? `${booking.duration_minutes} minutes` : `${booking.duration_hours || 0} hours`}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              ${Number(booking.total_amount || 0).toFixed(2)}
            </div>
            {showActions && (
              <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/booking?expertId=${booking.expert_id}&rescheduleId=${booking.id}`)}
                >
                  Reschedule
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => cancelBooking(booking.id)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen py-12 container mx-auto px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name || user.email}</p>
        </div>

        {profile?.user_type === 'expert' || profile?.user_type === 'both' ? (
          <Button onClick={() => navigate('/expert/dashboard')}>
            Go to Expert Dashboard
          </Button>
        ) : (
          <Button onClick={() => navigate('/expert/onboarding')}>
            Become an Expert
          </Button>
        )}

        {error && (
          <Card>
            <CardContent className="py-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {bookingsLoading ? (
              <div>Loading bookings...</div>
            ) : upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No upcoming bookings</p>
                  <Button className="mt-4" onClick={() => navigate('/search')}>
                    Find Experts
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map(booking => renderBookingCard(booking, true))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {bookingsLoading ? (
              <div>Loading bookings...</div>
            ) : pastBookings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No completed bookings</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastBookings.map(booking => renderBookingCard(booking))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {bookingsLoading ? (
              <div>Loading bookings...</div>
            ) : cancelledBookings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No cancelled bookings</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {cancelledBookings.map(booking => renderBookingCard(booking))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
