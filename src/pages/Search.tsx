import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/sections/Footer";
import SearchFilters from "@/components/SearchFilters";
import { SearchBar } from "@/components/booking/SearchBar";
import ExpertGrid from "@/components/ExpertGrid";
import type { SearchFilters as SearchFiltersType } from "@/types/promptpeople";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<SearchFiltersType>(() => {
    const initial: SearchFiltersType = {};
    const cat = searchParams.get("category");
    const loc = searchParams.get("location");
    const lang = searchParams.get("language");
    const rating = searchParams.get("minRating");
    const sort = searchParams.get("sortBy");
    if (cat) initial.category = cat;
    if (loc) initial.location = loc;
    if (lang) initial.language = lang;
    if (rating) initial.minRating = Number(rating);
    if (sort && ["rating", "sessions", "experience"].includes(sort)) {
      initial.sortBy = sort as "rating" | "sessions" | "experience";
    }
    return initial;
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Older shared links carry ?category=<name>. Filtering tolerates both, but the
  // Category dropdown is keyed by id, so normalise a name to its id once the
  // category list is available — otherwise the control renders blank.
  useEffect(() => {
    if (!categories.length || !filters.category) return;
    const isKnownId = categories.some((c) => c.id === filters.category);
    if (isKnownId) return;
    const byName = categories.find(
      (c) => c.name.toLowerCase() === String(filters.category).toLowerCase()
    );
    if (byName) {
      setFilters((prev) => ({ ...prev, category: byName.id }));
    }
  }, [categories, filters.category]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (queryParam) params.set("q", queryParam);
    if (filters.category) params.set("category", filters.category);
    if (filters.location) params.set("location", filters.location);
    if (filters.language) params.set("language", filters.language);
    if (filters.minRating) params.set("minRating", String(filters.minRating));
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    
    const newParamsStr = params.toString();
    const currentParamsStr = searchParams.toString();
    if (newParamsStr !== currentParamsStr) {
      setSearchParams(params, { replace: true });
    }
  }, [filters, queryParam, searchParams, setSearchParams]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleFilterChange = useCallback((newFilters: SearchFiltersType) => {
    setFilters(newFilters);
  }, []);

  const handleClearAll = useCallback(() => {
    setFilters({});
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const hasActiveFilters = Object.keys(filters).some((key) => Boolean(filters[key as keyof SearchFiltersType]));
  const hasSearch = Boolean(queryParam.trim());

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <Navigation />
      <div className="container mx-auto px-4 pt-28 pb-20 flex-1">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Find Experts</h1>
          <p className="text-muted-foreground">
            Use AI-powered search to find the perfect expert for your needs
          </p>
        </div>

        <SearchBar initialQuery={queryParam} />

        <div className="mt-8 mb-8">
          <SearchFilters
            onFilterChange={handleFilterChange}
            categories={categories}
            value={filters}
          />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">
            {hasSearch || hasActiveFilters ? "Matching Experts" : "Browse All Experts"}
          </h2>
          <ExpertGrid
            limit={40}
            categoryId={filters.category}
            searchQuery={queryParam}
            filters={filters}
            onClearFilters={handleClearAll}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}
