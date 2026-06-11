import { useState, useEffect, useMemo, memo } from "react";
import { ExpertProfile } from "@/types/promptpeople";
import ExpertCard from "./ExpertCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { searchExperts } from "@/lib/searchExperts";

interface ExpertGridProps {
  limit?: number;
  categoryId?: string;
  searchQuery?: string;
}

const ExpertGrid = memo(({ limit = 12, categoryId, searchQuery }: ExpertGridProps) => {
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExperts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, searchQuery, limit]);

  const fetchExperts = async () => {
    try {
      setLoading(true);

      const transformedExperts = await searchExperts({
        query: searchQuery,
        categoryId,
        limit,
      });

      setExperts(transformedExperts);
    } catch (error) {
      console.error("Failed to load experts:", error);
      toast({
        title: "Error",
        description: "Failed to load experts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const expertCards = useMemo(() => 
    experts.map((expert) => (
      <ExpertCard key={expert.id} expert={expert} />
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
          No experts found. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {expertCards}
    </div>
  );
});

ExpertGrid.displayName = 'ExpertGrid';

export default ExpertGrid;
