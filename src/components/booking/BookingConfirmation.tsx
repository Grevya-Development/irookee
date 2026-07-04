import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { buildBookingTimeFields } from '@/lib/bookingUtils'
import { notifyBookingEvent } from '@/lib/notifications'

interface BookingConfirmationProps {
  expertId: string
  scheduledAt: string
  duration: number
  bookingId?: string | null
}

export function BookingConfirmation({ expertId, scheduledAt, duration, bookingId }: BookingConfirmationProps) {
  const [loading, setLoading] = useState(false)
  const [consumerNotes, setConsumerNotes] = useState('')
  const [booked, setBooked] = useState(false)
  const navigate = useNavigate()

  const createBooking = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to book a session')
        navigate('/auth')
        return
      }

      // Get expert name
      const { data: expert } = await supabase
        .from('speakers')
        .select('name, user_id, email')
        .eq('id', expertId)
        .single()

      const { data: existingBooking } = bookingId
        ? await supabase
            .from('expertise_bookings')
            .select('*')
            .eq('id', bookingId)
            .eq('user_id', user.id)
            .eq('expert_id', expertId)
            .maybeSingle()
        : { data: null }

      let error
      let savedBookingId = bookingId
      let meetingLink = existingBooking?.meeting_link || null
      const timeFields = buildBookingTimeFields(scheduledAt, duration, existingBooking)

      if (bookingId) {
        const updateResult = await supabase
          .from('expertise_bookings')
          .update({
            ...timeFields,
            notes: consumerNotes || null,
            consumer_notes: consumerNotes || null,
            status: 'confirmed',
          } as never)
          .eq('id', bookingId)
          .eq('user_id', user.id)
          .eq('expert_id', expertId)

        error = updateResult.error
      } else {
        const roomId = `irookee-${crypto.randomUUID().slice(0, 8)}`;
        meetingLink = `https://meet.jit.si/${roomId}`;

        const insertResult = await supabase
          .from('expertise_bookings')
          .insert({
            expert_id: expertId,
            user_id: user.id,
            event_name: `Session with ${expert?.name || 'Expert'}`,
            ...timeFields,
            total_amount: 0,
            customer_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            customer_email: user.email,
            notes: consumerNotes || null,
            consumer_notes: consumerNotes || null,
            currency: 'INR',
            status: 'confirmed',
            meeting_link: meetingLink,
          } as never)
          .select('id')
          .single()

        error = insertResult.error
        savedBookingId = insertResult.data?.id || null
      }

      if (error) throw error

      await notifyBookingEvent({
        bookingId: savedBookingId,
        eventType: bookingId ? 'booking_rescheduled' : 'booking_created',
        userId: user.id,
        userEmail: user.email,
        expertUserId: expert?.user_id,
        expertEmail: expert?.email,
        expertName: expert?.name,
        customerName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        scheduledAt,
        durationMinutes: duration,
        meetingLink,
      })

      setBooked(true)
      toast.success(bookingId ? 'Session rescheduled successfully!' : 'Session booked successfully!')
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (booked) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold">{bookingId ? 'Session Rescheduled!' : 'Session Booked!'}</h2>
          <p className="text-muted-foreground">
            Your free session is confirmed for{' '}
            {new Date(scheduledAt).toLocaleString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            If you or the expert don't show up, the session will be marked as a no-show.
          </p>
          <div className="flex gap-3 justify-center pt-4">
            <Button variant="outline" onClick={() => navigate('/experts')}>Browse More Experts</Button>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{bookingId ? 'Confirm New Session Time' : 'Confirm Your Session'}</CardTitle>
        <CardDescription>{bookingId ? 'Review and confirm your rescheduled session' : 'Review and confirm your free session'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
            <p className="font-medium">{new Date(scheduledAt).toLocaleString('en-IN', {
              weekday: 'short', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Duration</p>
            <p className="font-medium">{duration} minutes</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Price</p>
            <p className="font-medium text-green-600">Free</p>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">What would you like to discuss? (optional)</Label>
          <Textarea
            id="notes"
            value={consumerNotes}
            onChange={(e) => setConsumerNotes(e.target.value)}
            placeholder="Share topics, questions, or context for the session..."
            className="mt-1"
            rows={3}
          />
        </div>

        <Button
          onClick={createBooking}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Booking...</>
          ) : (
            bookingId ? 'Confirm Reschedule' : 'Confirm Free Session'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
