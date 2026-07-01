import Navigation from '@/components/Navigation'
import Footer from '@/components/sections/Footer'
import LeaderboardTable from '@/components/gamification/LeaderboardTable'
import { Trophy, TrendingUp, Star } from 'lucide-react'

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 pb-8 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Expert Leaderboard</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Discover the top-performing verified experts on irookee
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Trophy className="h-4 w-4 text-yellow-500" /> Ranked by performance</span>
            <span className="flex items-center gap-1"><TrendingUp className="h-4 w-4 text-green-500" /> Updated weekly</span>
            <span className="flex items-center gap-1"><Star className="h-4 w-4 text-blue-500" /> Based on real sessions</span>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <LeaderboardTable />
      </div>

      <Footer />
    </div>
  )
}
