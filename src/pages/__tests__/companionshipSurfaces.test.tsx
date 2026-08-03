import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

/**
 * Companionship entry points must stay inside the companionship service.
 *
 * COMP-2 — "Apply as a companion" went to /expert/onboarding, the generic expert
 *          form, with no companion fields and no ID-verification step.
 * COMP-3 — "Browse everyone" went to /experts and listed advisory experts.
 * COMP-4 — the companions results page must show an explicit empty state rather
 *          than experts with live Book Now buttons.
 */

const searchExpertsDetailed = vi.fn();
const searchExperts = vi.fn();
vi.mock('@/lib/searchExperts', () => ({
  searchExperts: (...args: unknown[]) => searchExperts(...args),
  searchExpertsDetailed: (...args: unknown[]) => searchExpertsDetailed(...args),
}));
vi.mock('@/components/Navigation', () => ({ default: () => <nav /> }));
vi.mock('@/components/sections/Footer', () => ({ default: () => <footer /> }));
vi.mock('@/lib/analytics', () => ({ track: vi.fn(), trackPageview: vi.fn() }));
// ExpertCard mounts BookingModal, which reads the auth context.
vi.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({ user: null, profile: null, session: null, loading: false, signOut: vi.fn() }),
}));

const Companionship = (await import('../Companionship')).default;
const CompanionService = (await import('../CompanionService')).default;
const CompanionSearch = (await import('../CompanionSearch')).default;

beforeEach(() => {
  searchExperts.mockReset().mockResolvedValue([]);
  searchExpertsDetailed.mockReset().mockResolvedValue([]);
});

const href = (name: RegExp) => screen.getByRole('link', { name }).getAttribute('href');

describe('COMP-2 / COMP-3 — Companionship page CTAs', () => {
  beforeEach(() => {
    render(
      <MemoryRouter initialEntries={['/companionship']}>
        <Companionship />
      </MemoryRouter>
    );
  });

  it('routes "Apply as a companion" to the companion application, not the expert form', () => {
    expect(href(/apply as a companion/i)).toBe('/companionship/apply');
  });

  it('routes the browse CTA to the companions listing, not the experts listing', () => {
    const browse = href(/browse (all )?companions/i);
    expect(browse).toBe('/companionship/search');
  });

  it('has no link into the expert onboarding or expert listing anywhere on the page', () => {
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('href')).not.toBe('/expert/onboarding');
      expect(link.getAttribute('href')).not.toBe('/experts');
    }
  });
});

describe('COMP-2 / COMP-3 — per-service empty state CTAs', () => {
  it('keeps both CTAs inside companionship', async () => {
    render(
      <MemoryRouter initialEntries={['/companionship/hospital']}>
        <Routes>
          <Route path="/companionship/:slug" element={<CompanionService />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole('link', { name: /become a companion/i });
    expect(href(/become a companion/i)).toBe('/companionship/apply');
    expect(href(/browse (all )?companions/i)).toBe('/companionship/search');
  });

  it('asks the search layer for companions only', async () => {
    render(
      <MemoryRouter initialEntries={['/companionship/hospital']}>
        <Routes>
          <Route path="/companionship/:slug" element={<CompanionService />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(searchExperts).toHaveBeenCalled());
    expect(searchExperts.mock.calls[0][0]).toMatchObject({
      service: 'hospital',
      companionsOnly: true,
    });
  });
});

describe('COMP-4 — companions results page', () => {
  const renderSearch = (url: string) =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <CompanionSearch />
      </MemoryRouter>
    );

  it('restricts the search to companions', async () => {
    renderSearch('/companionship/search?q=someone+to+shop');

    await waitFor(() => expect(searchExpertsDetailed).toHaveBeenCalled());
    expect(searchExpertsDetailed.mock.calls[0][0]).toMatchObject({
      query: 'someone to shop',
      companionsOnly: true,
    });
  });

  it('shows an explicit empty state for a query nobody serves yet', async () => {
    renderSearch('/companionship/search?q=someone+to+shop');

    expect(await screen.findByText(/no companions found/i)).toBeInTheDocument();
    expect(screen.getByText(/check back soon/i)).toBeInTheDocument();
  });

  it('shows an explicit empty state when browsing with no companions on the platform', async () => {
    renderSearch('/companionship/search');

    expect(await screen.findByText(/no companions available yet/i)).toBeInTheDocument();
  });

  it('offers no bookable result while the empty state is showing', async () => {
    renderSearch('/companionship/search?q=someone+to+shop');

    await screen.findByText(/no companions found/i);
    expect(screen.queryByRole('link', { name: /book now/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /book now/i })).not.toBeInTheDocument();
  });

  it('narrows to one vertical when a service is requested', async () => {
    renderSearch('/companionship/search?service=hospital');

    await waitFor(() => expect(searchExpertsDetailed).toHaveBeenCalled());
    expect(searchExpertsDetailed.mock.calls[0][0]).toMatchObject({
      service: 'hospital',
      companionsOnly: true,
    });
    expect(await screen.findByText(/hospital companion/i)).toBeInTheDocument();
  });

  it('lists companions when some exist, with their match explanation', async () => {
    searchExpertsDetailed.mockResolvedValue([
      {
        profile: {
          id: 'c1',
          user_id: 'u1',
          full_name: 'Anita Rao',
          title: 'Shopping Companion',
          bio: 'Groceries and bags.',
          industry_expertise: ['Shopping Companion'],
          years_experience: 4,
          location: 'Chennai, India',
          languages: ['Tamil'],
          hourly_rate: 0,
          status: 'approved',
          verification_level: 'verified',
          rating: 4.8,
          total_sessions: 12,
          intro_video_url: null,
          kyc_documents: null,
          availability_timezone: null,
          is_instant_available: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        score: 0.8,
        reasons: ['Shopping companion'],
      },
    ]);

    renderSearch('/companionship/search?q=someone+to+shop');

    expect(await screen.findByText('Anita Rao')).toBeInTheDocument();
    expect(screen.getByText('Shopping companion')).toBeInTheDocument();
    expect(screen.queryByText(/no companions found/i)).not.toBeInTheDocument();
  });
});
