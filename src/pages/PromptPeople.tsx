import { useState, useCallback, memo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Star, Clock, Shield, Users, Globe, Loader2, X, HeartHandshake, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/Navigation";
import ExpertGrid from "@/components/ExpertGrid";
import CategoryGrid from "@/components/CategoryGrid";
import Footer from "@/components/sections/Footer";
import { ExpertProfile } from "@/types/promptpeople";
import ExpertCard from "@/components/ExpertCard";
import { searchExperts } from "@/lib/searchExperts";
import Seo from "@/components/Seo";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { COMPANION_SERVICES } from "@/lib/companionship";
import { track } from "@/lib/analytics";
import { ROUTE_SEO } from "@/lib/seoMeta";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/motion";

const PromptPeople = memo(() => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { data: platformStats } = usePlatformStats();
  const [searchResults, setSearchResults] = useState<ExpertProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const results = await searchExperts(searchQuery);
      setSearchResults(results);
      track("search_performed", {
        query: searchQuery,
        results_count: results.length,
        source: "home_hero",
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setHasSearched(false);
    setSearchResults([]);
  }, []);

  const fmt = (n: number) => (n >= 10 ? `${Math.floor(n / 10) * 10}+` : `${n}`);
  const stats = [
    {
      number: platformStats ? fmt(platformStats.expertCount) : " - ",
      label: "Verified Experts",
      icon: Users,
    },
    {
      number: platformStats ? fmt(platformStats.categoryCount) : " - ",
      label: "Categories",
      icon: Globe,
    },
    {
      number:
        platformStats && platformStats.avgRating > 0
          ? platformStats.avgRating.toFixed(1)
          : " - ",
      label: "Average Rating",
      icon: Star,
    },
    { number: "100%", label: "Free Platform", icon: Shield },
  ];

  const features = [
    {
      icon: Shield,
      title: "100% Verified Experts",
      description: "Every expert goes through rigorous KYC and background verification"
    },
    {
      icon: Clock,
      title: "Instant Matching",
      description: "AI-powered matching finds the perfect expert for your needs in seconds"
    },
    {
      icon: Star,
      title: "Quality Guaranteed",
      description: "All experts are rated and reviewed by our community"
    },
    {
      icon: HeartHandshake,
      title: "Advice or Company",
      description: "Expert consulting when you need answers, a verified companion when you need someone there"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between overflow-x-hidden">
      <Seo
        title={ROUTE_SEO.home.title}
        description={ROUTE_SEO.home.description}
        path={ROUTE_SEO.home.path}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 aurora-bg border-b border-slate-200/50 dark:border-slate-800/80 overflow-hidden">
        <div className="container mx-auto text-center max-w-5xl relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <motion.div variants={fadeUp} className="flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
                Direct Peer-To-Peer Knowledge & Support
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-foreground">
              Prompt the People <br />
              <span className="text-gradient">You Want 1-on-1.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-normal">
              Book a verified expert for direct guidance on career, finance, AI, and growth — or reserve a trusted companion to assist you in person.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2 text-sm pt-1">
              <Link
                to="/experts"
                className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-2 font-bold text-xs text-foreground transition-all hover:border-indigo-500/50 shadow-sm"
              >
                <Users className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                Talk to an Expert
              </Link>
              <Link
                to="/companionship"
                className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-2 font-bold text-xs text-foreground transition-all hover:border-purple-500/50 shadow-sm"
              >
                <HeartHandshake className="h-4 w-4 text-purple-500" aria-hidden="true" />
                Book a Companion
              </Link>
            </motion.div>

            {/* Search Bar */}
            <motion.div variants={fadeUp} className="max-w-2xl mx-auto pt-2">
              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 group-hover:opacity-50 blur-md transition duration-300" />
                <div className="relative flex items-center glass-panel rounded-2xl p-1.5 border-slate-200/80 dark:border-white/10 shadow-2xl">
                  <Search className="ml-3.5 text-slate-400 h-5 w-5 shrink-0" />
                  <Input
                    id="home-search"
                    type="search"
                    placeholder="e.g. 'AI engineer for startup guidance' or 'Local companion in London'"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-3 text-foreground placeholder:text-muted-foreground/60 shadow-none [&::-webkit-search-cancel-button]:appearance-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="p-1 text-slate-400 hover:text-slate-600 mr-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <Button
                    type="submit"
                    loading={isSearching}
                    size="lg"
                    className="rounded-xl px-6 font-bold shadow-md shrink-0"
                  >
                    {!isSearching && "Search"}
                  </Button>
                </div>
              </form>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-6">
              {stats.map((stat, index) => (
                <div key={index} className="glass-card p-4 rounded-2xl text-center">
                  <stat.icon className="h-6 w-6 mx-auto mb-2 text-indigo-500" />
                  <div className="text-2xl sm:text-3xl font-black text-foreground">{stat.number}</div>
                  <div className="text-xs font-semibold text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Search Results Section */}
      {hasSearched && (
        <section className="py-16 px-4 bg-background">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">
                  Search Results
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isSearching 
                    ? "Searching matching practitioners..." 
                    : searchResults.length > 0 
                      ? `Found ${searchResults.length} matching expert${searchResults.length !== 1 ? 's' : ''}`
                      : "No experts found. Try a different query term."}
                </p>
              </div>
              {hasSearched && (
                <Button variant="outline" size="sm" onClick={handleClearSearch}>
                  Clear Search
                </Button>
              )}
            </div>

            {isSearching ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {searchResults.map((expert) => (
                  <ExpertCard key={expert.id} expert={expert} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 glass-card rounded-2xl p-6 max-w-md mx-auto">
                <p className="text-base text-muted-foreground mb-4">
                  No experts found matching "{searchQuery}"
                </p>
                <Button onClick={handleClearSearch} variant="outline">
                  Clear Search & Browse All
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Categories Section */}
      {!hasSearched && (
        <section className="py-20 px-4 bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-200/50 dark:border-slate-800/80">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12 space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Browse by Domain
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Find verified practitioners across tech, advisory, wellness, and companionship
              </p>
            </div>
            <CategoryGrid />
          </div>
        </section>
      )}

      {/* Top-Rated Experts Section */}
      {!hasSearched && (
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12 space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Top-Rated Verified Experts
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Connect 1-on-1 with highest rated industry advisors
              </p>
            </div>
            <ExpertGrid limit={8} />
            <div className="text-center mt-12">
              <Button size="lg" className="font-bold rounded-xl shadow-md" onClick={() => navigate("/experts")}>
                View Full Expert Directory
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Companionship Section */}
      {!hasSearched && (
        <section className="py-20 px-4 aurora-bg border-y border-slate-200/50 dark:border-slate-800/80">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-10 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-indigo-500" /> Verified Companions
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Someone to Go With You
              </h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Not every situation calls for advice — some call for a trusted person beside you. Book verified companions for hospital visits, errands, and outings.
              </p>
            </div>

            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
              {COMPANION_SERVICES.slice(0, 5).map((service) => (
                <li key={service.slug}>
                  <Link
                    to={`/companionship/${service.slug}`}
                    className="flex h-full flex-col items-center gap-2.5 rounded-2xl glass-card p-5 text-center hover:border-indigo-500/40 hover:-translate-y-1 transition-all"
                  >
                    <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${service.accent}`}>
                      <service.icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-bold text-foreground">{service.name}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="text-center mt-10">
              <Button asChild size="lg" className="rounded-xl font-bold shadow-md">
                <Link to="/companionship">
                  Explore Companionship <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Why Choose irookee?
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Safe, direct, and zero-fee peer-to-peer knowledge exchange
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div key={index} whileHover={{ y: -4 }}>
                <div className="glass-card p-6 rounded-2xl text-center h-full border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto font-bold">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 text-white relative overflow-hidden">
        <div className="container mx-auto text-center max-w-4xl relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Ready to find your person?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Whether you need expert guidance or simply someone beside you, irookee connects you directly with verified practitioners.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center pt-2">
            <Button size="xl" className="font-bold shadow-glow" onClick={() => navigate("/experts")}>
              Find an Expert
            </Button>
            <Button asChild size="xl" variant="outline" className="font-semibold text-white border-white/30 hover:bg-white/10">
              <Link to="/companionship">Book a Companion</Link>
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="font-semibold text-white border-white/30 hover:bg-white/10"
              onClick={() => navigate("/expert/onboarding")}
            >
              Become an Expert
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
});

PromptPeople.displayName = 'PromptPeople';

export default PromptPeople;
