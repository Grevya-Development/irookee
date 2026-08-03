import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle, UserPlus } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/sections/Footer';
import Seo from '@/components/Seo';
import NotFound from '@/pages/NotFound';
import ExpertCard from '@/components/ExpertCard';
import { ExpertGridSkeleton } from '@/components/ExpertCardSkeleton';
import { Button } from '@/components/ui/button';
import { getCompanionService } from '@/lib/companionship';
import { buildCompanionServiceJsonLd } from '@/lib/structuredData';
import { searchExperts } from '@/lib/searchExperts';
import type { ExpertProfile } from '@/types/promptpeople';

const CompanionService = () => {
  const { slug } = useParams<{ slug: string }>();
  const service = getCompanionService(slug);

  const [companions, setCompanions] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!service) return;

    let cancelled = false;
    setLoading(true);
    setFailed(false);

    searchExperts({ service: service.slug, limit: 24 })
      .then((results) => {
        if (!cancelled) setCompanions(results);
      })
      .catch((error) => {
        console.error('Failed to load companions:', error);
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [service]);

  // Unknown slug is a genuine 404, not an empty list.
  if (!service) return <NotFound />;

  const Icon = service.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo
        title={`${service.name} — Book a Verified Companion`}
        description={service.description}
        path={`/companionship/${service.slug}`}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Companionship', path: '/companionship' },
          { name: service.name, path: `/companionship/${service.slug}` },
        ]}
        structuredData={buildCompanionServiceJsonLd(service)}
      />
      <Navigation />

      <main id="main" className="flex-1 container mx-auto max-w-6xl px-4 pt-24 pb-16">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/companionship">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            All companionship services
          </Link>
        </Button>

        {/* ------------------------------------------------------- header */}
        <header className="flex flex-col sm:flex-row sm:items-start gap-5">
          <span
            className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 ${service.accent}`}
          >
            <Icon className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {service.name}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground leading-relaxed">
              {service.description}
            </p>
          </div>
        </header>

        {/* ----------------------------------------------------- includes */}
        <section aria-labelledby="includes-heading" className="mt-10">
          <h2 id="includes-heading" className="text-xl font-semibold text-foreground">
            What this usually includes
          </h2>
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {service.includes.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm">
                <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Typical session: {service.defaultDurationMinutes / 60} hours. You agree the
            exact plan with your companion before the visit.
          </p>
        </section>

        {/* --------------------------------------------------- companions */}
        <section aria-labelledby="companions-heading" className="mt-12">
          <h2 id="companions-heading" className="text-xl font-semibold text-foreground">
            Companions offering this
          </h2>

          <div className="mt-5">
            {loading && <ExpertGridSkeleton count={4} />}

            {!loading && failed && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />
                <p className="mt-3 font-medium text-foreground">
                  We couldn&apos;t load companions right now
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

            {!loading && !failed && companions.length === 0 && (
              <div className="rounded-xl border bg-card p-8 text-center">
                <UserPlus className="mx-auto h-9 w-9 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 text-lg font-semibold text-foreground">
                  No {service.name.toLowerCase()}s in your area yet
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
                  We are onboarding companions city by city. Tell us what you need and
                  we will match you as soon as someone is verified nearby — or apply
                  yourself and be the first.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button asChild>
                    <Link to="/expert/onboarding">Become a companion</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to={`/experts?q=${encodeURIComponent(service.name)}`}>
                      Search everyone
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {!loading && !failed && companions.length > 0 && (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {companions.map((companion) => (
                  <li key={companion.id}>
                    <ExpertCard expert={companion} />
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

export default CompanionService;
