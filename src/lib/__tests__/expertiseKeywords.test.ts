import { describe, it, expect } from 'vitest';
import { validateExpertiseAreas } from '../expertiseValidation';

/**
 * Regression: the SQL blocklist matched any bare keyword, so real expertise
 * areas containing GRANT / UNION / CREATE as ordinary English words were
 * rejected and those experts could not finish onboarding.
 */
describe('expertise validation: legitimate terms containing SQL keywords', () => {
  it('accepts professional skills that contain SQL keywords as English words', () => {
    const legitimate = [
      'Grant Writing',
      'Grant Management',
      'Union Negotiations',
      'Labor Union Relations',
      'Creative Direction',
      'Content Creation',
      'Executive Coaching',
    ];
    for (const term of legitimate) {
      const res = validateExpertiseAreas(term);
      expect(res.isValid, `${term} should be valid but got: ${res.error}`).toBe(true);
      expect(res.sanitized).toContain(term);
    }
  });

  it('accepts parenthesised qualifiers', () => {
    const res = validateExpertiseAreas('Sales (B2B)');
    expect(res.isValid).toBe(true);
    expect(res.sanitized).toEqual(['Sales (B2B)']);
  });

  it('still rejects input that looks like an actual SQL statement', () => {
    const dangerous = [
      'DROP TABLE',
      'DELETE FROM',
      'SELECT *',
      'TRUNCATE TABLE',
      'GRANT ALL',
      'UNION SELECT',
      'INSERT INTO',
      '--',
      'a; DROP',
    ];
    for (const term of dangerous) {
      const res = validateExpertiseAreas(term);
      expect(res.isValid, `${term} should be rejected`).toBe(false);
      expect(res.error).toBeDefined();
    }
  });

  it('treats comma-separated values identically for string and array input', () => {
    const asString = validateExpertiseAreas('AI, ML');
    const asArray = validateExpertiseAreas(['AI, ML']);
    expect(asString.isValid).toBe(true);
    expect(asArray.isValid).toBe(true);
    expect(asArray.sanitized).toEqual(asString.sanitized);
    expect(asArray.sanitized).toEqual(['AI', 'ML']);
  });
});
