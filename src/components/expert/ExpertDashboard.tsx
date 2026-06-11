import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvailabilityManager } from './AvailabilityManager'
import { Calendar, DollarSign, Star, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

type ExpertProfileState = {
  id: string
  title: string
  expertise_areas?: string[] | null
  expertise?: string[] | null
  hourly_rate: number | null
  verification_status?: string | null
  is_verified?: boolean | null
  rating?: number | null
}

type ExpertBooking = {
  id: string
  expert_id: string
  scheduled_at?: string | null
  event_date?: string | null
  created_at: string
  duration_minutes?: number | null
  duration_hours?: number | null
  total_amount?: number | null
  expert_payout?: number | null
  status: string
}

const getBookingDate = (booking: ExpertBooking) => booking.scheduled_at || booking.event_date || booking.created_at

export function ExpertDashboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [expertProfile, setExpertProfile] = useState<ExpertProfileState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalEarnings: 0,
    averageRating: 0,
    upcomingSessions: 0
  })

  useEffect(() => {
    const loadDashboard = async () => {
      if (authLoading) return

      if (!user) {
        setLoading(false)
        navigate('/auth')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const { data, error: profileError } = await supabase
          .from('speakers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profileError) throw profileError

        if (!data) {
          setExpertProfile(null)
          setStats({
            totalBookings: 0,
            totalEarnings: 0,
            averageRating: 0,
            upcomingSessions: 0,
          })
          return
        }

        const profile = data as ExpertProfileState
        setExpertProfile(profile)

        const { data: bookings, error: bookingsError } = await supabase
          .from('expertise_bookings' as never)
          .select('*')
          .eq('expert_id', profile.id)

        if (bookingsError) throw bookingsError

        const rows = ((bookings || []) as ExpertBooking[])
        const totalEarnings = rows
          .filter((booking) => booking.status === 'completed')
          .reduce((sum, booking) => sum + Number(booking.expert_payout ?? booking.total_amount ?? 0), 0)

        const upcomingSessions = rows.filter((booking) => {
          const date = getBookingDate(booking)
          return ['pending', 'confirmed', 'in_progress'].includes(booking.status) && date && new Date(date) > new Date()
        }).length

        setStats({
          totalBookings: rows.length,
          totalEarnings,
          averageRating: Number(profile.rating) || 0,
          upcomingSessions
        })
      } catch (loadError) {
        console.error('Error loading expert dashboard:', loadError)
        setError(loadError instanceof Error ? loadError.message : 'Failed to load expert dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [authLoading, navigate, user])

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p>Loading expert dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!expertProfile) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Complete expert onboarding</CardTitle>
            <CardDescription>
              We could not find an expert profile for your account yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/expert/onboarding')}>Complete Onboarding</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const expertiseAreas = expertProfile.expertise_areas || expertProfile.expertise || []
  const verificationStatus = expertProfile.verification_status || (expertProfile.is_verified ? 'verified' : 'pending')

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Expert Dashboard</h1>
        <p className="text-muted-foreground">Manage your expert profile and bookings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingSessions}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expert Profile</CardTitle>
              <CardDescription>Your public expert profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Title</p>
                <p className="text-lg">{expertProfile.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Expertise Areas</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {expertiseAreas.length > 0 ? (
                    expertiseAreas.map((area, index) => (
                      <Badge key={index} variant="outline">{area}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No expertise areas added yet.</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Hourly Rate</p>
                <p className="text-lg">${Number(expertProfile.hourly_rate || 0).toFixed(2)}/hour</p>
              </div>
              <div>
                <p className="text-sm font-medium">Verification Status</p>
                <Badge 
                  variant={
                    verificationStatus === 'verified' ? 'default' :
                    verificationStatus === 'pending' ? 'secondary' :
                    'destructive'
                  }
                >
                  {verificationStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <AvailabilityManager expertId={expertProfile.id} />
        </TabsContent>

        <TabsContent value="bookings">
          <BookingsList expertId={expertProfile.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BookingsList({ expertId }: { expertId: string }) {
  const [bookings, setBookings] = useState<ExpertBooking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExpertBookings = async () => {
      if (!expertId) return

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('expertise_bookings' as never)
        .select('*')
        .eq('expert_id', expertId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error("Error fetching expert bookings:", fetchError)
        setError('Failed to load bookings.')
      } else {
        setBookings((data || []) as ExpertBooking[])
      }

      setLoading(false)
    }

    fetchExpertBookings()
  }, [expertId])

  if (loading) return <div>Loading bookings...</div>

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No bookings yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map(booking => {
        const date = getBookingDate(booking)
        return (
          <Card key={booking.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {date ? new Date(date).toLocaleDateString() : 'Date not set'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {date ? new Date(date).toLocaleTimeString() : 'Time not set'} ({booking.duration_minutes || booking.duration_hours || 0} min)
                  </p>
                </div>
                <Badge>{booking.status}</Badge>
              </div>
              <div className="mt-2">
                <p className="text-sm">Amount: ${Number(booking.total_amount || 0).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  Your payout: ${Number(booking.expert_payout ?? booking.total_amount ?? 0).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
