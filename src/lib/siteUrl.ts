/**
 * Returns the canonical site URL for building external redirect links
 * (e.g. email verification, password reset, payment return URLs).
 *
 * Prefers the VITE_SITE_URL env var so verification links always point at the
 * deployed app. Falls back to window.location.origin for local development.
 */
export function getSiteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL?.trim();
  const base = configured || window.location.origin;
  // Strip any trailing slash so callers can safely append paths.
  return base.replace(/\/+$/, '');
}
