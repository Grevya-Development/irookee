import posthog from "posthog-js";

const KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
const HOST =
  (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) ||
  "https://us.i.posthog.com";

let initialized = false;

/** Whether analytics is configured (a key is present). */
export const analyticsEnabled = Boolean(KEY);

/**
 * Initialize PostHog once, on app startup. No-ops when no key is configured so
 * local/dev or misconfigured environments never crash or send data.
 * Pageviews are captured manually on route change (SPA), so autocapture of
 * pageviews is disabled here.
 */
export function initAnalytics() {
  if (initialized || !KEY) return;
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: "identified_only",
    autocapture: true,
  });
  initialized = true;
}

/** Capture a custom event. Safe to call even when analytics is disabled. */
export function track(event: string, props?: Record<string, unknown>) {
  if (!KEY) return;
  posthog.capture(event, props);
}

/** Capture an SPA pageview. */
export function trackPageview(path: string) {
  if (!KEY) return;
  posthog.capture("$pageview", { $current_url: window.location.origin + path });
}

/** Associate subsequent events with a signed-in user. */
export function identifyUser(id: string, props?: Record<string, unknown>) {
  if (!KEY) return;
  posthog.identify(id, props);
}

/** Clear identity on sign out. */
export function resetAnalytics() {
  if (!KEY) return;
  posthog.reset();
}

export { posthog };
