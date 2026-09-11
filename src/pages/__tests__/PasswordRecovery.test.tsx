import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ResetPassword from '../ResetPassword';
import Auth from '../Auth';
import * as AuthProviderModule from '@/components/AuthProvider';
import * as AuthLibModule from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

vi.mock('@/components/Navigation', () => ({
  default: () => <nav data-testid="mock-nav">Nav</nav>,
}));

vi.mock('@/components/sections/Footer', () => ({
  default: () => <footer data-testid="mock-footer">Footer</footer>,
}));

vi.mock('@/components/Seo', () => ({
  default: () => null,
}));

vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
  trackPageview: vi.fn(),
  identifyUser: vi.fn(),
  resetAnalytics: vi.fn(),
}));

vi.mock('@/lib/googleAnalytics', () => ({
  setGaUser: vi.fn(),
  trackGaPageview: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
    })),
  },
}));

describe('Password Recovery and Reset Flow Integration', () => {
  const mockUpdatePassword = vi.fn();
  const mockClearPasswordRecovery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupAuthMock = (overrides: Partial<AuthProviderModule.AuthContextType> = {}) => {
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      user: { id: 'user-rec-123', email: 'user@example.com' } as unknown as User,
      session: { user: { id: 'user-rec-123' } } as unknown as Session,
      profile: { id: 'user-rec-123', user_type: 'consumer' } as unknown as AuthProviderModule.Profile,
      loading: false,
      isPasswordRecovery: false,
      recoveryError: null,
      clearPasswordRecovery: mockClearPasswordRecovery,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: mockUpdatePassword,
      refreshProfile: vi.fn(),
      ...overrides,
    });
  };

  it('rejects an unauthenticated direct visit or normal login session without recovery state', async () => {
    setupAuthMock({ isPasswordRecovery: false, recoveryError: null });

    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>
    );

    // After the grace timer expires without a recovery event, show invalid/expired message
    await waitFor(() => {
      expect(screen.getByText(/This reset link is invalid or has expired/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Request a new link/i })).toBeInTheDocument();
    }, { timeout: 2500 });
  });

  it('detects a recovery session and renders the new password form', async () => {
    setupAuthMock({ isPasswordRecovery: true, recoveryError: null });

    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/^New password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm new password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update password/i })).toBeInTheDocument();
  });

  it('validates password requirements (empty, length < 8, mismatch)', async () => {
    setupAuthMock({ isPasswordRecovery: true });

    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Update password/i });

    // 1. Empty password
    fireEvent.click(submitBtn);
    expect(await screen.findByText(/Please enter a new password/i)).toBeInTheDocument();
    expect(mockUpdatePassword).not.toHaveBeenCalled();

    // 2. Shorter than 8 characters
    const newPassInput = screen.getByLabelText(/^New password$/i);
    const confirmInput = screen.getByLabelText(/^Confirm new password$/i);

    fireEvent.change(newPassInput, { target: { value: 'short' } });
    fireEvent.change(confirmInput, { target: { value: 'short' } });
    fireEvent.click(submitBtn);
    expect(await screen.findByText(/Use at least 8 characters for your new password/i)).toBeInTheDocument();
    expect(mockUpdatePassword).not.toHaveBeenCalled();

    // 3. Mismatched passwords
    fireEvent.change(newPassInput, { target: { value: 'ValidPassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPassword123' } });
    fireEvent.click(submitBtn);
    expect(await screen.findByText(/Those passwords do not match/i)).toBeInTheDocument();
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it('successfully updates password and redirects to destination', async () => {
    setupAuthMock({ isPasswordRecovery: true });
    mockUpdatePassword.mockResolvedValue({ error: null });

    vi.spyOn(AuthLibModule, 'getAuthenticatedUserDestination').mockResolvedValue({
      defaultPath: '/dashboard',
      isExpert: false,
      isAdmin: false,
      isSuspended: false,
      expertStatus: null,
    });

    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<div data-testid="dashboard-dest">Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    const newPassInput = screen.getByLabelText(/^New password$/i);
    const confirmInput = screen.getByLabelText(/^Confirm new password$/i);
    const submitBtn = screen.getByRole('button', { name: /Update password/i });

    fireEvent.change(newPassInput, { target: { value: 'SuperSecret123!' } });
    fireEvent.change(confirmInput, { target: { value: 'SuperSecret123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith('SuperSecret123!');
      expect(mockClearPasswordRecovery).toHaveBeenCalled();
      expect(screen.getByText(/Password updated/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-dest')).toBeInTheDocument();
    }, { timeout: 2500 });
  });

  it('displays Supabase update error when update fails', async () => {
    setupAuthMock({ isPasswordRecovery: true });
    mockUpdatePassword.mockResolvedValue({ error: new Error('Password is too weak or expired session') });

    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>
    );

    const newPassInput = screen.getByLabelText(/^New password$/i);
    const confirmInput = screen.getByLabelText(/^Confirm new password$/i);
    const submitBtn = screen.getByRole('button', { name: /Update password/i });

    fireEvent.change(newPassInput, { target: { value: 'WeakPass123' } });
    fireEvent.change(confirmInput, { target: { value: 'WeakPass123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith('WeakPass123');
      expect(screen.getByText(/Password is too weak or expired session/i)).toBeInTheDocument();
    });
  });

  it('displays clear error and link when recovery link has expired or is invalid', async () => {
    setupAuthMock({ isPasswordRecovery: false, recoveryError: 'Email link is invalid or has expired' });

    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Email link is invalid or has expired/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Request a new link/i })).toHaveAttribute('href', '/auth?mode=forgot');
  });

  it('routes to /reset-password from Auth page when recovery session is active instead of dashboard', async () => {
    setupAuthMock({
      isPasswordRecovery: true,
      user: { id: 'expert-123', email: 'expert@example.com' } as unknown as User,
    });

    render(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<div data-testid="reset-password-page">Reset Password Page</div>} />
          <Route path="/expert/dashboard" element={<div data-testid="expert-dashboard">Expert Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-page')).toBeInTheDocument();
      expect(screen.queryByTestId('expert-dashboard')).not.toBeInTheDocument();
    });
  });
});
