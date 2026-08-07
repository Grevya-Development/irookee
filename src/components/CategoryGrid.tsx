import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const ICON_EMOJI_MAP: Record<string, string> = {
  Stethoscope: "🩺", HeartPulse: "❤️‍🩹", Sparkles: "✨", Brain: "🧠",
  Heart: "❤️", Apple: "🍎", Activity: "🏃", Leaf: "🌿", FlaskConical: "🧪",
  Smile: "😊", Eye: "👁️", Baby: "👶", Bone: "🦴", Shield: "🛡️", Ear: "👂",
  Scale: "⚖️", Globe: "🌍", FileText: "📄", Home: "🏠", DollarSign: "💰",
  Briefcase: "💼", Code: "💻", Rocket: "🚀", TrendingUp: "📈", Palette: "🎨",
  BookOpen: "📖", BarChart: "📊", Calculator: "🧮", Clock: "⏰", Wallet: "👛",
  Target: "🎯", Settings: "⚙️", Store: "🏪", Handshake: "🤝", Layout: "📐",
  Truck: "🚚", Film: "🎬", Camera: "📷", Video: "🎥", Music: "🎵",
  Headphones: "🎧", PenTool: "✒️", Box: "📦", Image: "🖼️", MapPin: "📍",
  Mountain: "⛰️", Star: "⭐", Backpack: "🎒", Car: "🚗", Ship: "🚢",
  TreePine: "🌲", Compass: "🧭", Flower2: "🌸", Dumbbell: "🏋️", Hash: "🔢",
  MessageSquare: "💬", Smartphone: "📱", Network: "🔗", User: "👤",
  Hammer: "🔨", Building: "🏗️", Wifi: "📶", ChefHat: "👨‍🍳", Cake: "🍰",
  Wine: "🍷", UtensilsCrossed: "🍴", CalendarDays: "📅", Megaphone: "📣",
  Newspaper: "📰", AlertTriangle: "⚠️", Instagram: "📸", Flag: "🏁",
  Trophy: "🏆", Waves: "🌊", Gamepad2: "🎮", Crown: "👑", Bike: "🚲",
  Timer: "⏱️", Cpu: "🖥️", Recycle: "♻️", Droplets: "💧", Sun: "☀️",
  PawPrint: "🐾", Landmark: "🏛️", HeartHandshake: "🤲", Languages: "🗣️",
  ShieldCheck: "🔒", GraduationCap: "🎓", Award: "🏅", Search: "🔍",
  Linkedin: "💼", Mic: "🎤", Bot: "🤖", Glasses: "👓", Database: "🗄️",
  Server: "🖧", CheckCircle: "✅", Cloud: "☁️", Link: "🔗", Atom: "⚛️",
  ShoppingCart: "🛒", Shirt: "👔", Plane: "✈️", Presentation: "📊",
  ClipboardCheck: "📋",
};

interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

const CategoryGrid = memo(() => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const { data, error: dbError } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (dbError) throw dbError;
      setCategories((data || []) as CategoryItem[]);
    } catch (e) {
      console.error("Error fetching categories:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      navigate(`/experts?category=${encodeURIComponent(categoryId)}`);
    },
    [navigate]
  );

  const getEmoji = (iconName: string | null) => {
    if (!iconName) return "📋";
    return ICON_EMOJI_MAP[iconName] || "📋";
  };

  const displayed = showAll ? categories : categories.slice(0, 16);

  const cards = useMemo(
    () =>
      displayed.map((cat, index) => (
        <motion.button
          key={cat.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: index * 0.02 }}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCategoryClick(cat.id)}
          className="group flex flex-col items-center text-center p-4 rounded-2xl glass-card hover:border-indigo-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-2xl mb-2.5 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-transform">
            {getEmoji(cat.icon)}
          </div>
          <h3 className="font-bold text-sm leading-tight text-foreground mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {cat.name}
          </h3>
          {cat.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
              {cat.description}
            </p>
          )}
        </motion.button>
      )),
    [displayed, handleCategoryClick]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 glass-card rounded-2xl p-6 max-w-md mx-auto">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <p className="text-lg font-bold mb-1">Couldn't load categories</p>
        <p className="text-xs text-muted-foreground mb-4">Please check your connection and try again.</p>
        <Button variant="outline" onClick={fetchCategories}>
          Retry Loading
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {cards}
      </div>
      {categories.length > 16 && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="rounded-full px-6 font-semibold gap-1.5 shadow-sm"
          >
            {showAll ? (
              <>
                Show Less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show All {categories.length} Categories <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
});

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
