import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/booking/SearchBar'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Users, Shield, Star, Heart, ArrowRight } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import CategoryGrid from '@/components/CategoryGrid'
import Navigation from '@/components/Navigation'
import Footer from '@/components/sections/Footer'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '@/lib/motion'

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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between overflow-x-hidden">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative aurora-bg overflow-hidden border-b border-slate-200/50 dark:border-slate-800/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="text-center max-w-4xl mx-auto space-y-6"
          >
            <motion.div variants={fadeUp} className="flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
                Direct Human Knowledge Network
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-foreground">
              Prompt the People <br />
              <span className="text-gradient">You Want 1-on-1</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-normal">
              Democratizing expert knowledge. Connect directly with verified practitioners across {stats.categories}+ categories for free 1-on-1 video sessions.
            </motion.p>

            <motion.div variants={fadeUp} className="max-w-2xl mx-auto pt-2">
              <SearchBar />
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button size="xl" onClick={() => navigate('/experts')} className="w-full sm:w-auto font-bold gap-2 shadow-glow">
                Explore Expert Directory <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="xl" variant="outline" onClick={() => navigate('/expert/onboarding')} className="w-full sm:w-auto font-semibold">
                Become an Expert
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">Why Choose irookee?</h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">Designed for friction-free knowledge exchange and real 1-on-1 mentorship.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
            <Card className="glass-card h-full p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80">
              <CardHeader className="p-0 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Sparkles className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold">AI-Powered Search</CardTitle>
                <CardDescription className="text-xs leading-relaxed">Find the perfect mentor or expert using natural language prompt queries.</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
            <Card className="glass-card h-full p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80">
              <CardHeader className="p-0 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold">Verified Experts</CardTitle>
                <CardDescription className="text-xs leading-relaxed">Every practitioner undergoes identity and credentials verification for quality assurance.</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
            <Card className="glass-card h-full p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80">
              <CardHeader className="p-0 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Heart className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold">100% Free Sessions</CardTitle>
                <CardDescription className="text-xs leading-relaxed">Zero platform fees or hidden costs. Connect freely with practitioners.</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
            <Card className="glass-card h-full p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80">
              <CardHeader className="p-0 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold">People for People</CardTitle>
                <CardDescription className="text-xs leading-relaxed">A community-driven platform where human insights flow directly without barriers.</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-slate-50/50 dark:bg-slate-950/50 border-y border-slate-200/50 dark:border-slate-800/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">Explore Domains & Categories</h2>
            <p className="text-muted-foreground text-sm">Discover verified leaders across engineering, growth, business, and wellness</p>
          </div>
          <CategoryGrid />
        </div>
      </section>

      {/* Dynamic Impact Banner */}
      <section className="py-20 bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">{stats.experts || '200'}+</div>
              <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Verified Experts</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">{stats.bookings || '1,500'}+</div>
              <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Sessions Completed</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">{stats.categories || '15'}+</div>
              <div className="text-xs font-semibold text-pink-300 uppercase tracking-wider">Categories</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-1">
                <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
                {stats.avgRating || '4.9'}
              </div>
              <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
