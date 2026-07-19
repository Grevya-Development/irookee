import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { query } = body
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!GROQ_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing required environment variables')
    }

    // Use Groq to understand the query and extract intent
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert matching assistant. Extract key expertise areas, skills, and requirements from user queries.
Return ONLY a JSON object with: { "expertise_areas": string[], "keywords": string[], "experience_level": "junior|mid|senior|any" }`
          },
          { role: 'user', content: query }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    })

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.status}`)
    }

    const groqData = await groqResponse.json()
    let extracted
    
    try {
      const content = groqData.choices[0].message.content.trim()
      const cleanedContent = content.replace(/```json|```/g, '').trim()
      extracted = JSON.parse(cleanedContent)
    } catch (parseError) {
      // Fallback if JSON parsing fails
      extracted = {
        expertise_areas: [],
        keywords: query.toLowerCase().split(' '),
        experience_level: 'any'
      }
    }

    // Query Supabase for matching experts
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    let experts = []
    let error = null
    
    // Try expert_profiles first
    try {
      let queryBuilder = supabase
        .from('expert_profiles')
        .select(`
          *,
          profiles(full_name, avatar_url, bio)
        `)
        .eq('is_active', true)

      // Make verification_status optional - try verified first, then any
      if (extracted.expertise_areas && extracted.expertise_areas.length > 0) {
        queryBuilder = queryBuilder.overlaps('expertise_areas', extracted.expertise_areas)
      }

      const { data: expertData, error: expertError } = await queryBuilder
        .order('rating', { ascending: false })
        .limit(20)

      if (!expertError && expertData && expertData.length > 0) {
        experts = expertData
      } else {
        // Fallback: try speakers table if expert_profiles is empty
        console.log('expert_profiles empty or error, trying speakers table')
        const { data: speakersData, error: speakersError } = await supabase
          .from('speakers')
          .select('*')
          .eq('is_verified', true)
          .limit(20)

        if (!speakersError && speakersData) {
          // Transform speakers to match expert_profiles format
          experts = speakersData.map(speaker => ({
            id: speaker.id,
            user_id: speaker.user_id,
            title: speaker.title || speaker.name,
            expertise_areas: speaker.expertise || [],
            hourly_rate: speaker.hourly_rate,
            location: speaker.location,
            languages: speaker.languages || [],
            rating: speaker.rating || 0,
            total_sessions: speaker.past_events || 0,
            profiles: {
              full_name: speaker.name,
              avatar_url: speaker.image_url,
              bio: speaker.bio
            }
          }))
        } else {
          error = speakersError || expertError
        }
      }
    } catch (queryError) {
      console.error('Query error:', queryError)
      error = queryError
    }

    if (error) {
      console.error('Supabase query error:', error)
      // Don't throw, return empty results instead
    }

    if (!experts || experts.length === 0) {
      return new Response(
        JSON.stringify({ experts: [], query_analysis: extracted }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate match scores using Groq
    const rankedExperts = await Promise.all(
      experts.map(async (expert) => {
        try {
          const scoreResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [
                {
                  role: 'system',
                  content: 'Rate how well this expert matches the query on a scale of 0-100. Return ONLY a number.'
                },
                {
                  role: 'user',
                  content: `Query: ${query}\nExpert: ${expert.title}, ${expert.expertise_areas.join(', ')}, ${expert.profiles?.bio || ''}`
                }
              ],
              temperature: 0.1,
              max_tokens: 10
            })
          })

          if (!scoreResponse.ok) {
            return { ...expert, match_score: 50 } // Default score if API fails
          }

          const scoreData = await scoreResponse.json()
          const scoreText = scoreData.choices[0].message.content.trim()
          const matchScore = parseInt(scoreText) || 50

          return {
            ...expert,
            match_score: matchScore
          }
        } catch (scoreError) {
          console.error('Score calculation error:', scoreError)
          return { ...expert, match_score: 50 }
        }
      })
    )

    // Sort by match score
    rankedExperts.sort((a, b) => b.match_score - a.match_score)

    return new Response(
      JSON.stringify({ experts: rankedExperts.slice(0, 10), query_analysis: extracted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Search experts error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

