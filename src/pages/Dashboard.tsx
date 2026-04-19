import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useBookings } from '@/hooks/useBookings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, CheckCircle, UserX, Star, MessageSquare, ArrowLeft } from 'lucide-react'
import Navigation from '@/components/Navigation'
import UserLoyaltyCard from '@/components/gamification/UserLoyaltyCard'
import ReviewForm from '@/components/ReviewForm'

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const { bookings, loading: bookingsLoading, refetch } = useBookings(user?.id)
  const navigate = useNavigate()
  const [reviewBooking, setReviewBooking] = useState<{ id: string; expertId: string; expertName: string } | null>(null)

  if (authLoading) {
    return (
      <div className="min-h-screen py-12 container mx-auto px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </div>
    )
  }

  if (!user) {
    navigate('/auth')
    return null
  }

  const upcomingBookings = bookings.filter(b => {
    const date = b.event_date || b.created_at
    return (
      (b.status === 'pending' || b.status === 'confirmed') &&
      date &&
      new Date(date).getTime() > Date.now()
    )
  })

  const pastBookings = bookings.filter(b => {
    return b.status === 'completed' || b.status === 'no_show' || b.status === 'cancelled' ||
      (b.event_date && new Date(b.event_date).getTime() <= Date.now())
  })

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
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 max-w-6xl space-y-6">
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
          <Button onClick={() => navigate('/speakers')}>Browse Experts</Button>
          <Button onClick={() => navigate('/search')} variant="outline">Search</Button>
          <Button onClick={() => navigate('/leaderboard')} variant="outline">Leaderboard</Button>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
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
                  <Button className="mt-4" onClick={() => navigate('/speakers')}>
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
                        <CardTitle>{booking.speakers?.name || 'Expert'}</CardTitle>
                        {getStatusBadge(booking.status)}
                      </div>
                      <CardDescription>{booking.speakers?.title}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {booking.event_date
                            ? new Date(booking.event_date).toLocaleString('en-IN', {
                                weekday: 'short', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })
                            : 'Date not set'}
                        </div>
                        {booking.duration_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {booking.duration_hours < 1
                              ? `${Math.round(booking.duration_hours * 60)} min`
                              : `${booking.duration_hours}h`}
                          </div>
                        )}
                        <Badge variant="outline" className="text-green-600">Free</Badge>
                      </div>
                      {booking.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{booking.notes}</p>
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
                          <p className="font-medium">{booking.speakers?.name || 'Expert'}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.event_date
                              ? new Date(booking.event_date).toLocaleDateString('en-IN', {
                                  month: 'short', day: 'numeric', year: 'numeric'
                                })
                              : 'Date not set'}
                            {booking.speakers?.title && ` - ${booking.speakers.title}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {booking.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReviewBooking({
                                id: booking.id,
                                expertId: booking.expert_id,
                                expertName: booking.speakers?.name || 'Expert'
                              })}
                            >
                              <Star className="h-3 w-3 mr-1" /> Review
                            </Button>
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
        </Tabs>
      </div>

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
    </div>
  )
}
