import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Trash2, Plus, Clock } from 'lucide-react'

interface AvailabilitySlot {
  id: string
  expert_id: string
  day_of_week: number | null
  start_time: string
  end_time: string
  is_recurring: boolean
}

const DAYS = [
  { value: 0, label: 'Sun', full: 'Sunday' },
  { value: 1, label: 'Mon', full: 'Monday' },
  { value: 2, label: 'Tue', full: 'Tuesday' },
  { value: 3, label: 'Wed', full: 'Wednesday' },
  { value: 4, label: 'Thu', full: 'Thursday' },
  { value: 5, label: 'Fri', full: 'Friday' },
  { value: 6, label: 'Sat', full: 'Saturday' },
]

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7 // 7:00 AM to 20:30 PM
  const min = i % 2 === 0 ? '00' : '30'
  const h24 = `${String(hour).padStart(2, '0')}:${min}`
  const ampm = hour < 12 ? 'AM' : 'PM'
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return { value: h24, label: `${h12}:${min} ${ampm}` }
})

export function AvailabilityManager({ expertId }: { expertId: string }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [startTime, setStartTime] = useState<string>('09:00')
  const [endTime, setEndTime] = useState<string>('17:00')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchSlots() }, [expertId])

  const fetchSlots = async () => {
    const { data, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('expert_id', expertId)
      .order('day_of_week')
    if (error) { console.error(error); toast.error('Failed to load'); return }
    setSlots(data || [])
  }

  const addSlot = async () => {
    if (startTime >= endTime) { toast.error('End time must be after start time'); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('availability_slots').insert({
        expert_id: expertId,
        day_of_week: selectedDay,
        start_time: startTime,
        end_time: endTime,
        is_recurring: true,
      })
      if (error) throw error
      toast.success('Slot added')
      fetchSlots()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add')
    } finally {
      setLoading(false)
    }
  }

  const deleteSlot = async (id: string) => {
    const { error } = await supabase.from('availability_slots').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Deleted')
    fetchSlots()
  }

  // Group slots by day
  const grouped = DAYS.map(day => ({
    ...day,
    slots: slots.filter(s => s.day_of_week === day.value),
  }))

  const formatTime = (t: string) => {
    const opt = TIME_OPTIONS.find(o => o.value === t.slice(0, 5))
    return opt?.label || t
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Availability</CardTitle>
        <CardDescription>Set when people can book sessions with you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new slot */}
        <div className="flex flex-wrap items-end gap-3 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm font-medium mb-1">Day</p>
            <Select value={String(selectedDay)} onValueChange={v => setSelectedDay(Number(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAYS.map(d => <SelectItem key={d.value} value={String(d.value)}>{d.full}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">From</p>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">To</p>
            <Select value={endTime} onValueChange={setEndTime}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addSlot} disabled={loading} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {/* Weekly view */}
        <div className="space-y-2">
          {grouped.map(day => (
            <div key={day.value} className="flex items-center gap-3 py-2 border-b last:border-0">
              <span className={`text-sm font-semibold w-10 ${day.slots.length > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                {day.label}
              </span>
              <div className="flex-1 flex flex-wrap gap-2">
                {day.slots.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Unavailable</span>
                ) : (
                  day.slots.map(slot => (
                    <div key={slot.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-sm font-medium rounded-full px-3 py-1">
                      {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                      <button onClick={() => deleteSlot(slot.id)} className="ml-1 hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {slots.length === 0 && (
          <p className="text-sm text-center text-muted-foreground py-2">
            No availability set yet. Add your first slot above.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
