import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * GA4 is loaded per-test with a fresh module registry so the module-level
 * `MEASUREMENT_ID` and `initialized` flag can be exercised in both states.
 */

const ID = 'G-TESTID1234';

const loadGa = async (measurementId?: string) => {
  vi.resetModules();
  if (measurementId) {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', measurementId);
  } else {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
  }
  return import('../googleAnalytics');
};

const gtagScripts = () =>
  Array.from(document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]'));

beforeEach(() => {
  document.head.innerHTML = '';
  delete (window as { gtag?: unknown }).gtag;
  delete (window as { dataLayer?: unknown }).dataLayer;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('googleAnalytics — disabled without a measurement ID', () => {
  it('reports itself disabled and injects no script', async () => {
    const ga = await loadGa();
    expect(ga.googleAnalyticsEnabled).toBe(false);

    ga.initGoogleAnalytics();
    expect(gtagScripts()).toHaveLength(0);
    expect(window.gtag).toBeUndefined();
  });

  it('every helper is a safe no-op', async () => {
    const ga = await loadGa();
    expect(() => {
      ga.initGoogleAnalytics();
      ga.trackGaPageview('/experts');
      ga.trackGaEvent('booking_submitted', { expert_id: 'x' });
      ga.setGaUser('user-1');
    }).not.toThrow();
    expect(window.dataLayer).toBeUndefined();
  });
});

describe('googleAnalytics — enabled', () => {
  it('injects gtag.js asynchronously with the configured id', async () => {
    const ga = await loadGa(ID);
    expect(ga.googleAnalyticsEnabled).toBe(true);

    ga.initGoogleAnalytics();

    const scripts = gtagScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0].getAttribute('src')).toBe(
      `https://www.googletagmanager.com/gtag/js?id=${ID}`
    );
    expect((scripts[0] as HTMLScriptElement).async).toBe(true);
  });

  it('disables gtag automatic pageviews so SPA routes are not double counted', async () => {
    const ga = await loadGa(ID);
    ga.initGoogleAnalytics();

    const configCall = (window.dataLayer as IArguments[]).find(
      (args) => args[0] === 'config'
    );
    expect(configCall).toBeDefined();
    expect(configCall![1]).toBe(ID);
    expect(configCall![2]).toMatchObject({ send_page_view: false });
  });

  it('is idempotent — a second init does not add a second tag', async () => {
    const ga = await loadGa(ID);
    ga.initGoogleAnalytics();
    ga.initGoogleAnalytics();
    ga.initGoogleAnalytics();
    expect(gtagScripts()).toHaveLength(1);
  });

  it('emits one page_view per route change with the path', async () => {
    const ga = await loadGa(ID);
    ga.initGoogleAnalytics();

    ga.trackGaPageview('/experts?q=startup');
    ga.trackGaPageview('/companionship/hospital');

    const pageViews = (window.dataLayer as IArguments[]).filter(
      (args) => args[0] === 'event' && args[1] === 'page_view'
    );
    expect(pageViews).toHaveLength(2);
    expect(pageViews[0][2]).toMatchObject({ page_path: '/experts?q=startup' });
    expect(pageViews[1][2]).toMatchObject({ page_path: '/companionship/hospital' });
  });

  it('emits custom events with their params', async () => {
    const ga = await loadGa(ID);
    ga.initGoogleAnalytics();
    ga.trackGaEvent('booking_submitted', { expert_id: 'abc', duration: 30 });

    const evt = (window.dataLayer as IArguments[]).find(
      (args) => args[0] === 'event' && args[1] === 'booking_submitted'
    );
    expect(evt).toBeDefined();
    expect(evt![2]).toMatchObject({ expert_id: 'abc', duration: 30 });
  });

  it('sets an opaque user id and clears it on sign-out', async () => {
    const ga = await loadGa(ID);
    ga.initGoogleAnalytics();

    ga.setGaUser('user-123');
    ga.setGaUser(null);

    const sets = (window.dataLayer as IArguments[]).filter((args) => args[0] === 'set');
    expect(sets).toHaveLength(2);
    expect(sets[0][1]).toMatchObject({ user_id: 'user-123' });
    expect(sets[1][1]).toMatchObject({ user_id: undefined });
  });

  it('pushes the raw Arguments object, which gtag.js requires', async () => {
    const ga = await loadGa(ID);
    ga.initGoogleAnalytics();
    // An array here silently breaks gtag: it reads the Arguments object.
    for (const entry of window.dataLayer as unknown[]) {
      expect(Array.isArray(entry)).toBe(false);
      expect(Object.prototype.toString.call(entry)).toBe('[object Arguments]');
    }
  });

  it('does not fire events before init', async () => {
    const ga = await loadGa(ID);
    ga.trackGaPageview('/too-early');
    expect(window.dataLayer).toBeUndefined();
  });
});
