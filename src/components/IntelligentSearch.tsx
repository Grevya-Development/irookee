import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  // Set initial query when component mounts
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
      
      console.log('Searching for:', searchQuery);
      
      if (!searchQuery.trim()) {
        // If empty query, load all speakers
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

      // Try AI-powered search first
      try {
        console.log('Using AI-powered search...');
        const { data: aiResults, error: aiError } = await supabase.functions.invoke('search', {
          body: { query: searchQuery }
        });

        if (aiError) {
          console.error('AI search error:', aiError);
          throw aiError;
        }

        if (aiResults && Array.isArray(aiResults) && aiResults.length > 0) {
          console.log('AI search results:', aiResults);
          
          // Transform AI results to match Person interface
          const transformedResults: Person[] = aiResults.map(person => ({
            id: person.id,
            name: person.name,
            title: person.title,
            bio: person.bio || '',
            expertise: person.expertise || [],
            imageUrl: person.imageUrl || '/placeholder.svg',
            rating: Number(person.rating) || 0,
            price: {
              hourly: Number(person.price?.hourly) || 0,
              currency: person.price?.currency || 'USD'
            },
            location: person.location || '',
            pastEvents: person.pastEvents || 0,
            type: person.type || 'speaker'
          }));

          onResults(transformedResults);
          toast({
            title: "AI Search Complete",
            description: `Found ${transformedResults.length} people matching your criteria using AI`,
          });
          return;
        }
      } catch (aiError) {
        console.log('AI search failed, falling back to database search:', aiError);
      }

      // Fallback to enhanced database search
      console.log('Using enhanced database search...');
      
      // Enhanced search with better text matching
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 2);
      
      let query = supabase.from('speakers').select('*');
      
      // Build comprehensive search conditions
      const searchConditions = [];
      
      searchTerms.forEach(term => {
        searchConditions.push(
          `name.ilike.%${term}%`,
          `title.ilike.%${term}%`,
          `bio.ilike.%${term}%`,
          `location.ilike.%${term}%`
        );
      });

      // Also search for common professional terms
      const professionalTerms = {
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

      const { data: speakers, error } = await query.limit(20);

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

      console.log('Database search results:', transformedPeople);
      onResults(transformedPeople);
      
      toast({
        title: "Search Complete",
        description: `Found ${transformedPeople.length} people matching your search`,
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
    <div className="flex flex-col md:flex-row gap-4 w-full">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Try: 'I need a startup founder', 'AI expert for my company', 'chef for cooking class'"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10"
          disabled={isSearching}
        />
      </div>
      <Button
        onClick={handleSearch}
        disabled={isSearching}
        className="flex items-center gap-2"
      >
        {isSearching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        {isSearching ? 'Searching...' : 'Search'}
      </Button>
    </div>
  );
};

export default IntelligentSearch;
