import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/promptpeople";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const CategoryGrid = memo(() => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;

      // Map the data to ensure icon field exists, providing a default if missing
      const categoriesWithIcon = (data || []).map(category => ({
        ...category,
        icon: category.icon || '📋' // Default icon if missing
      })) as Category[];

      setCategories(categoriesWithIcon);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = useCallback((categoryId: string) => {
    navigate(`/search?category=${categoryId}`);
  }, [navigate]);

  const categoryCards = useMemo(() => 
    categories.map((category) => (
      <Card 
        key={category.id} 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => handleCategoryClick(category.id)}
      >
        <CardContent className="p-6 text-center">
          <div className="text-3xl mb-3">{category.icon}</div>
          <h3 className="font-semibold text-sm mb-2">{category.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {category.description}
          </p>
        </CardContent>
      </Card>
    )),
    [categories, handleCategoryClick]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categoryCards}
    </div>
  );
});

CategoryGrid.displayName = 'CategoryGrid';

export default CategoryGrid;
