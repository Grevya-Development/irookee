import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useExperts } from '@/hooks/useExperts'
import { useBookings } from '@/hooks/useBookings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvailabilityManager } from './AvailabilityManager'
import { Calendar, DollarSign, Star, Users, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/supabase'

export function ExpertDashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [expertProfile, setExpertProfile] = useState<{
    id: string
    title: string
    expertise_areas: string[]
    hourly_rate: number
    verification_status: string
  } | null>(null)
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalEarnings: 0,
    averageRating: 0,
    upcomingSessions: 0
  })

  useEffect(() => {
    if (user) {
      loadExpertProfile()
      loadStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // No expert profile, redirect to onboarding
        navigate('/expert/onboarding')
        return
      }

      setExpertProfile(data)
    } catch (error) {
      console.error('Error loading expert profile:', error)
    }
  }

  const loadStats = async () => {
    if (!user) return

    try {
      const { data: expertData } = await supabase
        .from('speakers')
        .select('id, rating')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!expertData) return

      const expertId = expertData.id

      // Get bookings
      const { data: bookings } = await supabase
        .from('expertise_bookings')
        .select('*')
        .eq('expert_id', expertId)

      const totalBookings = bookings?.length || 0
      const totalEarnings = bookings
        ?.filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + Number(b.total_amount), 0) || 0

      const upcomingSessions = bookings?.filter(b => {
        const date = b.event_date || b.created_at
        return b.status === 'confirmed' && date && new Date(date) > new Date()
      }).length || 0

      setStats({
        totalBookings,
        totalEarnings,
        averageRating: Number(expertData.rating) || 0,
        upcomingSessions
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  if (!expertProfile) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
                  {expertProfile.expertise_areas.map((area: string, index: number) => (
                    <Badge key={index} variant="outline">{area}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Hourly Rate</p>
                <p className="text-lg">${expertProfile.hourly_rate}/hour</p>
              </div>
              <div>
                <p className="text-sm font-medium">Verification Status</p>
                <Badge 
                  variant={
                    expertProfile.verification_status === 'verified' ? 'default' : 
                    expertProfile.verification_status === 'pending' ? 'secondary' : 
                    'destructive'
                  }
                >
                  {expertProfile.verification_status}
                </Badge>
              </div>
              <Button onClick={() => navigate('/expert/edit')}>
                Edit Profile
              </Button>
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

  const [bookings, setBookings] = useState<Booking[]>([])
const [loading, setLoading] = useState(false)

useEffect(() => {
  const fetchExpertBookings = async () => {
    if (!expertId) return

    setLoading(true)

    const { data, error } = await supabase
      .from('expertise_bookings')
      .select('*')
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching expert bookings:", error)
    } else {
      setBookings(data || [])
    }

    setLoading(false)
  }

  fetchExpertBookings()
}, [expertId])

  const expertBookings = bookings

  if (loading) {
    return <div>Loading bookings...</div>
  }

  if (expertBookings.length === 0) {
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
      {expertBookings.map(booking => (
        <Card key={booking.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {new Date(booking.event_date || booking.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(booking.event_date || booking.created_at).toLocaleTimeString()} ({booking.duration_hours} min)
                </p>
              </div>
              <Badge>{booking.status}</Badge>
            </div>
            <div className="mt-2">
              <p className="text-sm">Amount: ${booking.total_amount}</p>
              <p className="text-sm text-muted-foreground">
                Your payout: ${booking.total_amount}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

