import { useState, useEffect, useRef } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAISearch } from '@/hooks/useAISearch'
import { ExpertCard } from '@/components/expert/ExpertCard'

interface SearchBarProps {
  initialQuery?: string
  onSearchStateChange?: (hasSearched: boolean) => void
}

export function SearchBar({ initialQuery = '', onSearchStateChange }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const { search, results, loading } = useAISearch()
  const prevInitialQuery = useRef<string | null>(null)

  // Only auto-search when initialQuery prop changes from outside (e.g., URL parameter)
  // This will NOT trigger when user manually types and searches
  useEffect(() => {
    // Skip on first render if no initialQuery
    if (prevInitialQuery.current === null) {
      prevInitialQuery.current = initialQuery
      // Auto-search only on mount if initialQuery is provided
      if (initialQuery.trim()) {
        search(initialQuery)
        onSearchStateChange?.(true)
      }
      return
    }

    // Only search if initialQuery actually changed from outside
    if (initialQuery !== prevInitialQuery.current) {
      prevInitialQuery.current = initialQuery
      setQuery(initialQuery)
      if (initialQuery.trim()) {
        search(initialQuery)
        onSearchStateChange?.(true)
      } else {
        onSearchStateChange?.(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery])

  const handleSearch = () => {
    if (query.trim()) {
      search(query)
      onSearchStateChange?.(true)
    } else {
      onSearchStateChange?.(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Describe what you need help with... (e.g., 'I need a mentor for my SaaS startup')"
            className="pl-10 pr-4 py-6 text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button 
          size="lg" 
          onClick={handleSearch}
          disabled={loading}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? 'Searching...' : 'Find Experts'}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Matching Experts</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

