import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchBar } from "@/components/booking/SearchBar";
import ExpertGrid from "@/components/ExpertGrid";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/promptpeople";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const [categories, setCategories] = useState<Category[]>([]);
  const hasFilters = Boolean(queryParam.trim() || categoryParam);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (!error) {
        setCategories((data || []) as Category[]);
      }
    };

    fetchCategories();
  }, []);

  const updateCategory = useCallback(
    (categoryId?: string) => {
      const nextParams = new URLSearchParams(searchParams);

      if (categoryId) {
        nextParams.set("category", categoryId);
      } else {
        nextParams.delete("category");
      }

      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  return (
    <div className="min-h-screen py-12 container mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Find Experts</h1>
        <p className="text-muted-foreground">
          Search by need, category, language, location, title, topic, or expertise.
        </p>
      </div>

      <SearchBar initialQuery={queryParam} />

      <div className="mt-8 flex flex-wrap gap-2">
        <Button
          type="button"
          variant={!categoryParam ? "default" : "outline"}
          onClick={() => updateCategory()}
        >
          All Categories
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            type="button"
            variant={categoryParam === category.id ? "default" : "outline"}
            onClick={() => updateCategory(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">
          {hasFilters ? "Matching Experts" : "Browse All Experts"}
        </h2>
        <ExpertGrid
          limit={hasFilters ? 40 : 20}
          searchQuery={queryParam}
          categoryId={categoryParam}
        />
      </div>
    </div>
  );
}
