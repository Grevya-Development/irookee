import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchBar } from '@/components/booking/SearchBar'
import ExpertGrid from '@/components/ExpertGrid'
import { Loader2 } from 'lucide-react'

export default function Search() {
  const [searchParams] = useSearchParams()
  const queryParam = searchParams.get('q') || ''
  const [hasSearched, setHasSearched] = useState(!!queryParam)

  // If there's a query param, mark as searched
  useEffect(() => {
    if (queryParam) {
      setHasSearched(true)
    }
  }, [queryParam])

  return (
    <div className="min-h-screen py-12 container mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Find Experts</h1>
        <p className="text-muted-foreground">
          Use AI-powered search to find the perfect expert for your needs
        </p>
      </div>
      <SearchBar 
        initialQuery={queryParam}
        onSearchStateChange={setHasSearched}
      />
      
      {/* Show all experts when no search query */}
      {!hasSearched && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Browse All Experts</h2>
          <ExpertGrid limit={20} />
        </div>
      )}
    </div>
  )
}
