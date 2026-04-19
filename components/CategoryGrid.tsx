import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Map icon names from DB to emoji for display
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
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories((data || []) as CategoryItem[]);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = useCallback(
    (categoryName: string) => {
      navigate(`/speakers?category=${encodeURIComponent(categoryName)}`);
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
      displayed.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleCategoryClick(cat.name)}
          className="group flex flex-col items-center text-center p-4 rounded-xl border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200"
        >
          <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
            {getEmoji(cat.icon)}
          </span>
          <h3 className="font-medium text-sm leading-tight mb-1">{cat.name}</h3>
          {cat.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
              {cat.description}
            </p>
          )}
        </button>
      )),
    [displayed, handleCategoryClick]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {cards}
      </div>
      {categories.length > 16 && (
        <div className="text-center mt-6">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {showAll ? "Show Less" : `Show All ${categories.length} Categories`}
          </button>
        </div>
      )}
    </div>
  );
});

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
