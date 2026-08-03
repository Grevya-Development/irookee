import { useState, useCallback, memo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Star, Clock, Shield, Users, Globe, Loader2, X, HeartHandshake, ArrowRight, ShieldCheck } from "lucide-react";
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

  // Real, live stats from Supabase (falls back to a tasteful placeholder while
  // loading). Replaces the previously hardcoded numbers so the social proof is
  // accurate and grows with the platform.
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
    <div className="min-h-screen bg-background">
      <Seo
        title={ROUTE_SEO.home.title}
        description={ROUTE_SEO.home.description}
        path={ROUTE_SEO.home.path}
      />
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Prompt the People
            <br />
            <span className="text-foreground">you want.</span>
          </h1>
          {/* Companionship is a top-level offering, not a footnote: the hero has
              to say so, or the nav item is the only place it exists (COMP-1). */}
          <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
            Two ways to get help. Book a verified expert for advice on career,
            travel, finance and personal growth  -  or book a trusted companion to
            be there in person for a hospital visit, shopping trip, errand or outing.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-8 text-sm">
            <Link
              to="/experts"
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-1.5 font-medium text-foreground transition-colors hover:border-primary/50"
            >
              <Users className="h-4 w-4 text-primary" aria-hidden="true" />
              Talk to an expert
            </Link>
            <Link
              to="/companionship"
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-1.5 font-medium text-foreground transition-colors hover:border-primary/50"
            >
              <HeartHandshake className="h-4 w-4 text-primary" aria-hidden="true" />
              Book a companion
            </Link>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
            {/* The clear (X) and Search controls were both absolutely positioned
                from the right edge, so the X sat *inside* the Search button
                (UI-1). They now share a flex row pinned to the right, which
                cannot overlap regardless of button width or label length. */}
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 pointer-events-none"
                aria-hidden="true"
              />
              <label htmlFor="home-search" className="sr-only">
                Describe what you need
              </label>
              <Input
                id="home-search"
                type="search"
                placeholder="e.g., 'I need a mentor for switching to tech' or 'Local guide in Paris'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-40 sm:pr-44 py-6 text-lg rounded-full border-2 focus:border-primary [&::-webkit-search-cancel-button]:appearance-none"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="rounded-full px-6 sm:px-8"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                      Searching...
                    </>
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-3xl font-bold text-foreground">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search Results Section */}
      {hasSearched && (
        <section className="py-20 px-4 bg-background">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">
                  Search Results
                </h2>
                <p className="text-muted-foreground">
                  {isSearching 
                    ? "Searching for experts..." 
                    : searchResults.length > 0 
                      ? `Found ${searchResults.length} matching expert${searchResults.length !== 1 ? 's' : ''}`
                      : "No experts found. Try a different search term."}
                </p>
              </div>
              {hasSearched && (
                <Button variant="outline" onClick={handleClearSearch}>
                  Clear Search
                </Button>
              )}
            </div>

            {isSearching ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {searchResults.map((expert) => (
                  <ExpertCard key={expert.id} expert={expert} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">
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

      {/* Categories Section - Hide when showing search results */}
      {!hasSearched && (
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Browse by Category
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find experts across various fields and specializations
            </p>
          </div>
          <CategoryGrid />
        </div>
      </section>
      )}

      {/* Featured Experts Section - Hide when showing search results */}
      {!hasSearched && (
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Top-Rated Experts
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with our highest-rated verified professionals
            </p>
          </div>
          <ExpertGrid limit={8} />
          <div className="text-center mt-12">
            <Button size="lg" onClick={() => navigate("/experts")}>
              View All Experts
            </Button>
          </div>
        </div>
      </section>
      )}

      {/* Companionship Section - the platform's second core offering */}
      {!hasSearched && (
      <section className="py-20 px-4 bg-gradient-to-b from-indigo-50/60 to-background border-y">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Verified companions
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4">
              Someone to go with you
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Not every problem needs advice  -  some need a person beside you. Book a
              trusted companion for everyday activities, assistance, outings and
              social support, for yourself or for someone you care about.
            </p>
          </div>

          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-5xl mx-auto">
            {COMPANION_SERVICES.slice(0, 5).map((service) => (
              <li key={service.slug}>
                <Link
                  to={`/companionship/${service.slug}`}
                  className="flex h-full flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${service.accent}`}>
                    <service.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium">{service.name}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="text-center mt-10">
            <Button asChild size="lg">
              <Link to="/companionship">
                Explore companionship
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose irookee?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We make finding and connecting with experts simple, safe, and effective
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-card border">
                <feature.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to find your person?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Whether you need expert guidance or simply someone beside you, irookee
            connects you with a verified person who can help.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate("/experts")}>
              Find an Expert
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/companionship">Book a Companion</Link>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white/90 text-primary hover:bg-white"
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
