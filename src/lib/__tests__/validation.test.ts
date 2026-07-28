import { describe, it, expect } from 'vitest';
import { validateExpertiseAreas, validateSingleExpertiseTag } from '../expertiseValidation';
import { formatAndValidatePhone } from '../phoneUtils';

describe('BUG 2: Expertise Areas Validation', () => {
  it('should accept valid expertise names', () => {
    const validExamples = [
      'Software Engineering',
      'AI, Machine Learning',
      'Career Guidance',
      'UI/UX Design',
      'B2B Sales',
      'Web3',
      'Node.js',
      'C++',
      'C#',
      '.NET',
      'Python 3',
      'Angular 17',
      'React 19',
      'Unity3D',
    ];

    for (const ex of validExamples) {
      const res = validateExpertiseAreas(ex);
      expect(res.isValid).toBe(true);
      expect(res.sanitized.length).toBeGreaterThan(0);
    }
  });

  it('should reject invalid and dangerous expertise names', () => {
    const invalidExamples = [
      '12345',
      '112233',
      '@@##',
      '%%%$$',
      '<script>',
      '<div>',
      'DROP TABLE',
      'DELETE FROM',
      'SELECT *',
      '--',
      'javascript:',
      '',
      '   ',
    ];

    for (const ex of invalidExamples) {
      const res = validateExpertiseAreas(ex);
      expect(res.isValid).toBe(false);
      expect(res.error).toBeDefined();
    }
  });

  it('should trim whitespace, remove duplicates and normalize formatting', () => {
    const input = ' Software Engineering , AI , Software Engineering , Machine Learning ';
    const res = validateExpertiseAreas(input);
    expect(res.isValid).toBe(true);
    expect(res.sanitized).toEqual(['Software Engineering', 'AI', 'Machine Learning']);
    expect(res.sanitizedString).toBe('Software Engineering, AI, Machine Learning');
  });
});

describe('BUG 3: Indian Phone Number Validation', () => {
  it('should format and normalize raw 10-digit Indian numbers to E.164 (+91)', () => {
    const res = formatAndValidatePhone('9966827110');
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe('+919966827110');
  });

  it('should support Indian numbers with leading 0 or +91 prefix and spaces/hyphens', () => {
    const inputs = [
      '09966827110',
      '+919966827110',
      '+91 99668 27110',
      '+91-99668-27110',
    ];

    for (const inp of inputs) {
      const res = formatAndValidatePhone(inp);
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe('+919966827110');
    }
  });

  it('should support valid international numbers (US, UK)', () => {
    const usRes = formatAndValidatePhone('+12068831022');
    expect(usRes.isValid).toBe(true);
    expect(usRes.normalized).toBe('+12068831022');

    const usRawRes = formatAndValidatePhone('2068831022');
    expect(usRawRes.isValid).toBe(true);
    expect(usRawRes.normalized).toBe('+12068831022');
  });

  it('should reject invalid phone numbers', () => {
    const invalidInputs = ['123', 'abcdef', '0000000000', '+911234'];
    for (const inp of invalidInputs) {
      const res = formatAndValidatePhone(inp);
      expect(res.isValid).toBe(false);
      expect(res.error).toBeDefined();
    }
  });
});
