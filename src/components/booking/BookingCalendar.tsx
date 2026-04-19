import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface AvailabilitySlot {
  id: string
  expert_id: string
  day_of_week: number | null
  start_time: string
  end_time: string
  is_recurring: boolean
}

interface BookingCalendarProps {
  onDateTimeSelect: (dateTime: string, duration: number) => void
  expertId?: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function BookingCalendar({ onDateTimeSelect, expertId }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [duration, setDuration] = useState<number>(30)
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(false)
  const [existingBookings, setExistingBookings] = useState<{ event_date: string; duration_hours: number }[]>([])

  useEffect(() => {
    if (expertId) {
      fetchAvailability()
      fetchExistingBookings()
    }
  }, [expertId])

  const fetchAvailability = async () => {
    if (!expertId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('expert_id', expertId)
        .order('day_of_week')

      if (error) throw error
      setAvailabilitySlots(data || [])
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingBookings = async () => {
    if (!expertId) return
    try {
      const { data } = await supabase
        .from('expertise_bookings')
        .select('event_date, duration_hours')
        .eq('expert_id', expertId)
        .in('status', ['pending', 'confirmed'])
        .gte('event_date', new Date().toISOString())

      setExistingBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  // Get available days of week from slots
  const availableDays = new Set(
    availabilitySlots
      .filter(s => s.day_of_week !== null)
      .map(s => s.day_of_week!)
  )

  // Check if a date is available
  const isDateAvailable = (date: Date) => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return false
    return availableDays.has(date.getDay())
  }

  // Get time slots for selected date
  const getTimeSlotsForDate = (date: Date): string[] => {
    const dayOfWeek = date.getDay()
    const slots = availabilitySlots.filter(s => s.day_of_week === dayOfWeek)

    const timeSlots: string[] = []
    slots.forEach(slot => {
      const startHour = parseInt(slot.start_time.split(':')[0])
      const startMin = parseInt(slot.start_time.split(':')[1] || '0')
      const endHour = parseInt(slot.end_time.split(':')[0])
      const endMin = parseInt(slot.end_time.split(':')[1] || '0')

      let currentHour = startHour
      let currentMin = startMin

      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`

        // Check if this slot is already booked
        const isBooked = existingBookings.some(booking => {
          if (!booking.event_date) return false
          const bookingDate = new Date(booking.event_date)
          return bookingDate.toDateString() === date.toDateString() &&
            bookingDate.getHours() === currentHour &&
            bookingDate.getMinutes() === currentMin
        })

        if (!isBooked) {
          timeSlots.push(timeStr)
        }

        // Advance by 30 minutes
        currentMin += 30
        if (currentMin >= 60) {
          currentMin = 0
          currentHour++
        }
      }
    })

    return timeSlots
  }

  const timeSlots = selectedDate ? getTimeSlotsForDate(selectedDate) : []

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const dateTime = new Date(selectedDate)
      dateTime.setHours(hours, minutes, 0, 0)
      onDateTimeSelect(dateTime.toISOString(), duration)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading availability...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Date & Time</CardTitle>
        <CardDescription>
          {availabilitySlots.length > 0
            ? 'Choose from the expert\'s available time slots'
            : 'This expert has not set up availability yet. Contact them directly.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {availabilitySlots.length > 0 && (
          <>
            {/* Show available days */}
            <div>
              <Label className="text-sm text-muted-foreground">Available days:</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.from(availableDays).sort().map(day => (
                  <Badge key={day} variant="outline">{DAYS[day]}</Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => { setSelectedDate(date); setSelectedTime(''); }}
                disabled={(date) => !isDateAvailable(date)}
                className="rounded-md border mt-2"
              />
            </div>

            {selectedDate && (
              <div>
                <Label>Select Time ({timeSlots.length} slots available)</Label>
                {timeSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">No available slots on this day</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {timeSlots.map(time => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? 'default' : 'outline'}
                        onClick={() => setSelectedTime(time)}
                        className="w-full"
                        size="sm"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                )}
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
                </SelectContent>
              </Select>
            </div>

            {selectedDate && selectedTime && (
              <>
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <Clock className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">
                      {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {selectedTime}
                    </p>
                    <p className="text-sm text-green-600">
                      Duration: {duration} minutes | Free session
                    </p>
                  </div>
                </div>
                <Button onClick={handleConfirm} className="w-full" size="lg">
                  Confirm & Book Session
                </Button>
              </>
            )}
          </>
        )}

        {availabilitySlots.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p>No availability slots configured by this expert yet.</p>
            <p className="text-sm mt-1">Please check back later or contact them directly.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
