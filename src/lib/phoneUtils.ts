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

/**
 * Validates and normalizes phone numbers.
 * Supports raw 10-digit Indian numbers, prefixed Indian numbers (+91, 0), and international E.164 numbers.
 */
export function formatAndValidatePhone(input: string | null | undefined): PhoneValidationResult {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      normalized: '',
      formattedDisplay: '',
      error: 'Phone number is required',
    };
  }

  const raw = input.trim();
  // Strip spaces, hyphens, brackets, dots
  const stripped = raw.replace(/[\s\-().]/g, '');

  // 1. Indian Phone Numbers Handling
  // Standard 10-digit Indian mobile numbers start with 6, 7, 8, or 9
  const indian10DigitRegex = /^[6-9]\d{9}$/;
  if (indian10DigitRegex.test(stripped)) {
    const normalized = `+91${stripped}`;
    return {
      isValid: true,
      normalized,
      formattedDisplay: `+91 ${stripped.slice(0, 5)} ${stripped.slice(5)}`,
    };
  }

  // 11-digit starting with '0' (Indian local trunk prefix)
  const indian0PrefixedRegex = /^0([6-9]\d{9})$/;
  const match0 = stripped.match(indian0PrefixedRegex);
  if (match0) {
    const mobileDigits = match0[1];
    const normalized = `+91${mobileDigits}`;
    return {
      isValid: true,
      normalized,
      formattedDisplay: `+91 ${mobileDigits.slice(0, 5)} ${mobileDigits.slice(5)}`,
    };
  }

  // 12-digit starting with '91' without '+'
  const indian91PrefixedRegex = /^91([6-9]\d{9})$/;
  const match91 = stripped.match(indian91PrefixedRegex);
  if (match91) {
    const mobileDigits = match91[1];
    const normalized = `+91${mobileDigits}`;
    return {
      isValid: true,
      normalized,
      formattedDisplay: `+91 ${mobileDigits.slice(0, 5)} ${mobileDigits.slice(5)}`,
    };
  }

  // E.164 formatted Indian number (+91XXXXXXXXXX)
  const indianE164Regex = /^\+91([6-9]\d{9})$/;
  const matchE164 = stripped.match(indianE164Regex);
  if (matchE164) {
    const mobileDigits = matchE164[1];
    return {
      isValid: true,
      normalized: stripped,
      formattedDisplay: `+91 ${mobileDigits.slice(0, 5)} ${mobileDigits.slice(5)}`,
    };
  }

  // 2. Generic International E.164 Validation (+[1-9]\d{7,14})
  const generalE164Regex = /^\+[1-9]\d{7,14}$/;
  if (generalE164Regex.test(stripped)) {
    return {
      isValid: true,
      normalized: stripped,
      formattedDisplay: stripped,
    };
  }

  // 10-digit US/Canada/North America without leading '+' (e.g., 2068831022)
  const us10DigitRegex = /^[2-9]\d{9}$/;
  if (us10DigitRegex.test(stripped)) {
    const normalized = `+1${stripped}`;
    return {
      isValid: true,
      normalized,
      formattedDisplay: `+1 (${stripped.slice(0, 3)}) ${stripped.slice(3, 6)}-${stripped.slice(6)}`,
    };
  }

  // 11-digit US starting with '1' without '+'
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

  // Fallback check: If user typed + followed by invalid digits or wrong length
  if (stripped.startsWith('+91')) {
    return {
      isValid: false,
      normalized: '',
      formattedDisplay: raw,
      error: 'Indian phone numbers must contain 10 valid digits starting with 6, 7, 8, or 9',
    };
  }

  return {
    isValid: false,
    normalized: '',
    formattedDisplay: raw,
    error: 'Please enter a valid 10-digit phone number or international number with country code (e.g. +91 99668 27110)',
  };
}
