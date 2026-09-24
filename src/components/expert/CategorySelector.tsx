import { useState, useMemo } from 'react';
import { Search, X, CheckCircle2, Sparkles, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface CategoryItem {
  id: string;
  name: string;
  description?: string | null;
}

export interface CategorySelectorProps {
  categories: CategoryItem[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  onClearSelection?: () => void;
  userProfession?: string;
  userExpertise?: string;
  className?: string;
}

type FilterTab = 'all' | 'suggested' | 'selected';

const DOMAIN_ACRONYMS = new Set(['ai', 'ml', 'ui', 'ux', 'qa', 'hr', 'pr', 'it', 'ar', 'vr']);

const STOP_WORDS = new Set([
  'a', 'about', 'all', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'how', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'their',
  'this', 'to', 'was', 'were', 'will', 'with', 'or', 'you', 'your', 'i', 'my', 'we',
  'our', 'me', 'us', 'who', 'what', 'when', 'where', 'which', 'why',
  // generic filler/role words that cause misleading matches
  'senior', 'junior', 'lead', 'head', 'consultant', 'specialist', 'advisor',
  'services', 'etc', 'other', 'expert', 'years', 'experience', 'general',
]);

function extractKeywords(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/i)
    .map((w) => w.trim())
    .filter((w) => {
      if (STOP_WORDS.has(w)) return false;
      if (w.length >= 3) return true;
      return DOMAIN_ACRONYMS.has(w);
    });
}

export const CategorySelector = ({
  categories,
  selectedCategories,
  onToggleCategory,
  onClearSelection,
  userProfession = '',
  userExpertise = '',
  className = '',
}: CategorySelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Compute keyword tokens from user's Stage 2 data (profession & expertise)
  const userKeywords = useMemo(() => {
    const combined = `${userProfession || ''} ${userExpertise || ''}`;
    return extractKeywords(combined);
  }, [userProfession, userExpertise]);

  // Categories matching user's profession / expertise
  const suggestedCategoryIds = useMemo(() => {
    if (userKeywords.length === 0) return new Set<string>();

    const matches = new Set<string>();
    for (const cat of categories) {
      const catWords = extractKeywords(`${cat.name} ${cat.description || ''}`);
      const isMatch = userKeywords.some((userKw) =>
        catWords.some((catKw) => {
          if (userKw === catKw) return true;
          // Stem/prefix match if keyword is at least 4 characters long (e.g. "tech" -> "technology", "market" -> "marketing")
          if (userKw.length >= 4 && catKw.startsWith(userKw)) return true;
          if (catKw.length >= 4 && userKw.startsWith(catKw)) return true;
          return false;
        })
      );
      if (isMatch) {
        matches.add(cat.id);
      }
    }
    return matches;
  }, [categories, userKeywords]);

  // Base list depending on active filter tab
  const tabFilteredCategories = useMemo(() => {
    if (activeTab === 'suggested') {
      return categories.filter((cat) => suggestedCategoryIds.has(cat.id));
    }
    if (activeTab === 'selected') {
      return categories.filter((cat) => selectedCategories.includes(cat.id));
    }
    return categories;
  }, [categories, activeTab, suggestedCategoryIds, selectedCategories]);

  // Live search filter (case-insensitive, trimmed)
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const displayedCategories = useMemo(() => {
    if (!normalizedQuery) return tabFilteredCategories;
    return tabFilteredCategories.filter((cat) => {
      const nameMatch = cat.name.toLowerCase().includes(normalizedQuery);
      const descMatch = cat.description
        ? cat.description.toLowerCase().includes(normalizedQuery)
        : false;
      return nameMatch || descMatch;
    });
  }, [tabFilteredCategories, normalizedQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories (e.g. Technology, Health, Business)..."
          className="pl-10 pr-10 h-11 bg-background text-sm rounded-xl border-slate-200 dark:border-slate-800 transition-all focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Search categories"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/80 transition-colors"
            aria-label="Clear search text"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/40 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All <span className="text-[11px] opacity-70">({categories.length})</span>
          </button>

          {suggestedCategoryIds.size > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('suggested')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
                activeTab === 'suggested'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3 w-3 text-amber-500" aria-hidden="true" />
              Suggested <span className="text-[11px] opacity-70">({suggestedCategoryIds.size})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('selected')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
              activeTab === 'selected'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Selected{' '}
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedCategories.length > 0
                  ? 'bg-primary/15 text-primary'
                  : 'opacity-70'
              }`}
            >
              {selectedCategories.length}
            </span>
          </button>
        </div>

        {/* Selection Status & Clear Action */}
        <div className="flex items-center gap-2 text-xs">
          {selectedCategories.length > 0 && onClearSelection && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              Clear selection
            </Button>
          )}
          <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1">
            {selectedCategories.length} selected
          </Badge>
        </div>
      </div>

      {/* Results Header / Status */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          {displayedCategories.length === categories.length
            ? `Showing all ${categories.length} categories`
            : `Showing ${displayedCategories.length} of ${categories.length} categories`}
        </span>
        {activeTab === 'suggested' && userProfession && (
          <span className="truncate max-w-[200px] text-[11px] italic">
            Based on: {userProfession}
          </span>
        )}
      </div>

      {/* Categories Grid / Cloud */}
      <div
        className="p-3 border rounded-xl bg-background/50 max-h-72 overflow-y-auto"
        role="region"
        aria-label="Available Categories"
      >
        {displayedCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {displayedCategories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={cat.name}
                  onClick={() => onToggleCategory(cat.id)}
                  title={cat.description || cat.name}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold ring-1 ring-primary/30'
                      : 'bg-background/80 border-border hover:border-primary/50 text-foreground hover:bg-muted/60'
                  }`}
                >
                  {isSelected ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
                  ) : (
                    <span
                      className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700"
                      aria-hidden="true"
                    />
                  )}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          /* Empty / No Results State */
          <div
            role="status"
            aria-live="polite"
            className="py-10 px-4 text-center space-y-3"
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Filter className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {searchQuery
                  ? `No categories matching "${searchQuery}"`
                  : activeTab === 'selected'
                  ? 'No categories selected yet'
                  : activeTab === 'suggested'
                  ? 'No specific recommendations found'
                  : 'No categories available'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'Try searching with another keyword or clear your search to browse all categories.'
                  : activeTab === 'selected'
                  ? 'Click on categories from the "All" tab to add them to your profile.'
                  : 'Switch to the "All" tab to explore all available categories.'}
              </p>
            </div>
            {searchQuery ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearSearch}
                className="text-xs h-8"
              >
                Clear search
              </Button>
            ) : activeTab !== 'all' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('all')}
                className="text-xs h-8"
              >
                View all categories
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySelector;
