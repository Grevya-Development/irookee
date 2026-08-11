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
  /**
   * Which service this bar searches. Companionship and expert consulting are
   * separate services, so a companionship query must land on the companions
   * results page and never on the general expert search (COMP-4).
   */
  scope?: 'experts' | 'companions'
}

let searchBarSeq = 0

/** Result pages that search in place instead of routing to a results page. */
const IN_PLACE_RESULT_PATHS = ['/experts', '/speakers']

export function SearchBar({
  initialQuery = '',
  placeholder = 'Search by name, expertise, category, location...',
  label = 'Search experts',
  submitLabel = 'Find Experts',
  scope = 'experts',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [inputId] = useState(() => `search-bar-${++searchBarSeq}`)
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  // A companionship query resolves to the companions results page; an expert
  // query stays put when the current page already lists results, otherwise it
  // routes to the general expert search.
  const resultsPath =
    scope === 'companions'
      ? '/companionship/search'
      : IN_PLACE_RESULT_PATHS.includes(location.pathname)
        ? location.pathname
        : '/search'

  const updateUrl = (nextQuery: string) => {
    const params = new URLSearchParams(searchParams)
    const trimmed = nextQuery.trim()

    if (trimmed) {
      params.set('q', trimmed)
      track('search_performed', {
        query: trimmed,
        source: scope === 'companions' ? 'companionship_search' : 'search_page',
      })
    } else {
      params.delete('q')
    }

    navigate({ pathname: resultsPath, search: params.toString() ? `?${params.toString()}` : '' })
  }

  const handleSearch = () => updateUrl(query)

  /**
   * Clearing the field only clears the field. It previously also called
   * `updateUrl('')`, which navigates — so on a page that is not a results page
   * the clear ✕ silently acted as a second, differently-behaved search submit
   * (COMP-5). The URL is only touched when it actually carries the query being
   * cleared, which is what makes the results reset on a results page.
   */
  const handleClear = () => {
    setQuery('')
    if (searchParams.get('q')) updateUrl('')
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
            // WebKit draws its own ✕ inside type="search"; left in, it stacks a
            // second clear icon next to ours in the same field (COMP-5).
            className="pl-10 pr-12 py-6 text-base sm:text-lg [&::-webkit-search-cancel-button]:appearance-none"
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
