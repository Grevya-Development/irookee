import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Auth from '../Auth';
import type { User, Session } from '@supabase/supabase-js';
import * as AuthProviderModule from '@/components/AuthProvider';
import * as AuthLibModule from '@/lib/auth';

vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
  identifyUser: vi.fn(),
  resetAnalytics: vi.fn(),
}));

vi.mock('@/lib/googleAnalytics', () => ({
  setGaUser: vi.fn(),
}));

describe('Auth Page Post-Login Routing Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates an authenticated expert to /expert/dashboard when no redirect parameter is present', async () => {
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      user: { id: 'expert-123', email: 'expert@irookee.com' } as unknown as User,
      session: {} as unknown as Session,
      profile: { id: 'expert-123', user_type: 'expert' } as unknown as AuthProviderModule.Profile,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.spyOn(AuthLibModule, 'getAuthenticatedUserDestination').mockResolvedValue({
      defaultPath: '/expert/dashboard',
      isExpert: true,
      isAdmin: false,
      isSuspended: false,
      expertStatus: 'verified',
    });

    render(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/expert/dashboard" element={<div data-testid="expert-dashboard">Expert Dashboard</div>} />
          <Route path="/dashboard" element={<div data-testid="user-dashboard">User Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('expert-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('user-dashboard')).not.toBeInTheDocument();
    });
  });

  it('navigates an authenticated consumer to /dashboard when no redirect parameter is present', async () => {
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      user: { id: 'consumer-123', email: 'consumer@irookee.com' } as unknown as User,
      session: {} as unknown as Session,
      profile: { id: 'consumer-123', user_type: 'consumer' } as unknown as AuthProviderModule.Profile,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.spyOn(AuthLibModule, 'getAuthenticatedUserDestination').mockResolvedValue({
      defaultPath: '/dashboard',
      isExpert: false,
      isAdmin: false,
      isSuspended: false,
      expertStatus: null,
    });

    render(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/expert/dashboard" element={<div data-testid="expert-dashboard">Expert Dashboard</div>} />
          <Route path="/dashboard" element={<div data-testid="user-dashboard">User Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('expert-dashboard')).not.toBeInTheDocument();
    });
  });

  it('navigates to explicit safe redirect parameter if provided', async () => {
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      user: { id: 'consumer-123', email: 'consumer@irookee.com' } as unknown as User,
      session: {} as unknown as Session,
      profile: { id: 'consumer-123', user_type: 'consumer' } as unknown as AuthProviderModule.Profile,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/auth?redirect=/companionship']}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/companionship" element={<div data-testid="companionship-page">Companionship Page</div>} />
          <Route path="/dashboard" element={<div data-testid="user-dashboard">User Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('companionship-page')).toBeInTheDocument();
      expect(screen.queryByTestId('user-dashboard')).not.toBeInTheDocument();
    });
  });
});

