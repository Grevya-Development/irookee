/**
 * Phone Number Validation and E.164 Formatting Utility for Irookee.
 * Supports Indian phone numbers (+91), US numbers (+1), UK (+44), and standard international E.164 numbers.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  formattedDisplay: string;
  error?: string;
}

/** Region assumed for bare 10-digit input, which is ambiguous between the
 *  Indian and North American numbering plans. */
export type PhoneRegion = 'IN' | 'US';

/**
 * Validates and normalizes phone numbers.
 * Supports raw 10-digit Indian numbers, prefixed Indian numbers (+91, 0), and international E.164 numbers.
 */
export function formatAndValidatePhone(
  input: string | null | undefined,
  defaultRegion: PhoneRegion = 'IN'
): PhoneValidationResult {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      normalized: '',
      formattedDisplay: '',
      error: 'Phone number is required',
    };
  }

  const raw = input.trim();

  // Reject invalid characters (only allow digits, spaces, hyphens, parentheses, dots, and a single leading '+')
  if (/[^0-9\s\-().+]/.test(raw) || (raw.includes('+') && !raw.startsWith('+')) || (raw.match(/\+/g) || []).length > 1) {
    return {
      isValid: false,
      normalized: '',
      formattedDisplay: raw,
      error: 'Phone number contains invalid characters',
    };
  }

  // Strip spaces, hyphens, brackets, dots
  const stripped = raw.replace(/[\s\-().]/g, '');

  // 1. Explicit Indian Phone Numbers (+91 prefix)
  if (stripped.startsWith('+91')) {
    const digits = stripped.slice(3);
    if (digits.length !== 10) {
      return {
        isValid: false,
        normalized: '',
        formattedDisplay: raw,
        error: `Indian phone numbers must contain exactly 10 digits after +91 (got ${digits.length})`,
      };
    }
    if (!/^[6-9]\d{9}$/.test(digits)) {
      return {
        isValid: false,
        normalized: '',
        formattedDisplay: raw,
        error: 'Indian phone numbers must start with 6, 7, 8, or 9',
      };
    }
    return {
      isValid: true,
      normalized: `+91${digits}`,
      formattedDisplay: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
    };
  }

  // 2. 11-digit starting with '0' (Indian local trunk prefix)
  if (stripped.startsWith('0') && stripped.length === 11) {
    const mobileDigits = stripped.slice(1);
    if (/^[6-9]\d{9}$/.test(mobileDigits)) {
      return {
        isValid: true,
        normalized: `+91${mobileDigits}`,
        formattedDisplay: `+91 ${mobileDigits.slice(0, 5)} ${mobileDigits.slice(5)}`,
      };
    }
    return {
      isValid: false,
      normalized: '',
      formattedDisplay: raw,
      error: 'Indian phone numbers must contain 10 valid digits starting with 6, 7, 8, or 9',
    };
  }

  // 3. 12-digit starting with '91' without '+'
  if (stripped.startsWith('91') && stripped.length === 12) {
    const mobileDigits = stripped.slice(2);
    if (/^[6-9]\d{9}$/.test(mobileDigits)) {
      return {
        isValid: true,
        normalized: `+91${mobileDigits}`,
        formattedDisplay: `+91 ${mobileDigits.slice(0, 5)} ${mobileDigits.slice(5)}`,
      };
    }
    return {
      isValid: false,
      normalized: '',
      formattedDisplay: raw,
      error: 'Indian phone numbers must contain 10 valid digits starting with 6, 7, 8, or 9',
    };
  }

  // 4. Bare 10-digit Indian Mobile Number (defaultRegion === 'IN')
  const indian10DigitRegex = /^[6-9]\d{9}$/;
  if (defaultRegion === 'IN' && indian10DigitRegex.test(stripped)) {
    const normalized = `+91${stripped}`;
    return {
      isValid: true,
      normalized,
      formattedDisplay: `+91 ${stripped.slice(0, 5)} ${stripped.slice(5)}`,
    };
  }

  // 5. Bare 10-digit US Number (defaultRegion === 'US')
  const us10DigitRegex = /^[2-9]\d{9}$/;
  if (defaultRegion === 'US' && us10DigitRegex.test(stripped)) {
    const normalized = `+1${stripped}`;
    return {
      isValid: true,
      normalized,
      formattedDisplay: `+1 (${stripped.slice(0, 3)}) ${stripped.slice(3, 6)}-${stripped.slice(6)}`,
    };
  }

  // 6. Non-colliding US area codes (starts with 2-5) without explicit region hint
  const usNonCollidingRegex = /^[2-5]\d{9}$/;
  if (usNonCollidingRegex.test(stripped)) {
    const normalized = `+1${stripped}`;
    return {
      isValid: true,
      normalized,
      formattedDisplay: `+1 (${stripped.slice(0, 3)}) ${stripped.slice(3, 6)}-${stripped.slice(6)}`,
    };
  }

  // 7. 11-digit US starting with '1' without '+' (only when defaultRegion is 'US')
  if (defaultRegion === 'US') {
    const us11DigitRegex = /^1([2-9]\d{9})$/;
    const matchUS1 = stripped.match(us11DigitRegex);
    if (matchUS1) {
      const normalized = `+${stripped}`;
      return {
        isValid: true,
        normalized,
        formattedDisplay: `+1 (${matchUS1[1].slice(0, 3)}) ${matchUS1[1].slice(3, 6)}-${matchUS1[1].slice(6)}`,
      };
    }
  }

  // 8. Generic International E.164 (+[1-9]\d{6,14}) for other countries
  if (stripped.startsWith('+')) {
    const intlDigits = stripped.slice(1);
    if (/^[1-9]\d{6,14}$/.test(intlDigits)) {
      return {
        isValid: true,
        normalized: stripped,
        formattedDisplay: stripped,
      };
    }
    return {
      isValid: false,
      normalized: '',
      formattedDisplay: raw,
      error: 'Please enter a valid international phone number with country code',
    };
  }

  // 9. Numeric input with incorrect length
  if (/^\d+$/.test(stripped)) {
    if (stripped.length !== 10) {
      return {
        isValid: false,
        normalized: '',
        formattedDisplay: raw,
        error: `Indian phone numbers must contain 10 digits (got ${stripped.length})`,
      };
    }
    return {
      isValid: false,
      normalized: '',
      formattedDisplay: raw,
      error: 'Indian phone numbers must start with 6, 7, 8, or 9',
    };
  }

  return {
    isValid: false,
    normalized: '',
    formattedDisplay: raw,
    error: 'Please enter a valid 10-digit phone number or international number with country code (e.g. +91 99668 27110)',
  };
}
