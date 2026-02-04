import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { PaymentForm } from './PaymentForm'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface BookingConfirmationProps {
  expertId: string
  scheduledAt: string
  duration: number
}

export function BookingConfirmation({ expertId, scheduledAt, duration }: BookingConfirmationProps) {
  const [clientSecret, setClientSecret] = useState<string>('')
  const [bookingId, setBookingId] = useState<string>('')
  const [amount, setAmount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [consumerNotes, setConsumerNotes] = useState('')
  const navigate = useNavigate()

  const createBooking = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: { 
          expertId, 
          scheduledAt, 
          durationMinutes: duration,
          consumerNotes: consumerNotes || undefined
        }
      })

      if (error) throw error
      
      if (data && data.booking && data.clientSecret) {
        setClientSecret(data.clientSecret)
        setBookingId(data.booking.id)
        setAmount(data.booking.total_amount)
      } else {
        throw new Error('Invalid response from booking service')
      }
    } catch (error) {
      console.error('Booking creation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    toast.success('Booking confirmed!')
    navigate(`/booking/${bookingId}/success`)
  }

  if (!clientSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Confirmation</CardTitle>
          <CardDescription>Review your booking details and proceed to payment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Scheduled Time</p>
            <p>{new Date(scheduledAt).toLocaleString()}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Duration</p>
            <p>{duration} minutes</p>
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={consumerNotes}
              onChange={(e) => setConsumerNotes(e.target.value)}
              placeholder="Any specific topics or questions you'd like to discuss..."
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
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Booking...
              </>
            ) : (
              'Proceed to Payment'
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Scheduled Time</span>
            <span>{new Date(scheduledAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span>{duration} minutes</span>
          </div>
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Total</span>
            <span>${amount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <PaymentForm
        clientSecret={clientSecret}
        amount={amount}
        bookingId={bookingId}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}

