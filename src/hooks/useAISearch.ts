import { useState } from 'react'
import { searchExperts } from '@/lib/searchExperts'
import { ExpertProfile } from '@/types/promptpeople'

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
      const experts = await searchExperts(query)
      setResults(experts)
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return { search, results, loading, error }
}
