import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/booking/SearchBar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Users, DollarSign, Star } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Connect with Experts, Learn & Grow
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Book one-on-one sessions with verified experts across various domains. 
            Get personalized guidance and accelerate your journey.
          </p>
          <div className="max-w-3xl mx-auto mb-12">
            <SearchBar />
          </div>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/speakers')}>
              Browse Experts
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/expert/onboarding')}>
              Become an Expert
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Irookee?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Sparkles className="h-10 w-10 text-primary mb-2" />
              <CardTitle>AI-Powered Matching</CardTitle>
              <CardDescription>
                Our intelligent search finds the perfect expert for your specific needs
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Verified Experts</CardTitle>
              <CardDescription>
                All experts are verified and reviewed by our community
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <DollarSign className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Fair Pricing</CardTitle>
              <CardDescription>
                Transparent pricing with secure payment processing
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-muted-foreground">Expert Profiles</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-muted-foreground">Sessions Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">
                <Star className="inline h-8 w-8 fill-yellow-400 text-yellow-400" />
                4.8
              </div>
              <div className="text-muted-foreground">Average Rating</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

