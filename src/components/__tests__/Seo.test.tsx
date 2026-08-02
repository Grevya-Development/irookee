import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import Seo from '../Seo';

/**
 * Regressions covered here:
 *  1. index.html declares twitter:* with `property`, while Seo wrote them with
 *     `name`. The selector never matched, so every visit appended a SECOND
 *     twitter:title/description/image and crawlers could read the stale one.
 *  2. Seo had no cleanup, so an expert profile's title/canonical stayed in the
 *     document after navigating to a page that ships no <Seo> (About, Terms,
 *     Dashboard, ...), making those routes self-canonicalise to the expert.
 */

const BASE_TITLE = 'irookee - Find and Book Expert Guidance';

const seedIndexHtmlHead = () => {
  document.head.innerHTML = `
    <meta name="description" content="Base description" />
    <meta property="og:title" content="${BASE_TITLE}" />
    <meta property="og:description" content="Base description" />
    <meta property="og:image" content="https://irookee.vercel.app/og-image.png" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="${BASE_TITLE}" />
    <meta property="twitter:description" content="Base description" />
    <meta property="twitter:image" content="https://irookee.vercel.app/og-image.png" />
  `;
  document.title = BASE_TITLE;
};

const metaContents = (key: string) =>
  Array.from(
    document.head.querySelectorAll<HTMLMetaElement>(
      `meta[name="${key}"], meta[property="${key}"]`
    )
  ).map((el) => el.getAttribute('content'));

beforeEach(() => {
  cleanup();
  seedIndexHtmlHead();
});

describe('Seo', () => {
  it('updates the existing twitter tag instead of appending a duplicate', () => {
    render(<Seo title="jen - travel guide" path="/expert/abc" />);

    for (const key of ['twitter:title', 'twitter:description', 'twitter:image', 'twitter:card']) {
      expect(metaContents(key), `${key} should exist exactly once`).toHaveLength(1);
    }
    expect(metaContents('twitter:title')[0]).toBe('jen - travel guide | irookee');
  });

  it('sets title, canonical and OG tags for the current page', () => {
    render(<Seo title="jen - travel guide" path="/expert/abc" type="profile" />);

    expect(document.title).toBe('jen - travel guide | irookee');
    expect(metaContents('og:type')[0]).toBe('profile');
    expect(
      document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')
    ).toContain('/expert/abc');
  });

  it('restores the previous head on unmount so other routes do not inherit it', () => {
    const view = render(<Seo title="jen - travel guide" path="/expert/abc" />);
    expect(document.title).toBe('jen - travel guide | irookee');

    view.unmount();

    expect(document.title).toBe(BASE_TITLE);
    expect(metaContents('twitter:title')[0]).toBe(BASE_TITLE);
    expect(metaContents('og:title')[0]).toBe(BASE_TITLE);
    const canonical = document.head
      .querySelector('link[rel="canonical"]')
      ?.getAttribute('href');
    // index.html ships no canonical, so none should remain behind.
    expect(canonical ?? null).toBeNull();
  });

  it('does not leak one expert page into the next', () => {
    const first = render(<Seo title="Expert One" path="/expert/one" />);
    first.unmount();
    const second = render(<Seo title="Expert Two" path="/expert/two" />);

    expect(document.title).toBe('Expert Two | irookee');
    expect(metaContents('og:url')[0]).toContain('/expert/two');
    expect(metaContents('og:url')).toHaveLength(1);
    second.unmount();
  });
});
