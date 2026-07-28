/**
 * Expertise Area Validation & Sanitization Utility for Irookee
 * Reusable across Frontend, Forms, API endpoints, and database handlers.
 */

// Regex patterns
const SQL_INJECTION_PATTERN = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|UNION|EXEC|EXECUTE)\b|--|\/\*|\*\/|;)/i;
const SCRIPT_HTML_PATTERN = /(<[^>]*>|javascript:|onload=|onerror=|eval\(|expression\()/i;
const PURE_NUMERIC_PATTERN = /^[0-9\s\-_, .()]+$/;
const PURE_SPECIAL_PATTERN = /^[^a-zA-Z0-9]+$/;

// Valid individual expertise tag regex:
// Allows letters (Unicode including Hindi/regional), numbers inside words (e.g. Web3, Python 3, Node.js, React 19, Unity3D),
// spaces, hyphens, ampersands, slashes (UI/UX), dots (.NET), hashes (C#), pluses (C++), apostrophes.
const VALID_TAG_PATTERN = /^[\p{L}0-9\s\-&/.#'+]+$/u;

export interface ExpertiseValidationResult {
  isValid: boolean;
  sanitized: string[];
  sanitizedString: string;
  error?: string;
}

/**
 * Validates a single expertise tag string.
 */
export function validateSingleExpertiseTag(tag: string): { isValid: boolean; error?: string } {
  const trimmed = tag.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Empty expertise area' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: `"${trimmed}" is too short (min 2 characters)` };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: `"${trimmed}" exceeds 50 characters limit` };
  }

  if (SCRIPT_HTML_PATTERN.test(trimmed)) {
    return { isValid: false, error: `"${trimmed}" contains HTML or script tags` };
  }

  if (SQL_INJECTION_PATTERN.test(trimmed)) {
    return { isValid: false, error: `"${trimmed}" contains invalid database keywords or syntax` };
  }

  if (PURE_NUMERIC_PATTERN.test(trimmed)) {
    return { isValid: false, error: `"${trimmed}" cannot be numeric-only` };
  }

  if (PURE_SPECIAL_PATTERN.test(trimmed)) {
    return { isValid: false, error: `"${trimmed}" contains special characters only` };
  }

  if (!VALID_TAG_PATTERN.test(trimmed)) {
    return { isValid: false, error: `"${trimmed}" contains unsupported special symbols` };
  }

  return { isValid: true };
}

/**
 * Validates and normalizes comma-separated expertise area input.
 * Trims whitespace, removes duplicates, and filters out invalid tags.
 */
export function validateExpertiseAreas(input: string | string[]): ExpertiseValidationResult {
  let rawAreas: string[] = [];

  if (typeof input === 'string') {
    rawAreas = input.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (Array.isArray(input)) {
    rawAreas = input.map((s) => String(s).trim()).filter(Boolean);
  }

  if (rawAreas.length === 0) {
    return {
      isValid: false,
      sanitized: [],
      sanitizedString: '',
      error: 'Please specify at least one expertise area',
    };
  }

  const sanitizedMap = new Map<string, string>();
  const errors: string[] = [];

  for (const rawTag of rawAreas) {
    const singleResult = validateSingleExpertiseTag(rawTag);
    if (!singleResult.isValid) {
      if (singleResult.error) {
        errors.push(singleResult.error);
      }
    } else {
      const normalizedKey = rawTag.trim().toLowerCase();
      if (!sanitizedMap.has(normalizedKey)) {
        // Normalize multiple spaces into single space
        const cleanedTag = rawTag.trim().replace(/\s+/g, ' ');
        sanitizedMap.set(normalizedKey, cleanedTag);
      }
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      sanitized: Array.from(sanitizedMap.values()),
      sanitizedString: Array.from(sanitizedMap.values()).join(', '),
      error: errors[0],
    };
  }

  const sanitized = Array.from(sanitizedMap.values());
  return {
    isValid: true,
    sanitized,
    sanitizedString: sanitized.join(', '),
  };
}
