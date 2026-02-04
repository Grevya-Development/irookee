import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useExperts } from '@/hooks/useExperts'
import { BookingCalendar } from '@/components/booking/BookingCalendar'
import { BookingConfirmation } from '@/components/booking/BookingConfirmation'
import { Card, CardContent } from '@/components/ui/card'
export default function Booking() {
  const [searchParams] = useSearchParams()
  const expertId = searchParams.get('expertId')
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(60)
  const { expert, loading } = useExperts(expertId || undefined)

  if (!expertId) {
    return (
      <div className="min-h-screen py-12 container mx-auto px-4">
        <Card>
          <CardContent className="py-8 text-center">
            <p>Please select an expert to book a session</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen py-12 container mx-auto px-4">
        <Card>
          <CardContent className="py-8 text-center">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!expert) {
    return (
      <div className="min-h-screen py-12 container mx-auto px-4">
        <Card>
          <CardContent className="py-8 text-center">
            <p>Expert not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleDateTimeSelect = (dateTime: string, duration: number) => {
    setSelectedDateTime(dateTime)
    setSelectedDuration(duration)
  }

  return (
    <div className="min-h-screen py-12 container mx-auto px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Book a Session</h1>
          <p className="text-muted-foreground">
            with {expert.profiles?.full_name || expert.title}
          </p>
        </div>

        {!selectedDateTime ? (
          <BookingCalendar
            expertId={expertId}
            onDateTimeSelect={handleDateTimeSelect}
          />
        ) : (
          <BookingConfirmation
            expertId={expertId}
            scheduledAt={selectedDateTime}
            duration={selectedDuration}
          />
        )}
      </div>
    </div>
  )
}

