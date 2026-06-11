import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  initialQuery?: string;
  onSearchStateChange?: (hasSearched: boolean) => void;
}

export function SearchBar({ initialQuery = "", onSearchStateChange }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const prevInitialQuery = useRef<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (prevInitialQuery.current === null) {
      prevInitialQuery.current = initialQuery;
      onSearchStateChange?.(Boolean(initialQuery.trim()));
      return;
    }

    if (initialQuery !== prevInitialQuery.current) {
      prevInitialQuery.current = initialQuery;
      setQuery(initialQuery);
      onSearchStateChange?.(Boolean(initialQuery.trim()));
    }
  }, [initialQuery, onSearchStateChange]);

  const handleSearch = () => {
    const nextParams = new URLSearchParams(searchParams);
    const trimmedQuery = query.trim();

    if (trimmedQuery) {
      nextParams.set("q", trimmedQuery);
      onSearchStateChange?.(true);
    } else {
      nextParams.delete("q");
      onSearchStateChange?.(false);
    }

    const nextSearch = nextParams.toString();
    const nextUrl = `/search${nextSearch ? `?${nextSearch}` : ""}`;

    navigate(nextUrl, { replace: location.pathname === "/search" });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Describe what you need help with..."
            className="pl-10 pr-4 py-6 text-base sm:text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button size="lg" onClick={handleSearch} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Find Experts
        </Button>
      </div>
    </div>
  );
}
