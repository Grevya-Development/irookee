import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import Seo from '../Seo';
import { buildExpertJsonLd, buildCompanionServiceJsonLd } from '@/lib/structuredData';
import { COMPANION_SERVICES } from '@/lib/companionship';
import { ROUTE_SEO } from '@/lib/seoMeta';

const ld = () => {
  const el = document.getElementById('seo-structured-data');
  return el ? JSON.parse(el.textContent || '{}') : null;
};
const robots = () =>
  document.head.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null;

beforeEach(() => {
  cleanup();
  document.head.innerHTML = '';
  document.title = 'irookee';
});

describe('Seo: robots directives', () => {
  it('marks a page indexable by default', () => {
    render(<Seo title="Find Experts" path="/experts" />);
    expect(robots()).toMatch(/^index, follow/);
    expect(robots()).toContain('max-image-preview:large');
  });

  it('emits noindex for private and 404 pages', () => {
    render(<Seo title="My Dashboard" noindex />);
    expect(robots()).toBe('noindex, nofollow');
  });

  it('does not attach structured data to a noindex page', () => {
    render(
      <Seo
        title="404"
        noindex
        structuredData={{ '@type': 'WebPage', name: 'nope' }}
        breadcrumbs={[{ name: 'Home', path: '/' }]}
      />
    );
    expect(ld()).toBeNull();
  });

  it('restores the previous robots value on unmount', () => {
    document.head.innerHTML = '<meta name="robots" content="index, follow" />';
    const view = render(<Seo title="Dashboard" noindex />);
    expect(robots()).toBe('noindex, nofollow');
    view.unmount();
    expect(robots()).toBe('index, follow');
  });
});

describe('Seo: JSON-LD', () => {
  it('emits a breadcrumb trail with absolute, correctly ordered items', () => {
    render(
      <Seo
        title="Hospital Companion"
        path="/companionship/hospital"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Companionship', path: '/companionship' },
          { name: 'Hospital Companion', path: '/companionship/hospital' },
        ]}
      />
    );
    const graph = ld()['@graph'];
    const crumbs = graph.find((n: { '@type': string }) => n['@type'] === 'BreadcrumbList');
    expect(crumbs.itemListElement).toHaveLength(3);
    expect(crumbs.itemListElement.map((c: { position: number }) => c.position)).toEqual([1, 2, 3]);
    for (const item of crumbs.itemListElement) {
      expect(item.item).toMatch(/^https?:\/\//);
    }
  });

  it('removes page JSON-LD on unmount so it cannot leak to the next route', () => {
    const view = render(<Seo title="X" structuredData={{ '@type': 'WebPage', name: 'X' }} />);
    expect(ld()).not.toBeNull();
    view.unmount();
    expect(ld()).toBeNull();
  });

  it('emits exactly one JSON-LD block per page', () => {
    render(<Seo title="A" structuredData={[{ '@type': 'WebPage' }, { '@type': 'Service' }]} />);
    expect(document.querySelectorAll('#seo-structured-data')).toHaveLength(1);
    expect(ld()['@graph']).toHaveLength(2);
  });
});

describe('structuredData builders', () => {
  const expert = {
    id: 'abc-123',
    name: 'Meera Nair',
    title: 'Hospital Companion',
    bio: 'I accompany patients to appointments.',
    location: 'Coimbatore, India',
    expertise: ['Hospital Companion'],
    languages: ['Tamil', 'English'],
    rating: 4.8,
    past_events: 140,
  };

  it('builds a ProfilePage + Person + Service for an expert', () => {
    const nodes = buildExpertJsonLd(expert);
    const types = nodes.map((n) => n['@type']);
    expect(types).toContain('ProfilePage');
    expect(types).toContain('Person');
    expect(types).toContain('Service');

    const person = nodes.find((n) => n['@type'] === 'Person')!;
    expect(person.name).toBe('Meera Nair');
    expect(person.knowsLanguage).toEqual(['Tamil', 'English']);
  });

  it('includes AggregateRating only when real sessions back it', () => {
    const withRating = buildExpertJsonLd(expert).find((n) => n['@type'] === 'Person')!;
    expect(withRating.aggregateRating).toMatchObject({ ratingValue: 4.8, reviewCount: 140 });

    // A brand-new expert must not advertise a fabricated rating.
    const fresh = buildExpertJsonLd({ ...expert, rating: 0, past_events: 0 })
      .find((n) => n['@type'] === 'Person')!;
    expect(fresh.aggregateRating).toBeUndefined();

    const ratedButUnbooked = buildExpertJsonLd({ ...expert, past_events: 0 })
      .find((n) => n['@type'] === 'Person')!;
    expect(ratedButUnbooked.aggregateRating).toBeUndefined();
  });

  it('builds a Service for every companionship vertical', () => {
    for (const service of COMPANION_SERVICES) {
      const node = buildCompanionServiceJsonLd(service);
      expect(node['@type']).toBe('Service');
      expect(node.name).toBe(service.name);
      expect(node.url).toContain(`/companionship/${service.slug}`);
      const catalog = node.hasOfferCatalog as { itemListElement: unknown[] };
      expect(catalog.itemListElement.length).toBe(service.includes.length);
    }
  });
});

describe('route SEO copy', () => {
  it('gives every route a unique, length-appropriate title and description', () => {
    const entries = Object.values(ROUTE_SEO);
    const titles = entries.map((e) => e.title);
    const descriptions = entries.map((e) => e.description);

    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);

    for (const e of entries) {
      expect(e.title.length, `title too long: ${e.title}`).toBeLessThanOrEqual(65);
      expect(e.title.length).toBeGreaterThan(5);
      expect(e.description.length, `description too short: ${e.path}`).toBeGreaterThan(50);
      expect(e.description.length, `description too long: ${e.path}`).toBeLessThanOrEqual(170);
    }
  });
});
