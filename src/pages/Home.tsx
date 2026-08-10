import React from 'react';
import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/sections/HeroSection';
import { CategoryGrid } from '@/components/CategoryGrid';
import { StatsSection } from '@/components/sections/StatsSection';
import { ExpertCard } from '@/components/ExpertCard';
import { Footer } from '@/components/sections/Footer';

const featuredExperts = [
  {
    id: '1',
    name: 'Dr. Aris Thorne',
    title: 'Principal AI Scientist',
    company: 'Anthropic Ex-Lead',
    rating: 4.9,
    reviews_count: 84,
    hourly_rate: 250,
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    expertise: ['LLM Architecture', 'Fine-Tuning', 'AI Safety']
  },
  {
    id: '2',
    name: 'Elena Rostova',
    title: 'VP of Product',
    company: 'Stripe',
    rating: 5.0,
    reviews_count: 120,
    hourly_rate: 300,
    image_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
    expertise: ['Fintech API', 'Product Growth', 'PLG Strategy']
  },
  {
    id: '3',
    name: 'Marcus Vance',
    title: 'Managing Partner',
    company: 'Nexus Ventures',
    rating: 4.8,
    reviews_count: 45,
    hourly_rate: 400,
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    expertise: ['Seed Fundraising', 'Cap Table', 'Pitch Decks']
  }
];

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <CategoryGrid />

        {/* Featured Experts */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white">Top Rated Advisors</h2>
              <p className="text-slate-400 text-sm mt-1">Book 1:1 sessions with industry leaders</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredExperts.map(expert => (
              <ExpertCard key={expert.id} {...expert} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
