import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { SearchBar } from '../SearchBar';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));

/** Renders the current URL so navigations are observable. */
const Probe = () => {
  const { pathname, search } = useLocation();
  return <div data-testid="url">{`${pathname}${search}`}</div>;
};

const url = () => screen.getByTestId('url').textContent;

const renderAt = (initial: string, ui: React.ReactNode) =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      {ui}
      <Probe />
    </MemoryRouter>
  );

describe('COMP-4 — companionship search stays on companionship surfaces', () => {
  it('submits a companionship query to the companions results page', async () => {
    renderAt('/companionship', <SearchBar scope="companions" submitLabel="Find companions" />);

    await userEvent.type(screen.getByRole('searchbox'), 'someone to shop');
    await userEvent.click(screen.getByRole('button', { name: /find companions/i }));

    expect(url()).toBe('/companionship/search?q=someone+to+shop');
  });

  it('submits with Enter to the same companions results page', async () => {
    renderAt('/companionship', <SearchBar scope="companions" />);

    await userEvent.type(screen.getByRole('searchbox'), 'hospital visit{Enter}');

    expect(url()).toBe('/companionship/search?q=hospital+visit');
  });

  it('leaves the expert search pointing at the expert results page', async () => {
    renderAt('/', <SearchBar />);

    await userEvent.type(screen.getByRole('searchbox'), 'startup mentor{Enter}');

    expect(url()).toBe('/search?q=startup+mentor');
  });

  it('keeps an in-place search on the experts listing', async () => {
    renderAt('/experts', <SearchBar />);

    await userEvent.type(screen.getByRole('searchbox'), 'career coach{Enter}');

    expect(url()).toBe('/experts?q=career+coach');
  });
});

describe('COMP-5 — the clear control clears, it does not search', () => {
  it('renders exactly one clear affordance', async () => {
    renderAt('/companionship', <SearchBar scope="companions" />);
    await userEvent.type(screen.getByRole('searchbox'), 'someone to shop');

    expect(screen.getAllByRole('button', { name: /clear search/i })).toHaveLength(1);
  });

  it('suppresses the browser-native duplicate clear button', () => {
    renderAt('/companionship', <SearchBar scope="companions" />);

    // WebKit renders its own ✕ for type="search"; unsuppressed it stacks a
    // second, differently-behaved icon inside the same field.
    expect(screen.getByRole('searchbox').className).toContain(
      '[&::-webkit-search-cancel-button]:appearance-none'
    );
  });

  it('does not navigate when clearing on a page that is not a results page', async () => {
    renderAt('/companionship', <SearchBar scope="companions" />);
    const input = screen.getByRole('searchbox');

    await userEvent.type(input, 'someone to shop');
    await userEvent.click(screen.getByRole('button', { name: /clear search/i }));

    expect(input).toHaveValue('');
    expect(url()).toBe('/companionship');
  });

  it('does clear the query when it is already reflected in the URL', async () => {
    renderAt(
      '/companionship/search?q=someone+to+shop',
      <SearchBar scope="companions" initialQuery="someone to shop" />
    );

    await userEvent.click(screen.getByRole('button', { name: /clear search/i }));

    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(url()).toBe('/companionship/search');
  });

  it('preserves sibling filter params when clearing only the query', async () => {
    renderAt(
      '/search?q=shop&location=Chennai',
      <SearchBar initialQuery="shop" />
    );

    await userEvent.click(screen.getByRole('button', { name: /clear search/i }));

    expect(url()).toBe('/search?location=Chennai');
  });
});
