/**
 * Post-auth redirect targets arrive from `?redirect=` in the URL, which any
 * third party can set. Only same-origin, absolute paths are allowed so the
 * parameter cannot be used to bounce a freshly signed-in user to an external
 * site (open redirect / credential phishing).
 */
export const safeRedirect = (value: string | null | undefined): string | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Must be a root-relative path...
  if (!trimmed.startsWith("/")) return null;
  // ...but not a protocol-relative URL ("//evil.com") or a backslash variant
  // that some browsers normalise into one.
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return null;
  // Reject control characters, which can be used to smuggle a scheme past a
  // naive prefix check.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return null;

  return trimmed;
};
