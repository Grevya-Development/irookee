import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Sparkles, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/asyncTimeout";

interface Person {
  id: string;
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  imageUrl: string;
  rating: number;
  price: {
    hourly: number;
    currency: string;
  };
  location: string;
  pastEvents: number;
  type: string;
}

interface IntelligentSearchProps {
  onResults: (people: Person[]) => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string) => void;
  initialQuery?: string;
}

const IntelligentSearch = ({ onResults, onLoading, onError, initialQuery = '' }: IntelligentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      onLoading(true);
      onError('');

      if (!searchQuery.trim()) {
        const { data: speakers, error } = await supabase
          .from('speakers')
          .select('*')
          .limit(20);

        if (error) throw error;

        const transformedPeople: Person[] = (speakers || []).map(speaker => ({
          id: speaker.id,
          name: speaker.name,
          title: speaker.title,
          bio: speaker.bio || '',
          expertise: speaker.expertise || [],
          imageUrl: speaker.image_url || '/placeholder.svg',
          rating: Number(speaker.rating) || 0,
          price: {
            hourly: Number(speaker.hourly_rate) || 0,
            currency: speaker.currency || 'USD'
          },
          location: speaker.location || '',
          pastEvents: speaker.past_events || 0,
          type: 'speaker'
        }));

        onResults(transformedPeople);
        return;
      }

      const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 2);
      let query = supabase.from('speakers').select('*');
      const searchConditions: string[] = [];

      searchTerms.forEach(term => {
        searchConditions.push(
          `name.ilike.%${term}%`,
          `title.ilike.%${term}%`,
          `bio.ilike.%${term}%`,
          `location.ilike.%${term}%`
        );
      });

      const professionalTerms: Record<string, string[]> = {
        'founder': ['entrepreneur', 'startup', 'ceo', 'founder'],
        'entrepreneur': ['startup', 'business', 'founder', 'ceo'],
        'chef': ['culinary', 'cooking', 'food', 'restaurant'],
        'doctor': ['medical', 'physician', 'health', 'medicine'],
        'ai': ['artificial intelligence', 'machine learning', 'technology'],
        'business': ['strategy', 'consultant', 'management', 'leadership'],
        'yoga': ['wellness', 'meditation', 'fitness', 'instructor'],
        'pilot': ['aviation', 'flight', 'aircraft'],
        'teacher': ['education', 'tutor', 'professor', 'academic']
      };

      Object.entries(professionalTerms).forEach(([key, terms]) => {
        if (searchQuery.toLowerCase().includes(key)) {
          terms.forEach(term => {
            searchConditions.push(
              `name.ilike.%${term}%`,
              `title.ilike.%${term}%`,
              `bio.ilike.%${term}%`
            );
          });
        }
      });

      if (searchConditions.length > 0) {
        query = query.or(searchConditions.join(','));
      }

      const { data: speakers, error } = await withTimeout(
        query.limit(20),
        12000,
        'Database search timed out'
      );

      if (error) throw error;

      const transformedPeople: Person[] = (speakers || []).map(speaker => ({
        id: speaker.id,
        name: speaker.name,
        title: speaker.title,
        bio: speaker.bio || '',
        expertise: speaker.expertise || [],
        imageUrl: speaker.image_url || '/placeholder.svg',
        rating: Number(speaker.rating) || 0,
        price: {
          hourly: Number(speaker.hourly_rate) || 0,
          currency: speaker.currency || 'USD'
        },
        location: speaker.location || '',
        pastEvents: speaker.past_events || 0,
        type: 'speaker'
      }));

      onResults(transformedPeople);
      toast({
        title: "Search Complete",
        description: `Found ${transformedPeople.length} verified experts matching your prompt`,
      });

    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to search people. Please try again.";
      onError(errorMessage);
      toast({
        title: "Search Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
      onLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="flex-1 relative group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500">
            <Sparkles className="h-4 w-4" />
          </div>
          <Input
            placeholder="Describe what expertise you need... (e.g., 'AI Consultant', 'Startup Mentor')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="pl-10 pr-10 h-12 text-sm rounded-2xl glass-panel border-slate-200/80 dark:border-slate-800/80 focus-visible:ring-indigo-500/50 shadow-sm"
            disabled={isSearching}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          loading={isSearching}
          size="lg"
          className="rounded-2xl font-bold px-6 shadow-md shrink-0"
        >
          {!isSearching && <Search className="h-4 w-4" />}
          {isSearching ? 'Searching...' : 'Search Experts'}
        </Button>
      </div>
    </div>
  );
};

export default IntelligentSearch;
