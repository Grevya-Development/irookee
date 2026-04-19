import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useExperts } from '@/hooks/useExperts'
import { BookingCalendar } from '@/components/booking/BookingCalendar'
import { BookingConfirmation } from '@/components/booking/BookingConfirmation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Star, MapPin, Shield } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Navigation from '@/components/Navigation'

export default function Booking() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const expertId = searchParams.get('expertId')
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(60)
  const { expert, loading } = useExperts(expertId || undefined)

  if (!expertId) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 text-center">
          <p className="text-muted-foreground">Please select an expert to book a session</p>
          <Button className="mt-4" onClick={() => navigate('/speakers')}>Browse Experts</Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </div>
    )
  }

  if (!expert) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 text-center">
          <p>Expert not found</p>
          <Button className="mt-4" onClick={() => navigate('/speakers')}>Browse Experts</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main - Calendar/Confirmation */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-2">Book a Session</h1>
            <p className="text-muted-foreground mb-6">with {expert.name}</p>

            {!selectedDateTime ? (
              <BookingCalendar
                expertId={expertId}
                onDateTimeSelect={(dt, dur) => { setSelectedDateTime(dt); setSelectedDuration(dur); }}
              />
            ) : (
              <BookingConfirmation
                expertId={expertId}
                scheduledAt={selectedDateTime}
                duration={selectedDuration}
              />
            )}

            {selectedDateTime && (
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSelectedDateTime(null)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Change Date/Time
              </Button>
            )}
          </div>

          {/* Sidebar - Expert info */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {expert.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{expert.name}</h3>
                    <p className="text-sm text-muted-foreground">{expert.title}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{(expert.rating || 0).toFixed(1)}</span>
                    <span className="text-muted-foreground">({expert.past_events || 0} sessions)</span>
                  </div>
                  {expert.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {expert.location}
                    </div>
                  )}
                  {expert.verification_status === 'verified' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Shield className="h-4 w-4" /> Verified Expert
                    </div>
                  )}
                </div>

                {expert.expertise && expert.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {expert.expertise.slice(0, 4).map((e, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{e}</Badge>
                    ))}
                  </div>
                )}

                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <span className="text-green-700 font-semibold">Free Session</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
