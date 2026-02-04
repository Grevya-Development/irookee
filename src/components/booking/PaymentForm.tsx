import { useState, FormEvent } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

interface PaymentFormProps {
  clientSecret: string
  amount: number
  bookingId: string
  onSuccess: () => void
}

function PaymentFormInner({ amount, bookingId, onSuccess }: Omit<PaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/${bookingId}/success`,
        },
      })

      if (error) {
        toast.error(error.message || 'Payment failed')
      } else {
        onSuccess()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
        <span className="font-semibold">Total Amount</span>
        <span className="text-2xl font-bold">${amount.toFixed(2)}</span>
      </div>
      <Button type="submit" disabled={!stripe || loading} className="w-full" size="lg">
        {loading ? 'Processing...' : 'Confirm & Pay'}
      </Button>
    </form>
  )
}

export function PaymentForm({ clientSecret, amount, bookingId, onSuccess }: PaymentFormProps) {
  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading payment form...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>Complete your booking by entering payment details</CardDescription>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentFormInner amount={amount} bookingId={bookingId} onSuccess={onSuccess} />
        </Elements>
      </CardContent>
    </Card>
  )
}

