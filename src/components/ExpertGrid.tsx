import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { ExpertProfile } from "@/types/promptpeople";
import ExpertCard from "./ExpertCard";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpertGridSkeleton } from "@/components/ExpertCardSkeleton";
import { searchExperts } from "@/lib/searchExperts";
import type { SearchFilters as SearchFiltersType } from "@/types/promptpeople";

interface ExpertGridProps {
  limit?: number;
  categoryId?: string;
  searchQuery?: string;
  filters?: SearchFiltersType;
}

const ExpertGrid = memo(({ limit = 20, categoryId, searchQuery, filters = {} }: ExpertGridProps) => {
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { category, language, location, minRating, sortBy } = filters;

  const fetchExperts = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const results = await searchExperts({
        ...filters,
        category: category || categoryId,
        query: searchQuery,
        limit,
      });
      setExperts(results);
    } catch (e) {
      console.error("Error fetching experts:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filters, category, categoryId, searchQuery, limit]);

  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  const expertCards = useMemo(
    () =>
      experts.map((expert, index) => (
        <motion.div
          key={expert.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: Math.min(index * 0.035, 0.3) }}
          whileHover={{ y: -3 }}
        >
          <ExpertCard expert={expert} />
        </motion.div>
      )),
    [experts]
  );

  if (loading) {
    return <ExpertGridSkeleton count={Math.min(limit, 8)} />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <p className="text-lg font-medium mb-1">Couldn't load experts</p>
        <p className="text-muted-foreground mb-4">
          Something went wrong while fetching experts. Please try again.
        </p>
        <Button variant="outline" onClick={fetchExperts}>
          Retry
        </Button>
      </div>
    );
  }

  if (experts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No experts found. Try adjusting your filters or search.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {expertCards}
    </motion.div>
  );
});

ExpertGrid.displayName = "ExpertGrid";

export default ExpertGrid;
