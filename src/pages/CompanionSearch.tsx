import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, UserPlus } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/sections/Footer';
import Seo from '@/components/Seo';
import ExpertCard from '@/components/ExpertCard';
import { ExpertGridSkeleton } from '@/components/ExpertCardSkeleton';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/booking/SearchBar';
import { getCompanionService } from '@/lib/companionship';
import { searchExpertsDetailed, type DetailedSearchResult } from '@/lib/searchExperts';
import { ROUTE_SEO, HOME_CRUMB } from '@/lib/seoMeta';

/**
 * Companion results.
 *
 * The companionship counterpart of /search. It exists because companionship and
 * expert consulting are distinct services: sending a companionship query to the
 * expert search returned advisory experts tagged "Matched on: Companionship"
 * with live Book Now buttons (COMP-4). Every query here is scoped with
 * `companionsOnly`, so when nobody offers the service the honest answer — an
 * empty state — is what the user gets.
 */
const CompanionSearch = () => {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  const service = getCompanionService(searchParams.get('service'));

  const [results, setResults] = useState<DetailedSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    searchExpertsDetailed({
      query,
      service: service?.slug,
      companionsOnly: true,
      limit: 40,
    })
      .then((found) => {
        if (!cancelled) setResults(found);
      })
      .catch((error) => {
        console.error('Failed to search companions:', error);
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, service?.slug]);

  const heading = service
    ? `${service.name}s`
    : query
      ? 'Matching companions'
      : 'All companions';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo
        title={ROUTE_SEO.companionSearch.title}
        description={ROUTE_SEO.companionSearch.description}
        path={ROUTE_SEO.companionSearch.path}
        breadcrumbs={[
          HOME_CRUMB,
          { name: 'Companionship', path: '/companionship' },
          { name: 'Companions', path: '/companionship/search' },
        ]}
      />
      <Navigation />

      <main id="main" className="flex-1 container mx-auto max-w-6xl px-4 pt-24 pb-16">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/companionship">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            All companionship services
          </Link>
        </Button>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Find a companion
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Describe what you need in your own words. Results only ever include
          verified companions — never expert-consulting profiles.
        </p>

        <div className="mt-6 max-w-2xl">
          <SearchBar
            scope="companions"
            initialQuery={query}
            label="Describe the companionship you need"
            placeholder="Try: someone to take my mother to her hospital appointment"
            submitLabel="Find companions"
          />
        </div>

        <section aria-labelledby="results-heading" className="mt-10">
          <h2 id="results-heading" className="text-xl font-semibold text-foreground">
            {heading}
          </h2>

          {service && (
            <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
          )}

          <div className="mt-5">
            {loading && <ExpertGridSkeleton count={4} />}

            {!loading && failed && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />
                <p className="mt-3 font-medium text-foreground">
                  We couldn&apos;t search companions right now
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please check your connection and try again.
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            )}

            {!loading && !failed && results.length === 0 && (
              <div className="rounded-xl border bg-card p-8 text-center">
                <UserPlus className="mx-auto h-9 w-9 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 text-lg font-semibold text-foreground">
                  {query
                    ? `No companions found for “${query}”`
                    : 'No companions available yet'}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
                  We are onboarding verified companions city by city — check back
                  soon. We will never fill this page with expert-consulting
                  profiles instead.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button asChild>
                    <Link to="/companionship/apply">Apply as a companion</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/companionship">See what companions do</Link>
                  </Button>
                </div>
              </div>
            )}

            {!loading && !failed && results.length > 0 && (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.map(({ profile, reasons }) => (
                  <li key={profile.id} className="flex flex-col gap-1.5">
                    <ExpertCard expert={profile} />
                    {reasons.length > 0 && (
                      <p className="flex flex-wrap items-center gap-1.5 px-1 text-xs text-muted-foreground">
                        <span className="sr-only">Matched your search because of:</span>
                        <span aria-hidden="true">Matched on</span>
                        {reasons.map((reason) => (
                          <span
                            key={reason}
                            className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary"
                          >
                            {reason}
                          </span>
                        ))}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CompanionSearch;
