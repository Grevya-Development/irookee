import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * Regression: the empty-state "Clear Search & Filters" button only called
 * navigate("/experts"). The active filters live in Search's React state, which a
 * navigation cannot reset, so Search's URL-sync effect immediately wrote every
 * filter back into the URL and the user stayed stuck on the empty state.
 *
 * ExpertGrid must therefore ask its owner to reset the filter state.
 */

const searchExpertsDetailed = vi.fn();
const searchExperts = vi.fn();
vi.mock('@/lib/searchExperts', () => ({
  searchExperts: (...args: unknown[]) => searchExperts(...args),
  searchExpertsDetailed: (...args: unknown[]) => searchExpertsDetailed(...args),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) },
}));

const ExpertGrid = (await import('../ExpertGrid')).default;

beforeEach(() => {
  searchExperts.mockReset();
  searchExpertsDetailed.mockReset();
  // No experts match -> empty state with the Clear button.
  searchExperts.mockResolvedValue([]);
  searchExpertsDetailed.mockResolvedValue([]);
});

describe('ExpertGrid empty state', () => {
  it('invokes onClearFilters so the owner can reset filter state', async () => {
    const onClearFilters = vi.fn();
    render(
      <MemoryRouter>
        <ExpertGrid filters={{ location: 'Mars' }} onClearFilters={onClearFilters} />
      </MemoryRouter>
    );

    const button = await screen.findByRole('button', { name: /clear search & filters/i });
    await userEvent.click(button);

    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('still renders and works when no handler is supplied', async () => {
    render(
      <MemoryRouter>
        <ExpertGrid filters={{ location: 'Mars' }} />
      </MemoryRouter>
    );
    const button = await screen.findByRole('button', { name: /clear search & filters/i });
    await userEvent.click(button);
    expect(button).toBeInTheDocument();
  });

  it('passes the active filters through to the search layer', async () => {
    render(
      <MemoryRouter>
        <ExpertGrid filters={{ location: 'Mars', minRating: 5 }} limit={40} />
      </MemoryRouter>
    );

    await waitFor(() => expect(searchExpertsDetailed).toHaveBeenCalled());
    expect(searchExpertsDetailed.mock.calls[0][0]).toMatchObject({
      location: 'Mars',
      minRating: 5,
      limit: 40,
    });
  });
});
