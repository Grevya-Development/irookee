import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/sections/Footer';
import { ExpertCard } from '@/components/ExpertCard';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const expertsList = [
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

export const PromptPeople: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navigation />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Find Experts & Advisors
          </h1>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <Input
              type="text"
              placeholder="Search by keyword, skill, or name..."
              className="pl-10 py-6 bg-slate-900/80 border-slate-800 text-white text-base rounded-2xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {expertsList.map(expert => (
            <ExpertCard key={expert.id} {...expert} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PromptPeople;
