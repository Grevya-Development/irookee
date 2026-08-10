import React, { useState } from 'react';
import { Search, Sparkles, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const IntelligentSearch: React.FC = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="w-full max-w-2xl mx-auto relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur-md opacity-30 group-hover:opacity-60 transition duration-500"></div>
      
      <div className="relative bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2 flex items-center gap-2 shadow-2xl backdrop-blur-xl">
        <div className="pl-3 text-blue-400">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>

        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask AI: 'Find a Senior React Architect with Fintech experience...'"
          className="border-none bg-transparent text-slate-100 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
        />

        {query && (
          <button 
            onClick={() => setQuery('')}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <Button variant="gradient" className="rounded-xl px-5 shadow-lg shadow-blue-500/20">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
};
