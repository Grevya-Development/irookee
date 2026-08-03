import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Seo from "@/components/Seo";
import { ROUTE_SEO } from "@/lib/seoMeta";
import Navigation from "@/components/Navigation";
import Footer from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { Home, Search, Users } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* This SPA is served with a catch-all rewrite, so an unknown URL still
          returns HTTP 200. Without noindex, every mistyped or stale link becomes
          an indexable soft 404. */}
      <Seo
        title={ROUTE_SEO.notFound.title}
        description={ROUTE_SEO.notFound.description}
        noindex
      />
      <Navigation />

      <main id="main" className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="text-center max-w-md">
          <p className="text-6xl font-bold text-primary">404</p>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            We couldn&apos;t find that page
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            The link may be broken, or the page may have moved. Here are some
            places worth trying instead.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/experts">
                <Search className="mr-2 h-4 w-4" aria-hidden="true" />
                Find an expert
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/companionship">
                <Users className="mr-2 h-4 w-4" aria-hidden="true" />
                Companionship
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
