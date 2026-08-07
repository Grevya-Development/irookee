import { describe, it, expect } from 'vitest';
import { safeRedirect } from '../redirects';

/**
 * Regression: six call sites append `?redirect=<path>` when sending a signed-out
 * user to /auth, but /auth ignored it and always landed on /dashboard. Now that
 * the value is honoured it becomes attacker-influenced input, so it must be
 * restricted to same-origin paths.
 */
describe('safeRedirect', () => {
  it('accepts root-relative in-app paths', () => {
    expect(safeRedirect('/dashboard')).toBe('/dashboard');
    expect(safeRedirect('/expert/dashboard')).toBe('/expert/dashboard');
    expect(safeRedirect('/experts?category=abc&minRating=4')).toBe('/experts?category=abc&minRating=4');
  });

  it('rejects absolute URLs to other origins', () => {
    expect(safeRedirect('https://evil.example.com')).toBeNull();
    expect(safeRedirect('http://evil.example.com/pwn')).toBeNull();
  });

  it('rejects protocol-relative and backslash-smuggled URLs', () => {
    expect(safeRedirect('//evil.example.com')).toBeNull();
    expect(safeRedirect('/\\evil.example.com')).toBeNull();
  });

  it('rejects javascript: and data: payloads', () => {
    expect(safeRedirect('javascript:alert(1)')).toBeNull();
    expect(safeRedirect('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('rejects control-character smuggling', () => {
    expect(safeRedirect('/\u0001//evil.example.com')).toBeNull();
    expect(safeRedirect('java\tscript:alert(1)')).toBeNull();
  });

  it('treats empty and missing values as no redirect', () => {
    expect(safeRedirect(null)).toBeNull();
    expect(safeRedirect(undefined)).toBeNull();
    expect(safeRedirect('')).toBeNull();
    expect(safeRedirect('   ')).toBeNull();
  });
});
