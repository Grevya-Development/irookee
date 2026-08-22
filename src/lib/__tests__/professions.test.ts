import { describe, it, expect } from 'vitest';
import {
  PREDEFINED_PROFESSIONS,
  OTHER_PROFESSION_VALUE,
  filterProfessions,
  validateCustomProfession,
} from '../professions';

describe('Profession Catalog & Filtering Logic', () => {
  it('contains the curated predefined professions', () => {
    expect(PREDEFINED_PROFESSIONS.length).toBeGreaterThan(20);
    expect(PREDEFINED_PROFESSIONS).toContain('Software Engineer');
    expect(PREDEFINED_PROFESSIONS).toContain('AI / Prompt Engineer');
    expect(PREDEFINED_PROFESSIONS).toContain('Career Coach');
  });

  it('filters professions matching "soft" (case-insensitive and partial match)', () => {
    const results = filterProfessions('soft');
    expect(results).toContain('Software Engineer');
    expect(results.every(r => r.toLowerCase().includes('soft'))).toBe(true);
  });

  it('handles uppercase and mixed case queries identically', () => {
    const lowerResults = filterProfessions('developer');
    const upperResults = filterProfessions('DEVELOPER');
    const mixedResults = filterProfessions('DeVeLoPeR');

    expect(lowerResults).toEqual(upperResults);
    expect(lowerResults).toEqual(mixedResults);
    expect(lowerResults).toContain('Frontend Developer');
    expect(lowerResults).toContain('Backend Developer');
  });

  it('returns empty array when search query matches no predefined profession', () => {
    const results = filterProfessions('xyzunobtanium123');
    expect(results).toHaveLength(0);
  });

  it('returns the entire list when search query is empty or whitespace', () => {
    const emptyResults = filterProfessions('');
    const whitespaceResults = filterProfessions('   ');
    expect(emptyResults).toEqual([...PREDEFINED_PROFESSIONS]);
    expect(whitespaceResults).toEqual([...PREDEFINED_PROFESSIONS]);
  });
});

describe('Custom Profession Validation', () => {
  it('rejects empty input', () => {
    const res = validateCustomProfession('');
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/please enter your profession/i);
  });

  it('rejects whitespace-only input', () => {
    const res = validateCustomProfession('    ');
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/please enter your profession/i);
  });

  it('rejects single character input', () => {
    const res = validateCustomProfession('A');
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/at least 2 characters/i);
  });

  it('rejects excessively long input (>80 characters)', () => {
    const longString = 'A'.repeat(81);
    const res = validateCustomProfession(longString);
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/not exceed 80 characters/i);
  });

  it('rejects numeric-only input', () => {
    const res = validateCustomProfession('12345678');
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/numeric only/i);
  });

  it('rejects input with invalid/dangerous symbols', () => {
    const res = validateCustomProfession('Hacker <script>');
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/invalid symbols/i);
  });

  it('accepts and sanitizes valid custom profession', () => {
    const res = validateCustomProfession('  Quantum   Computing Specialist  ');
    expect(res.isValid).toBe(true);
    expect(res.sanitizedValue).toBe('Quantum Computing Specialist');
  });
});
