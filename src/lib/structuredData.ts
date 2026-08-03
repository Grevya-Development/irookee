/**
 * schema.org builders.
 *
 * Structured data is how a marketplace earns rich results — star ratings on
 * expert listings, service details, breadcrumb trails. Everything here is
 * derived from real database values; never emit a rating or review count the
 * data does not support, which is both a Google policy violation and grounds
 * for a manual action.
 */

import { getSiteUrl } from '@/lib/siteUrl';
import type { CompanionService } from '@/lib/companionship';

const site = () => getSiteUrl() || 'https://irookee.com';

const absolute = (pathOrUrl?: string | null): string | undefined => {
  if (!pathOrUrl) return undefined;
  return pathOrUrl.startsWith('http') ? pathOrUrl : `${site()}${pathOrUrl}`;
};

export interface ExpertLike {
  id: string;
  name?: string | null;
  title?: string | null;
  bio?: string | null;
  image_url?: string | null;
  location?: string | null;
  expertise?: string[] | null;
  languages?: string[] | null;
  company?: string | null;
  rating?: number | string | null;
  past_events?: number | null;
  experience_years?: number | null;
  linkedin_url?: string | null;
  website_url?: string | null;
}

/**
 * A ProfilePage wrapping the expert as a Person, plus the bookable service.
 * AggregateRating is included only when there are real completed sessions to
 * back it.
 */
export function buildExpertJsonLd(expert: ExpertLike): Record<string, unknown>[] {
  const url = `${site()}/expert/${expert.id}`;
  const rating = Number(expert.rating) || 0;
  const sessions = Number(expert.past_events) || 0;

  const person: Record<string, unknown> = {
    '@type': 'Person',
    '@id': `${url}#person`,
    name: expert.name || 'Expert',
    url,
  };
  if (expert.title) person.jobTitle = expert.title;
  if (expert.bio) person.description = expert.bio;
  if (expert.image_url) person.image = absolute(expert.image_url);
  if (expert.company) person.worksFor = { '@type': 'Organization', name: expert.company };
  if (expert.location) person.address = { '@type': 'PostalAddress', addressLocality: expert.location };
  if (expert.expertise?.length) person.knowsAbout = expert.expertise;
  if (expert.languages?.length) person.knowsLanguage = expert.languages;

  const sameAs = [expert.linkedin_url, expert.website_url].filter(Boolean);
  if (sameAs.length) person.sameAs = sameAs;

  // Only claim a rating when it is backed by completed sessions.
  if (rating > 0 && sessions > 0) {
    person.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(rating.toFixed(1)),
      reviewCount: sessions,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const profilePage: Record<string, unknown> = {
    '@type': 'ProfilePage',
    '@id': `${url}#profilepage`,
    url,
    name: `${expert.name || 'Expert'}${expert.title ? ` — ${expert.title}` : ''}`,
    mainEntity: { '@id': `${url}#person` },
    isPartOf: { '@id': `${site()}/#website` },
  };

  const offer: Record<string, unknown> = {
    '@type': 'Service',
    '@id': `${url}#service`,
    name: `1:1 session with ${expert.name || 'an expert'}`,
    serviceType: expert.title || 'Expert consultation',
    provider: { '@id': `${url}#person` },
    areaServed: expert.location || 'IN',
    // Sessions are currently free platform-wide.
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url,
    },
  };

  return [profilePage, person, offer];
}

/** A companionship vertical as a bookable Service. */
export function buildCompanionServiceJsonLd(service: CompanionService): Record<string, unknown> {
  const url = `${site()}/companionship/${service.slug}`;
  return {
    '@type': 'Service',
    '@id': `${url}#service`,
    name: service.name,
    description: service.description,
    serviceType: 'Companionship',
    url,
    provider: { '@id': `${site()}/#organization` },
    areaServed: 'IN',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${service.name} — what's included`,
      itemListElement: service.includes.map((item, i) => ({
        '@type': 'Offer',
        position: i + 1,
        itemOffered: { '@type': 'Service', name: item },
      })),
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url,
    },
  };
}

/** The companionship hub as an ItemList of the ten verticals. */
export function buildCompanionshipHubJsonLd(
  services: CompanionService[]
): Record<string, unknown> {
  return {
    '@type': 'ItemList',
    '@id': `${site()}/companionship#list`,
    name: 'irookee Companionship services',
    numberOfItems: services.length,
    itemListElement: services.map((service, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: service.name,
      description: service.tagline,
      url: `${site()}/companionship/${service.slug}`,
    })),
  };
}

/** Expert directory as an ItemList so listing pages can earn carousels. */
export function buildExpertListJsonLd(
  experts: { id: string; full_name?: string | null; title?: string | null }[]
): Record<string, unknown> {
  return {
    '@type': 'ItemList',
    '@id': `${site()}/experts#list`,
    name: 'Verified experts on irookee',
    numberOfItems: experts.length,
    itemListElement: experts.slice(0, 25).map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: e.full_name || 'Expert',
      url: `${site()}/expert/${e.id}`,
    })),
  };
}
