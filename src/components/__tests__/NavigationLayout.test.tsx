import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * UI-3 — the top navbar looked misaligned once "Companionship" was added.
 *
 * The row is a fixed 64px flex line. Adding a sixth wide label pushed the
 * signed-in nav past the 768px `md` breakpoint it switches on at, and because no
 * item forbade wrapping, flex shrank the links until "Become an Expert" and
 * "Expert Desk" broke onto two lines — which is what reads as misalignment.
 *
 * jsdom has no layout engine, so these assert the layout contract that keeps the
 * row on one line rather than measured pixels.
 */

vi.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'kavin@example.com' },
    profile: { full_name: 'Kavin', user_type: 'expert' },
    session: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));
vi.mock('@/lib/auth', () => ({ isCurrentUserAdmin: () => Promise.resolve(false) }));
vi.mock('@/components/NotificationCenter', () => ({ NotificationCenter: () => <div /> }));

const Navigation = (await import('../Navigation')).default;

const renderNav = () =>
  render(
    <MemoryRouter>
      <Navigation />
    </MemoryRouter>
  );

describe('UI-3 — navbar stays on one line', () => {
  it('never lets a nav label wrap onto a second line', () => {
    renderNav();

    for (const link of screen.getAllByRole('link')) {
      // The brand lockup is a flex row, not a text label.
      if (link.querySelector('img')) continue;
      expect(link.className, `"${link.textContent?.trim()}" may not wrap`).toContain(
        'whitespace-nowrap'
      );
    }
  });

  it('switches to the horizontal nav only once there is room for it', () => {
    const { container } = renderNav();

    const desktop = container.querySelector('.hidden.lg\\:flex');
    expect(desktop, 'the desktop nav row should appear at lg, not md').toBeTruthy();
    expect(container.querySelector('.hidden.md\\:flex')).toBeNull();
  });

  it('keeps the menu button available until the horizontal nav takes over', () => {
    renderNav();

    const toggle = screen.getByRole('button', { name: /open menu/i });
    expect(toggle.parentElement?.className).toContain('lg:hidden');
  });

  it('still reaches every destination, including Companionship', () => {
    renderNav();

    for (const path of ['/', '/experts', '/companionship', '/leaderboard', '/about']) {
      expect(
        screen.getAllByRole('link').some((l) => l.getAttribute('href') === path),
        `nav must link to ${path}`
      ).toBe(true);
    }
  });

  it('keeps the account labels readable to assistive tech when they are collapsed', () => {
    renderNav();

    // Icon-only at lg, labelled from xl — the text must never be display:none.
    for (const name of [/dashboard/i, /settings/i]) {
      expect(screen.getAllByRole('link', { name }).length).toBeGreaterThan(0);
    }
  });
});
