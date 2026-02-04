import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

interface BookingCalendarProps {
  onDateTimeSelect: (dateTime: string, duration: number) => void
  expertId?: string
}

export function BookingCalendar({ onDateTimeSelect, expertId }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [duration, setDuration] = useState<number>(60)

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00'
  ]

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const dateTime = new Date(selectedDate)
      dateTime.setHours(hours, minutes, 0, 0)
      
      onDateTimeSelect(dateTime.toISOString(), duration)
    }
  }

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
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date()}
            className="rounded-md border mt-2"
          />
        </div>

        {selectedDate && (
          <div>
            <Label>Select Time</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {timeSlots.map(time => (
                <Button
                  key={time}
                  variant={selectedTime === time ? 'default' : 'outline'}
                  onClick={() => setSelectedTime(time)}
                  className="w-full"
                >
                  {time}
                </Button>
              ))}
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

