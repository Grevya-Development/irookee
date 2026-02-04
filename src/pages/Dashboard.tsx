import { useAuth } from '@/hooks/useAuth'
import { useBookings } from '@/hooks/useBookings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNavigate } from 'react-router-dom'
import { Calendar, DollarSign, Clock } from 'lucide-react'

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const { bookings, loading: bookingsLoading } = useBookings(user?.id)
  const navigate = useNavigate()

  if (authLoading) {
    return (
      <div className="min-h-screen py-12 container mx-auto px-4">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    navigate('/auth')
    return null
  }

  const upcomingBookings = bookings.filter(
    b => b.status === 'confirmed' && new Date(b.scheduled_at) > new Date()
  )

  const pastBookings = bookings.filter(
    b => b.status === 'completed' || (b.status === 'confirmed' && new Date(b.scheduled_at) < new Date())
  )

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

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
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
                {upcomingBookings.map(booking => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>
                          {booking.expert_profiles?.profiles?.full_name || 'Expert'}
                        </CardTitle>
                        <Badge>{booking.status}</Badge>
                      </div>
                      <CardDescription>{booking.expert_profiles?.title}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          {new Date(booking.scheduled_at).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4" />
                          {booking.duration_minutes} minutes
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4" />
                          ${booking.total_amount}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {bookingsLoading ? (
              <div>Loading bookings...</div>
            ) : pastBookings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No past bookings</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastBookings.map(booking => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>
                          {booking.expert_profiles?.profiles?.full_name || 'Expert'}
                        </CardTitle>
                        <Badge>{booking.status}</Badge>
                      </div>
                      <CardDescription>{booking.expert_profiles?.title}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          {new Date(booking.scheduled_at).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4" />
                          ${booking.total_amount}
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
    </div>
  )
}

