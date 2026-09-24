import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ResetPassword from '../ResetPassword';
import Auth from '../Auth';
import AuthForms from '@/components/auth/AuthForms';
import { getSiteUrl } from '@/lib/siteUrl';
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
  const mockRequestPasswordReset = vi.fn();
  let useAuthSpy: ReturnType<typeof vi.spyOn> | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    if (useAuthSpy) {
      useAuthSpy.mockRestore();
      useAuthSpy = undefined;
    }
  });

  const setupAuthMock = (overrides: Partial<AuthProviderModule.AuthContextType> = {}) => {
    if (useAuthSpy) {
      useAuthSpy.mockRestore();
    }
    useAuthSpy = vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
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
      requestPasswordReset: mockRequestPasswordReset,
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

  describe('Resend Reset Link Flow', () => {
    it('calls requestPasswordReset with trimmed email and correct redirectTo from AuthForms', async () => {
      mockRequestPasswordReset.mockResolvedValue({ error: null });
      setupAuthMock({ requestPasswordReset: mockRequestPasswordReset });

      render(
        <MemoryRouter initialEntries={['/auth?mode=forgot']}>
          <AuthForms mode="forgot" onModeChange={vi.fn()} redirectTo="/dashboard" />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: '  user.test@example.com  ' } });

      const resendBtn = screen.getByRole('button', { name: /Resend Reset Link/i });
      fireEvent.click(resendBtn);

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledTimes(1);
        expect(mockRequestPasswordReset).toHaveBeenCalledWith('user.test@example.com');
      });

      expect(await screen.findByText(/If an account exists for this email, a password reset link has been sent/i)).toBeInTheDocument();
    });

    it('displays success state when resend reset link succeeds on confirmation view', async () => {
      mockRequestPasswordReset.mockResolvedValue({ error: null });
      setupAuthMock({ requestPasswordReset: mockRequestPasswordReset });

      render(
        <MemoryRouter initialEntries={['/auth?mode=forgot']}>
          <AuthForms mode="forgot" onModeChange={vi.fn()} redirectTo="/dashboard" />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      // First submit to reach confirmation screen
      fireEvent.click(screen.getByRole('button', { name: /^Send Reset Link$/i }));

      expect(await screen.findByText(/Check your email/i)).toBeInTheDocument();

      // Now click Resend Reset Link on confirmation screen
      const resendBtn = screen.getByRole('button', { name: /Resend Reset Link/i });
      fireEvent.click(resendBtn);

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith('john@example.com');
      });
      expect(await screen.findByText(/If an account exists for this email, a password reset link has been sent/i)).toBeInTheDocument();
    });

    it('displays Supabase error and does not show success when resend fails', async () => {
      mockRequestPasswordReset.mockResolvedValue({
        error: new Error('Too many requests. Please wait a few moments before trying again.'),
      });
      setupAuthMock({ requestPasswordReset: mockRequestPasswordReset });

      render(
        <MemoryRouter initialEntries={['/auth?mode=forgot']}>
          <AuthForms mode="forgot" onModeChange={vi.fn()} redirectTo="/dashboard" />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'rate.limit@example.com' } });

      const resendBtn = screen.getByRole('button', { name: /Resend Reset Link/i });
      fireEvent.click(resendBtn);

      expect(await screen.findByText(/Too many requests\. Please wait a few moments before trying again\./i)).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('rejects empty or invalid email without calling requestPasswordReset', async () => {
      setupAuthMock({ requestPasswordReset: mockRequestPasswordReset });

      render(
        <MemoryRouter initialEntries={['/auth?mode=forgot']}>
          <AuthForms mode="forgot" onModeChange={vi.fn()} redirectTo="/dashboard" />
        </MemoryRouter>
      );

      const resendBtn = screen.getByRole('button', { name: /Resend Reset Link/i });
      fireEvent.click(resendBtn);

      expect(await screen.findByText(/Please enter your email address/i)).toBeInTheDocument();
      expect(mockRequestPasswordReset).not.toHaveBeenCalled();

      // Invalid format
      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(resendBtn);

      expect(await screen.findByText(/Please enter a valid email address/i)).toBeInTheDocument();
      expect(mockRequestPasswordReset).not.toHaveBeenCalled();
    });

    it('prevents duplicate requests when double-clicking resend button while in progress', async () => {
      let resolvePromise: (val: { error: null }) => void;
      const slowPromise = new Promise<{ error: null }>((resolve) => {
        resolvePromise = resolve;
      });
      mockRequestPasswordReset.mockReturnValue(slowPromise);
      setupAuthMock({ requestPasswordReset: mockRequestPasswordReset });

      render(
        <MemoryRouter initialEntries={['/auth?mode=forgot']}>
          <AuthForms mode="forgot" onModeChange={vi.fn()} redirectTo="/dashboard" />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'spam.check@example.com' } });

      const resendBtn = screen.getByRole('button', { name: /Resend Reset Link/i });
      fireEvent.click(resendBtn);
      fireEvent.click(resendBtn);
      fireEvent.click(resendBtn);

      expect(mockRequestPasswordReset).toHaveBeenCalledTimes(1);

      resolvePromise!({ error: null });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Resend Reset Link/i })).not.toBeDisabled();
      });
    });

    it('allows resending reset link directly from the expired recovery screen', async () => {
      mockRequestPasswordReset.mockResolvedValue({ error: null });
      setupAuthMock({ isPasswordRecovery: false, recoveryError: 'Link expired', requestPasswordReset: mockRequestPasswordReset });

      render(
        <MemoryRouter initialEntries={['/reset-password']}>
          <Routes>
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/Link expired/i)).toBeInTheDocument();

      const emailInput = screen.getByLabelText(/^Email address$/i);
      fireEvent.change(emailInput, { target: { value: 'expired.user@example.com' } });

      const resendBtn = screen.getByRole('button', { name: /Resend Reset Link/i });
      fireEvent.click(resendBtn);

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith('expired.user@example.com');
      });

      expect(await screen.findByText(/If an account exists for this email, a password reset link has been sent/i)).toBeInTheDocument();
    });

    it('verifies AuthProvider requestPasswordReset passes correct redirectTo and trimmed email to supabase', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ data: {}, error: null } as never);

      let authContextVal: AuthProviderModule.AuthContextType | undefined;
      const TestConsumer = () => {
        authContextVal = AuthProviderModule.useAuth();
        return null;
      };

      render(
        <AuthProviderModule.AuthProvider>
          <TestConsumer />
        </AuthProviderModule.AuthProvider>
      );

      await waitFor(() => expect(authContextVal).toBeDefined());

      const res = await authContextVal!.requestPasswordReset('  test.real@example.com  ');
      expect(res.error).toBeNull();
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test.real@example.com', {
        redirectTo: `${getSiteUrl()}/reset-password`,
      });
    });
  });
});
