import { Link } from 'react-router-dom';
import { ArrowRight, Check, ShieldCheck, Search } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/sections/Footer';
import Seo from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/booking/SearchBar';
import { COMPANION_SERVICES, TRUST_POINTS } from '@/lib/companionship';

const Companionship = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Seo
      title="Companionship — book a trusted companion"
      description="Book a verified companion for hospital visits, shopping, errands, travel, outings, social time, digital help, events, and caregiver respite."
      path="/companionship"
    />
    <Navigation />

    <main id="main" className="flex-1">
      {/* ---------------------------------------------------------- hero */}
      <section className="pt-28 pb-14 px-4 bg-gradient-to-b from-indigo-50/70 via-background to-background">
        <div className="container mx-auto max-w-5xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Verified companions
          </p>

          <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Someone to go with you
          </h1>

          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Book a trusted companion for everyday activities, assistance, outings
            and social support — for yourself or for someone you care about.
          </p>

          <div className="mt-8 max-w-2xl mx-auto text-left">
            <SearchBar
              placeholder="Try: someone to take my mother to her hospital appointment"
              label="Describe the companionship you need"
              submitLabel="Find companions"
            />
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Describe it in your own words — our search understands what you mean.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ services */}
      <section aria-labelledby="services-heading" className="px-4 pb-16">
        <div className="container mx-auto max-w-6xl">
          <h2 id="services-heading" className="text-2xl font-bold text-foreground">
            How a companion can help
          </h2>
          <p className="mt-1 text-muted-foreground">
            Ten ways to have someone beside you. Pick one to see companions who offer it.
          </p>

          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {COMPANION_SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <li key={service.slug}>
                  <Link
                    to={`/companionship/${service.slug}`}
                    className="group flex h-full flex-col rounded-2xl border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <span
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${service.accent}`}
                    >
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>

                    <h3 className="mt-4 text-lg font-semibold text-foreground">
                      {service.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-primary">
                      {service.tagline}
                    </p>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>

                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      Find companions
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* --------------------------------------------------------- trust */}
      <section aria-labelledby="trust-heading" className="px-4 py-14 bg-muted/40 border-y">
        <div className="container mx-auto max-w-6xl">
          <h2 id="trust-heading" className="text-2xl font-bold text-foreground">
            Why people trust irookee companions
          </h2>
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_POINTS.map((point) => (
              <li key={point.title} className="flex gap-3">
                <Check
                  className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-semibold text-foreground">{point.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {point.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------------------------------------- cta */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Want to become a companion?
          </h2>
          <p className="mt-2 text-muted-foreground">
            If you are patient, reliable and good with people, you can earn by
            being there for someone in your city.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/expert/onboarding">Apply as a companion</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/experts">
                <Search className="mr-2 h-4 w-4" aria-hidden="true" />
                Browse everyone
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default Companionship;
