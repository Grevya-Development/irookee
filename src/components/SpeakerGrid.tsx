import { useState, useEffect } from "react";
import ExpertCard from "./SpeakerCard";
import IntelligentSearch from "./IntelligentSearch";
import { Loader2 } from "lucide-react";
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

interface SpeakerGridProps {
  initialQuery?: string;
}

const SpeakerGrid = ({ initialQuery = '' }: SpeakerGridProps) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial people on component mount
  useEffect(() => {
    const loadInitialPeople = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        
        let query = supabase
          .from('speakers')
          .select('*')
          .limit(20);

        // If there's an initial query, filter by it
        if (initialQuery.trim()) {
          const searchTerm = initialQuery.toLowerCase();
          query = query.or(`name.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
        }

        const { data: speakers, error } = await query;

        if (error) {
          throw error;
        }

        // Transform speakers data to match the expected Person interface
        const transformedPeople: Person[] = (speakers || []).map(speaker => ({
          id: speaker.id,
          name: speaker.full_name ?? "Expert",
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

        setPeople(transformedPeople);
      } catch (err) {
        console.error('Error loading people:', err);
        setError(err instanceof Error ? err.message : 'Failed to load people');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialPeople();
  }, [initialQuery]);

  const handleSearchResults = (results: Person[]) => {
    setPeople(results);
    setError(null);
  };

  const handleSearchLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const handleSearchError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Intelligent People Search</h2>
          <p className="text-gray-600 text-sm">
            Search for speakers, consultants, instructors, and experts across various fields.
          </p>
        </div>
        <IntelligentSearch 
          onResults={handleSearchResults}
          onLoading={handleSearchLoading}
          onError={handleSearchError}
          initialQuery={initialQuery}
        />
      </div>

      {/* Results Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            {people.length > 0 ? `${people.length} People Found` : 'No People Found'}
          </h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : people.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No people found. Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {people.map((person) => (
              <ExpertCard 
                key={person.id} 
                expert={{
                  id: person.id,
                  name: person.name,
                  title: person.title,
                  bio: person.bio,
                  expertise: person.expertise,
                  image_url: person.imageUrl,
                  rating: person.rating,
                  hourly_rate: person.price.hourly,
                  currency: person.price.currency || 'USD',
                  location: person.location,
                  past_events: person.pastEvents,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  user_id: null,
                  availability_start: null,
                  availability_end: null,
                  languages: [],
                  is_verified: true,
                  badges: ['Expert'],
                  social_links: {},
                  video_url: null,
                  topics: [],
                  preferred_audience: [],
                  speaking_fees: { virtual: person.price.hourly * 0.7, in_person: person.price.hourly },
                  travel_preferences: {}
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeakerGrid;
