import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

interface AvailabilitySlot {
  id: string
  expert_id: string
  day_of_week: number | null
  start_time: string
  end_time: string
  is_recurring: boolean
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

interface AvailabilityForm {
  day_of_week: number
  start_time: string
  end_time: string
  is_recurring: boolean
}

export function AvailabilityManager({ expertId }: { expertId: string }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, watch, setValue } = useForm<AvailabilityForm>({
    defaultValues: {
      is_recurring: true
    }
  })

  const isRecurring = watch('is_recurring')

  useEffect(() => {
    fetchSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expertId])

  const fetchSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('expert_id', expertId)
        .order('day_of_week', { ascending: true })

      if (error) throw error
      setSlots(data || [])
    } catch (error) {
      console.error('Error fetching slots:', error)
      toast.error('Failed to load availability')
    }
  }

  const onSubmit = async (data: AvailabilityForm) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('availability_slots')
        .insert({
          expert_id: expertId,
          day_of_week: isRecurring ? data.day_of_week : null,
          start_time: data.start_time,
          end_time: data.end_time,
          is_recurring: data.is_recurring
        })

      if (error) throw error

      toast.success('Availability slot added')
      reset()
      fetchSlots()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to add availability slot'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const deleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('id', slotId)

      if (error) throw error

      toast.success('Availability slot deleted')
      fetchSlots()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to delete availability slot')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Availability</CardTitle>
        <CardDescription>
          Set your available time slots for bookings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setValue('is_recurring', checked)}
            />
            <Label htmlFor="recurring">Recurring weekly</Label>
          </div>

          {isRecurring && (
            <div>
              <Label htmlFor="day_of_week">Day of Week</Label>
              <Select
                onValueChange={(value) => setValue('day_of_week', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map(day => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                {...register('start_time', { required: true })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                {...register('end_time', { required: true })}
                className="mt-1"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            Add Availability Slot
          </Button>
        </form>

        <div className="space-y-2">
          <h3 className="font-semibold">Current Availability</h3>
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No availability slots set</p>
          ) : (
            <div className="space-y-2">
              {slots.map(slot => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    {slot.day_of_week !== null ? (
                      <span className="font-medium">
                        {DAYS_OF_WEEK.find(d => d.value === slot.day_of_week)?.label}
                      </span>
                    ) : (
                      <span className="font-medium">One-time</span>
                    )}
                    <span className="text-sm text-muted-foreground ml-2">
                      {slot.start_time} - {slot.end_time}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSlot(slot.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

