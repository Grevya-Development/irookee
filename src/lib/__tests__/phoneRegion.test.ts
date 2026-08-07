import { describe, it, expect } from 'vitest';
import { formatAndValidatePhone } from '../phoneUtils';

/**
 * Regression: bare 10-digit numbers are ambiguous between the Indian mobile
 * prefixes (6-9) and North American area codes (650, 702, 800, 917, ...).
 * Every such number used to be rewritten to +91 with no way to opt out, so US
 * numbers were silently stored as Indian ones.
 */
describe('formatAndValidatePhone region handling', () => {
  it('keeps India as the default region for bare 10-digit input', () => {
    expect(formatAndValidatePhone('9966827110').normalized).toBe('+919966827110');
    expect(formatAndValidatePhone('6505551234').normalized).toBe('+916505551234');
  });

  it('does not rewrite North American numbers to +91 when the region is US', () => {
    const collisions: [string, string][] = [
      ['6505551234', '+16505551234'], // 650 Palo Alto
      ['7025551234', '+17025551234'], // 702 Las Vegas
      ['9175551234', '+19175551234'], // 917 New York
      ['8005551234', '+18005551234'], // 800 toll-free
    ];
    for (const [input, expected] of collisions) {
      const res = formatAndValidatePhone(input, 'US');
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe(expected);
    }
  });

  it('honours an explicit country code regardless of the default region', () => {
    expect(formatAndValidatePhone('+16505551234', 'IN').normalized).toBe('+16505551234');
    expect(formatAndValidatePhone('+919966827110', 'US').normalized).toBe('+919966827110');
  });

  it('still normalises non-colliding US area codes without a region hint', () => {
    expect(formatAndValidatePhone('2068831022').normalized).toBe('+12068831022');
  });

  it('still rejects invalid input in both regions', () => {
    for (const region of ['IN', 'US'] as const) {
      expect(formatAndValidatePhone('123', region).isValid).toBe(false);
      expect(formatAndValidatePhone('abcdef', region).isValid).toBe(false);
      expect(formatAndValidatePhone('0000000000', region).isValid).toBe(false);
    }
  });
});
