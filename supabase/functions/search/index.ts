
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MOCK_PEOPLE = [
  {
    id: "1",
    name: "Dr. Sarah Chen",
    title: "AI Ethics Researcher & Technology Speaker",
    bio: "Leading expert in artificial intelligence ethics and its implications on society",
    expertise: ["AI Ethics", "Machine Learning", "Future of Work"],
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    rating: 4.9,
    price: {
      hourly: 500,
      currency: "USD"
    },
    location: "San Francisco, CA",
    pastEvents: 50,
    type: "speaker"
  },
  {
    id: "2",
    name: "Marcus Rodriguez",
    title: "Serial Entrepreneur & Business Strategist",
    bio: "Three-time successful startup founder with expertise in scaling businesses",
    expertise: ["Entrepreneurship", "Business Strategy", "Leadership"],
    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    rating: 4.8,
    price: {
      hourly: 600,
      currency: "USD"
    },
    location: "Austin, TX",
    pastEvents: 120,
    type: "speaker"
  },
  {
    id: "3",
    name: "Dr. Amara Okafor",
    title: "Neuroscientist & Wellness Expert",
    bio: "Harvard-trained neuroscientist specializing in brain health and peak performance",
    expertise: ["Neuroscience", "Wellness", "Peak Performance"],
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    rating: 4.9,
    price: {
      hourly: 550,
      currency: "USD"
    },
    location: "Boston, MA",
    pastEvents: 95,
    type: "speaker"
  },
  {
    id: "4",
    name: "Chef Isabella Martinez",
    title: "Michelin Star Chef & Culinary Consultant",
    bio: "Award-winning chef specializing in sustainable cuisine and culinary innovation",
    expertise: ["Culinary Arts", "Sustainable Cooking", "Restaurant Management"],
    imageUrl: "https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    rating: 4.9,
    price: {
      hourly: 400,
      currency: "USD"
    },
    location: "New York, NY",
    pastEvents: 200,
    type: "chef"
  },
  {
    id: "5",
    name: "Dr. Ahmed Hassan",
    title: "Emergency Medicine Physician",
    bio: "Experienced ER doctor available for medical consultations and health seminars",
    expertise: ["Emergency Medicine", "Health Education", "Medical Training"],
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    rating: 4.8,
    price: {
      hourly: 300,
      currency: "USD"
    },
    location: "Chicago, IL",
    pastEvents: 75,
    type: "medical"
  },
  {
    id: "6",
    name: "Luna Rodriguez",
    title: "Professional Yoga Instructor & Wellness Coach",
    bio: "Certified yoga instructor with 10+ years helping people find balance and wellness",
    expertise: ["Yoga", "Meditation", "Wellness Coaching", "Stress Management"],
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    rating: 4.9,
    price: {
      hourly: 150,
      currency: "USD"
    },
    location: "Los Angeles, CA",
    pastEvents: 300,
    type: "instructor"
  },
  {
    id: "7",
    name: "Professor Michael Chang",
    title: "Mathematics Professor & Academic Tutor",
    bio: "PhD in Mathematics from MIT, specializing in advanced calculus and statistics",
    expertise: ["Mathematics", "Statistics", "Academic Tutoring", "Research"],
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    rating: 4.7,
    price: {
      hourly: 200,
      currency: "USD"
    },
    location: "Cambridge, MA",
    pastEvents: 150,
    type: "tutor"
  },
  {
    id: "8",
    name: "Captain Elena Popov",
    title: "Commercial Airline Pilot & Aviation Consultant",
    bio: "15+ years flying commercial aircraft, now offering aviation consulting and training",
    expertise: ["Aviation", "Flight Training", "Safety Protocols", "Leadership"],
    imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    rating: 4.8,
    price: {
      hourly: 350,
      currency: "USD"
    },
    location: "Denver, CO",
    pastEvents: 80,
    type: "consultant"
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { query } = await req.json();
    
    console.log('Search query received:', query);
    
    if (!query || query.trim() === '') {
      console.log('Empty query, returning all people');
      return new Response(
        JSON.stringify(MOCK_PEOPLE),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
      
      if (!GROQ_API_KEY) {
        console.log('GROQ_API_KEY not found, falling back to basic search');
        throw new Error('GROQ_API_KEY not configured');
      }

      // Create a prompt that asks Groq to analyze the search query
      const prompt = `
        You are a smart search assistant for a platform that connects people with various professionals. Analyze this search query: "${query}"
        
        The user is looking for people who could be:
        - Speakers for events
        - Consultants for business needs
        - Instructors or tutors for learning
        - Chefs for culinary experiences
        - Medical professionals for health advice
        - Any other type of professional service
        
        Consider:
        1. What expertise/skills they might want
        2. What type of service or event they have in mind
        3. Any location preferences mentioned
        4. Experience level they might need
        5. Any budget considerations mentioned
        6. Professional type (speaker, consultant, instructor, chef, medical, etc.)
        
        Return ONLY a JSON object with these fields (no markdown, no explanations):
        {
          "relevantExpertise": ["expertise1", "expertise2"],
          "professionalType": "speaker or consultant or instructor or chef or medical or any or null",
          "locationPreference": "location or null",
          "experienceLevel": "beginner or intermediate or expert or null",
          "priceRange": {"min": number_or_null, "max": number_or_null},
          "serviceType": "event or consultation or training or culinary or medical or null",
          "searchTerms": ["term1", "term2"]
        }
      `;

      console.log('Sending request to Groq API...');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that analyzes search queries for professional service booking. Always respond with valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API error:', errorText);
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error('Invalid response from Groq API');
      }

      // Clean and parse the response
      const responseText = data.choices[0].message.content.trim();
      console.log('Raw Groq response:', responseText);
      
      // Remove any markdown formatting
      const cleanedText = responseText.replace(/```json|```/g, '').trim();
      
      let analysis;
      try {
        analysis = JSON.parse(cleanedText);
        console.log('Parsed analysis:', analysis);
      } catch (parseError) {
        console.error('Failed to parse Groq response:', parseError);
        throw parseError;
      }

      // Score and rank people based on Groq's analysis
      const rankedPeople = MOCK_PEOPLE.map(person => {
        let score = 0;

        // Match expertise
        if (analysis.relevantExpertise && Array.isArray(analysis.relevantExpertise)) {
          const expertiseMatches = person.expertise.filter(exp => 
            analysis.relevantExpertise.some(relevant => 
              exp.toLowerCase().includes(relevant.toLowerCase()) ||
              relevant.toLowerCase().includes(exp.toLowerCase())
            )
          ).length;
          score += expertiseMatches * 3;
        }

        // Match professional type
        if (analysis.professionalType && analysis.professionalType !== 'any' && analysis.professionalType !== 'null') {
          if (person.type === analysis.professionalType) {
            score += 5;
          }
        }

        // Match search terms in name, title, bio
        if (analysis.searchTerms && Array.isArray(analysis.searchTerms)) {
          analysis.searchTerms.forEach(term => {
            const termLower = term.toLowerCase();
            if (person.name.toLowerCase().includes(termLower)) score += 2;
            if (person.title.toLowerCase().includes(termLower)) score += 2;
            if (person.bio.toLowerCase().includes(termLower)) score += 1;
          });
        }

        // Match location if specified
        if (analysis.locationPreference && 
            person.location.toLowerCase().includes(analysis.locationPreference.toLowerCase())) {
          score += 2;
        }

        // Consider experience level based on past events
        if (analysis.experienceLevel) {
          const eventScore = person.pastEvents / 20;
          switch (analysis.experienceLevel) {
            case 'expert':
              score += eventScore >= 4 ? 3 : 0;
              break;
            case 'intermediate':
              score += (eventScore >= 2 && eventScore < 4) ? 3 : 0;
              break;
            case 'beginner':
              score += eventScore < 2 ? 3 : 0;
              break;
          }
        }

        // Consider price range if specified
        if (analysis.priceRange && analysis.priceRange.min !== null && analysis.priceRange.max !== null) {
          if (person.price.hourly >= analysis.priceRange.min && 
              person.price.hourly <= analysis.priceRange.max) {
            score += 2;
          }
        }

        // Basic text matching fallback
        const queryLower = query.toLowerCase();
        if (person.name.toLowerCase().includes(queryLower)) score += 2;
        if (person.title.toLowerCase().includes(queryLower)) score += 2;
        if (person.bio.toLowerCase().includes(queryLower)) score += 1;
        person.expertise.forEach(exp => {
          if (exp.toLowerCase().includes(queryLower)) score += 2;
        });

        // Add rating boost
        score += person.rating / 5;

        return { ...person, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...person }) => person);

      console.log('Returning ranked people:', rankedPeople.length);
      return new Response(
        JSON.stringify(rankedPeople),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (aiError) {
      console.error('AI Search error:', aiError);
      
      // Fall back to basic search if AI fails
      const queryLower = query.toLowerCase();
      const filteredPeople = MOCK_PEOPLE.filter(person => 
        person.name.toLowerCase().includes(queryLower) ||
        person.title.toLowerCase().includes(queryLower) ||
        person.bio.toLowerCase().includes(queryLower) ||
        person.expertise.some(exp => exp.toLowerCase().includes(queryLower)) ||
        person.location.toLowerCase().includes(queryLower) ||
        person.type.toLowerCase().includes(queryLower)
      );

      console.log('Fallback search returning:', filteredPeople.length, 'people');
      return new Response(
        JSON.stringify(filteredPeople),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
