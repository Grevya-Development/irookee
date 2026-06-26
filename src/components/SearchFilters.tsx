import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SlidersHorizontal, Star, X, ChevronDown } from "lucide-react";
import type { SearchFilters as SearchFiltersType } from "@/types/promptpeople";

interface SearchFiltersProps {
  onFilterChange: (filters: SearchFiltersType) => void;
  categories: { id: string; name: string }[];
}

const SearchFilters = ({ onFilterChange, categories }: SearchFiltersProps) => {
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof SearchFiltersType, value: string | number | undefined) => {
    const updated = { ...filters, [key]: value || undefined };
    // Remove undefined keys
    Object.keys(updated).forEach((k) => {
      if (updated[k as keyof SearchFiltersType] === undefined) {
        delete updated[k as keyof SearchFiltersType];
      }
    });
    setFilters(updated);
    onFilterChange(updated);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const filterContent = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
      {/* Category */}
      <div className="space-y-1.5">
        <Label htmlFor="category" className="text-sm font-medium">
          Category
        </Label>
        <Select
          value={filters.category || ""}
          onValueChange={(value) =>
            updateFilter("category", value === "all" ? undefined : value)
          }
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="location" className="text-sm font-medium">
          Location
        </Label>
        <Input
          id="location"
          placeholder="e.g. Mumbai, Remote"
          value={filters.location || ""}
          onChange={(e) => updateFilter("location", e.target.value)}
        />
      </div>

      {/* Language */}
      <div className="space-y-1.5">
        <Label htmlFor="language" className="text-sm font-medium">
          Language
        </Label>
        <Input
          id="language"
          placeholder="e.g. English, Hindi"
          value={filters.language || ""}
          onChange={(e) => updateFilter("language", e.target.value)}
        />
      </div>

      {/* Min Rating */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Min Rating</Label>
        <div className="flex items-center gap-1 h-10">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() =>
                updateFilter(
                  "minRating",
                  filters.minRating === star ? undefined : star
                )
              }
              className="p-0.5 transition-colors hover:scale-110"
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={`h-5 w-5 ${
                  filters.minRating && star <= filters.minRating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div className="space-y-1.5">
        <Label htmlFor="sortBy" className="text-sm font-medium">
          Sort By
        </Label>
        <Select
          value={filters.sortBy || ""}
          onValueChange={(value) =>
            updateFilter(
              "sortBy",
              value === "default"
                ? undefined
                : (value as "rating" | "sessions" | "experience")
            )
          }
        >
          <SelectTrigger id="sortBy">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="rating">Top Rated</SelectItem>
            <SelectItem value="sessions">Most Sessions</SelectItem>
            <SelectItem value="experience">Most Experienced</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <Card>
      <CardContent className="p-4">
        {/* Desktop: always visible */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
          {filterContent}
        </div>

        {/* Mobile: collapsible */}
        <div className="md:hidden">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground p-0"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {Object.keys(filters).length}
                    </span>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <CollapsibleContent className="mt-4">
              {filterContent}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilters;
