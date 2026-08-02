import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Sparkles, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics'

interface SearchBarProps {
  initialQuery?: string
  placeholder?: string
  /** Accessible name for the field. A placeholder alone is not a label. */
  label?: string
  submitLabel?: string
}

let searchBarSeq = 0

export function SearchBar({
  initialQuery = '',
  placeholder = 'Search by name, expertise, category, location...',
  label = 'Search experts',
  submitLabel = 'Find Experts',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [inputId] = useState(() => `search-bar-${++searchBarSeq}`)
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  const updateUrl = (nextQuery: string) => {
    const params = new URLSearchParams(searchParams)
    const trimmed = nextQuery.trim()

    if (trimmed) {
      params.set('q', trimmed)
      track('search_performed', { query: trimmed, source: 'search_page' })
    } else {
      params.delete('q')
    }

    const pathname = location.pathname === '/experts' || location.pathname === '/speakers'
      ? location.pathname
      : '/search'
    navigate({ pathname, search: params.toString() ? `?${params.toString()}` : '' })
  }

  const handleSearch = () => updateUrl(query)
  const handleClear = () => {
    setQuery('')
    updateUrl('')
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={inputId}
            type="search"
            placeholder={placeholder}
            className="pl-10 pr-12 py-6 text-base sm:text-lg"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <Button
          size="lg"
          onClick={handleSearch}
          className="gap-2 sm:min-w-36"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
