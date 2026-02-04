import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ExpertProfile } from '@/lib/supabase'

export function useAISearch() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ExpertProfile[]>([])
  const [error, setError] = useState<string | null>(null)

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('search-experts', {
        body: { query }
      })

      if (invokeError) throw invokeError
      
      if (data && data.experts) {
        setResults(data.experts)
      } else {
        setResults([])
      }
    } catch (err) {
      console.error('Search error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to search experts'
      setError(errorMessage)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return { search, results, loading, error }
}

