/**
 * Google Analytics 4.
 *
 * Mirrors the PostHog integration in `analytics.ts`: configured by env var,
 * no-ops safely when unset, and driven from the router rather than relying on
 * gtag's automatic pageview.
 *
 * Why this is not the copy-paste snippet in index.html
 * ----------------------------------------------------
 * The stock gtag snippet sends exactly one `page_view` on document load. This
 * app is a client-routed SPA, so every navigation after the first would be
 * invisible to GA — the whole funnel would collapse into the landing page.
 * Instead we load gtag with `send_page_view: false` and emit one `page_view`
 * per route change from `App.tsx`, which is how PostHog is already wired.
 */

const MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();

let initialized = false;

/** Whether GA is configured (a measurement ID is present). */
export const googleAnalyticsEnabled = Boolean(MEASUREMENT_ID);

type GtagArgs =
  | ['js', Date]
  | ['config', string, Record<string, unknown>?]
  | ['event', string, Record<string, unknown>?]
  | ['set', Record<string, unknown>];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

/**
 * Load gtag.js and configure the property. Safe to call more than once.
 * Does nothing when no measurement ID is set, so local and preview builds
 * never pollute the production property.
 */
export function initGoogleAnalytics(): void {
  if (initialized || !MEASUREMENT_ID) return;
  if (typeof document === 'undefined') return;

  initialized = true;

  window.dataLayer = window.dataLayer || [];
  // Must forward `arguments` (not a rest array) — gtag.js reads the raw
  // Arguments object off dataLayer.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  } as Window['gtag'];

  window.gtag!('js', new Date());
  window.gtag!('config', MEASUREMENT_ID, {
    // Pageviews are emitted per route by trackGaPageview().
    send_page_view: false,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

/** Emit a pageview for an SPA route change. */
export function trackGaPageview(path: string): void {
  if (!MEASUREMENT_ID || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: document.title,
  });
}

/** Emit a custom GA event. Safe to call when GA is disabled. */
export function trackGaEvent(name: string, params?: Record<string, unknown>): void {
  if (!MEASUREMENT_ID || !window.gtag) return;
  window.gtag('event', name, params);
}

/**
 * Attach the signed-in user id to subsequent events. GA forbids PII, so this
 * takes an opaque id only — never an email.
 */
export function setGaUser(userId: string | null): void {
  if (!MEASUREMENT_ID || !window.gtag) return;
  window.gtag('set', { user_id: userId ?? undefined });
}

export { MEASUREMENT_ID as gaMeasurementId };
