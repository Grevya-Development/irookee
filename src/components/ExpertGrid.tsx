import { useState, useEffect, useMemo, memo } from "react";
import { motion } from "framer-motion";
import { ExpertProfile } from "@/types/promptpeople";
import ExpertCard from "./ExpertCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
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
  const { toast } = useToast();

  useEffect(() => {
    fetchExperts();
  }, [categoryId, filters.location, filters.language, filters.minRating, filters.sortBy, searchQuery, limit]);

  const fetchExperts = async () => {
    try {
      setLoading(true);
      const results = await searchExperts({
        ...filters,
        category: filters.category || categoryId,
        query: searchQuery,
        limit,
      });
      setExperts(results);
    } catch (error) {
      console.error('Error fetching experts:', error);
      toast({ title: "Error", description: "Failed to load experts.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const expertCards = useMemo(() =>
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
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (experts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No experts found. Try a different search.
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

ExpertGrid.displayName = 'ExpertGrid';

export default ExpertGrid;
