import { useEffect, useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ACTIVE_BOOKING_STATUSES, rangesOverlap } from '@/lib/bookingUtils'

interface BookingCalendarProps {
  onDateTimeSelect: (dateTime: string, duration: number) => void
  expertId?: string
}

type BookedSlot = {
  scheduled_at: string | null
  event_date?: string | null
  duration_minutes?: number | null
  duration_hours?: number | null
  status: string
}

export function BookingCalendar({ onDateTimeSelect, expertId }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [duration, setDuration] = useState<number>(60)
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([])

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00'
  ]

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!expertId) return

      const { data, error } = await supabase
        .from('expertise_bookings' as never)
        .select('scheduled_at, event_date, duration_minutes, duration_hours, status')
        .eq('expert_id', expertId)
        .in('status', Array.from(ACTIVE_BOOKING_STATUSES))

      if (error) {
        console.error('Failed to load booked slots:', error)
        return
      }

      setBookedSlots((data || []) as BookedSlot[])
    }

    fetchBookedSlots()
  }, [expertId])

  const buildSelectedSlot = (time: string) => {
    if (!selectedDate || !time) return null

    const [hours, minutes] = time.split(':').map(Number)
    const dateTime = new Date(selectedDate)
    dateTime.setHours(hours, minutes, 0, 0)
    return dateTime
  }

  const isSlotUnavailable = (time: string) => {
    const slotStart = buildSelectedSlot(time)
    if (!slotStart) return true

    const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000)
    if (slotStart.getTime() <= Date.now()) return true

    return bookedSlots.some((booking) => {
      const bookedStartValue = booking.scheduled_at || booking.event_date
      if (!bookedStartValue) return false

      const bookedStart = new Date(bookedStartValue)
      if (Number.isNaN(bookedStart.getTime())) return false

      const bookedDuration =
        Number(booking.duration_minutes) ||
        Number(booking.duration_hours || 0) * 60 ||
        60
      const bookedEnd = new Date(bookedStart.getTime() + bookedDuration * 60 * 1000)
      return rangesOverlap(slotStart, slotEnd, bookedStart, bookedEnd)
    })
  }

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      const dateTime = buildSelectedSlot(selectedTime)

      if (!dateTime || isSlotUnavailable(selectedTime)) return
      
      onDateTimeSelect(dateTime.toISOString(), duration)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Date & Time</CardTitle>
        <CardDescription>Choose when you'd like to book your session</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Select Date</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date)
              setSelectedTime('')
            }}
            disabled={(date) => date < today}
            className="rounded-md border mt-2"
          />
        </div>

        {selectedDate && (
          <div>
            <Label>Select Time</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {timeSlots.map(time => {
                const unavailable = isSlotUnavailable(time)
                return (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'default' : 'outline'}
                    onClick={() => setSelectedTime(time)}
                    className="w-full"
                    disabled={unavailable}
                  >
                    {time}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="duration">Duration</Label>
          <Select
            value={duration.toString()}
            onValueChange={(value) => setDuration(parseInt(value))}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedDate && selectedTime && (
          <>
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <Clock className="h-4 w-4" />
              <div>
                <p className="font-medium">
                  {selectedDate.toLocaleDateString()} at {selectedTime}
                </p>
                <p className="text-sm text-muted-foreground">
                  Duration: {duration} minutes
                </p>
              </div>
            </div>
            <Button onClick={handleConfirm} className="w-full" size="lg">
              Confirm Selection
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

