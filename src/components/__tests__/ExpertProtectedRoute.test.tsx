import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ExpertProtectedRoute } from '../ExpertProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import * as AuthProviderModule from '../AuthProvider';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('ExpertProtectedRoute Component & Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users to /auth?redirect=/expert/dashboard', async () => {
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      profile: null,
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
      <MemoryRouter initialEntries={['/expert/dashboard']}>
        <Routes>
          <Route
            path="/expert/dashboard"
            element={
              <ExpertProtectedRoute>
                <div data-testid="expert-secret-content">Expert Dashboard Content</div>
              </ExpertProtectedRoute>
            }
          />
          <Route path="/auth" element={<div data-testid="auth-page">Auth Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
      expect(screen.queryByTestId('expert-secret-content')).not.toBeInTheDocument();
    });
  });

  it('blocks consumer users from accessing expert dashboard and displays portal notice', async () => {
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      user: { id: 'consumer-user-123', email: 'consumer@example.com' } as unknown as User,
      session: {} as unknown as Session,
      profile: { id: 'consumer-user-123', user_type: 'consumer' } as unknown as AuthProviderModule.Profile,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      refreshProfile: vi.fn(),
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    });

    render(
      <MemoryRouter initialEntries={['/expert/dashboard']}>
        <Routes>
          <Route
            path="/expert/dashboard"
            element={
              <ExpertProtectedRoute>
                <div data-testid="expert-secret-content">Expert Dashboard Content</div>
              </ExpertProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Expert Portal Access/i)).toBeInTheDocument();
      expect(screen.getByText(/You are logged in with a consumer account/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Become an Expert/i })).toBeInTheDocument();
      expect(screen.queryByTestId('expert-secret-content')).not.toBeInTheDocument();
    });
  });

  it('allows authorized experts to access the dashboard and renders children', async () => {
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      user: { id: 'expert-user-456', email: 'expert@example.com' } as unknown as User,
      session: {} as unknown as Session,
      profile: { id: 'expert-user-456', user_type: 'expert' } as unknown as AuthProviderModule.Profile,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      refreshProfile: vi.fn(),
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { id: 'speaker-456', verification_status: 'verified' },
            error: null,
          }),
        }),
      }),
    });

    render(
      <MemoryRouter initialEntries={['/expert/dashboard']}>
        <Routes>
          <Route
            path="/expert/dashboard"
            element={
              <ExpertProtectedRoute>
                <div data-testid="expert-secret-content">Expert Dashboard Content</div>
              </ExpertProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('expert-secret-content')).toBeInTheDocument();
    });
  });
});

