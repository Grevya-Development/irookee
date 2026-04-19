import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/booking/SearchBar'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Users, Shield, Star, Heart } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import CategoryGrid from '@/components/CategoryGrid'
import Navigation from '@/components/Navigation'
import Footer from '@/components/sections/Footer'

export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ experts: 0, bookings: 0, avgRating: 0, categories: 0 })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [expertsRes, bookingsRes, ratingsRes, categoriesRes] = await Promise.all([
        supabase.from('speakers').select('id', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('expertise_bookings').select('id', { count: 'exact', head: true }),
        supabase.from('speakers').select('rating').not('rating', 'is', null),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
      ])

      const ratings = ratingsRes.data || []
      const avg = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / ratings.length
        : 0

      setStats({
        experts: expertsRes.count || 0,
        bookings: bookingsRes.count || 0,
        avgRating: Math.round(avg * 10) / 10,
        categories: categoriesRes.count || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      {/* Hero Section */}
      <section className="pt-28 pb-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Prompt the People You Want
          </h1>
          <p className="text-xl text-muted-foreground mb-2 max-w-2xl mx-auto">
            Democratizing the way people connect with each other.
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with verified experts across {stats.categories}+ categories for free 1-on-1 sessions.
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
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose irookee?</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Sparkles className="h-10 w-10 text-primary mb-2" />
              <CardTitle>AI-Powered Search</CardTitle>
              <CardDescription>Find the perfect expert for any situation using natural language</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Verified Experts</CardTitle>
              <CardDescription>Every expert is document-verified for trust and safety</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Heart className="h-10 w-10 text-primary mb-2" />
              <CardTitle>100% Free</CardTitle>
              <CardDescription>No fees, no commissions. Connect freely with experts</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>People for People</CardTitle>
              <CardDescription>A community-driven platform where knowledge flows freely</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Explore Categories</h2>
          <p className="text-center text-muted-foreground mb-8">Find experts across every domain</p>
          <CategoryGrid />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">{stats.experts}+</div>
              <div className="text-primary-foreground/80">Verified Experts</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">{stats.bookings}+</div>
              <div className="text-primary-foreground/80">Sessions Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">{stats.categories}+</div>
              <div className="text-primary-foreground/80">Categories</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">
                <Star className="inline h-8 w-8 fill-yellow-400 text-yellow-400" />
                {stats.avgRating || 'N/A'}
              </div>
              <div className="text-primary-foreground/80">Average Rating</div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
