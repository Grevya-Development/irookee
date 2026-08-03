import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * COMP-1 — Companionship became a top-level offering and a top-level nav item,
 * but the Home hero still described only expert advice and the About page did not
 * mention it at all. Both pages must present it as a core offering alongside
 * expert consulting, and give the visitor a way in.
 */

vi.mock('@/components/Navigation', () => ({ default: () => <nav /> }));
vi.mock('@/components/sections/Footer', () => ({ default: () => <footer /> }));
vi.mock('@/components/ExpertGrid', () => ({ default: () => <div /> }));
vi.mock('@/components/CategoryGrid', () => ({ default: () => <div /> }));
vi.mock('@/lib/analytics', () => ({ track: vi.fn(), trackPageview: vi.fn() }));
vi.mock('@/lib/searchExperts', () => ({
  searchExperts: vi.fn().mockResolvedValue([]),
  searchExpertsDetailed: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/hooks/usePlatformStats', () => ({
  usePlatformStats: () => ({ data: { expertCount: 20, categoryCount: 210, avgRating: 4.8 } }),
}));

const Home = (await import('../PromptPeople')).default;
const About = (await import('../About')).default;

const hrefs = () =>
  screen.getAllByRole('link').map((link) => link.getAttribute('href'));

describe('COMP-1 — Home presents Companionship as a core offering', () => {
  beforeEach(() => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
  });

  it('names companionship in the hero copy, not just expert advice', () => {
    const hero = screen.getByRole('heading', { level: 1 }).parentElement!;
    expect(hero.textContent).toMatch(/companion/i);
  });

  it('gives the visitor a route into companionship', () => {
    expect(hrefs()).toContain('/companionship');
  });

  it('describes what a companion is for, in the visitor\'s terms', () => {
    expect(document.body.textContent).toMatch(
      /hospital|shopping|errand|outing|someone to go with you/i
    );
  });

  it('still presents expert consulting', () => {
    expect(document.body.textContent).toMatch(/expert/i);
  });
});

describe('COMP-1 — About covers both services', () => {
  beforeEach(() => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );
  });

  it('mentions companionship', () => {
    expect(document.body.textContent).toMatch(/companion/i);
  });

  it('links to the companionship offering', () => {
    expect(hrefs()).toContain('/companionship');
  });
});
