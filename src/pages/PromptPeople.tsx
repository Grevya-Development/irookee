import { useState, useCallback, memo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Star, Clock, Shield, Users, Globe, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/Navigation";
import ExpertGrid from "@/components/ExpertGrid";
import CategoryGrid from "@/components/CategoryGrid";
import Footer from "@/components/sections/Footer";
import { ExpertProfile } from "@/types/promptpeople";
import ExpertCard from "@/components/ExpertCard";
import { searchExperts } from "@/lib/searchExperts";

const PromptPeople = memo(() => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
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

  const stats = [
    { number: "20+", label: "Verified Experts", icon: Users },
    { number: "40+", label: "Categories", icon: Globe },
    { number: "4.8", label: "Average Rating", icon: Star },
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
      icon: Users,
      title: "Diverse Expertise",
      description: "From career guidance to travel tips, find experts for any situation"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Prompt the People
            <br />
            <span className="text-foreground">you want.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Connect instantly with verified professionals, mentors, and guides. 
            Get expert advice for career, travel, personal growth, and more.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="e.g., 'I need a mentor for switching to tech' or 'Local guide in Paris'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-32 py-6 text-lg rounded-full border-2 focus:border-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-24 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              <Button 
                type="submit"
                disabled={isSearching}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full px-8"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
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
            <Button size="lg" onClick={() => navigate("/speakers")}>
              View All Experts
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
            Ready to Get Expert Guidance?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of people who have found the perfect expert for their needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate("/speakers")}>
              Find an Expert
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
