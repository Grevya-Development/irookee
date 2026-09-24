import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Settings from '../Settings';
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
      updateUser: vi.fn(),
      signOut: vi.fn(),
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
      upsert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/photo.jpg' } }),
      })),
    },
    rpc: vi.fn().mockResolvedValue({ error: null }),
  },
}));

describe('Settings Logged-In Change Password Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupSettingsAuth = (userType: 'consumer' | 'expert' | 'admin' = 'consumer') => {
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      user: { id: `user-${userType}-1`, email: `${userType}@irookee.com` } as unknown as User,
      session: { user: { id: `user-${userType}-1` } } as unknown as Session,
      profile: { id: `user-${userType}-1`, user_type: userType } as unknown as AuthProviderModule.Profile,
      loading: false,
      isPasswordRecovery: false,
      recoveryError: null,
      clearPasswordRecovery: vi.fn(),
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.spyOn(AuthLibModule, 'isCurrentUserAdmin').mockResolvedValue(userType === 'admin');
  };

  it('exposes the Security tab and Change Password form to authenticated users', async () => {
    setupSettingsAuth('consumer');

    render(
      <MemoryRouter initialEntries={['/settings?tab=security']}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    );

    const securityTab = await screen.findByRole('tab', { name: /Security/i });
    expect(securityTab).toBeInTheDocument();

    fireEvent.pointerDown(securityTab);
    fireEvent.click(securityTab);

    expect(await screen.findByRole('heading', { name: /Change Password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^New Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm New Password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update Password/i })).toBeInTheDocument();
  });

  it('validates password requirements in Settings (empty, length < 8, mismatch)', async () => {
    setupSettingsAuth('consumer');

    render(
      <MemoryRouter initialEntries={['/settings?tab=security']}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    );

    const securityTab = await screen.findByRole('tab', { name: /Security/i });
    fireEvent.pointerDown(securityTab);
    fireEvent.click(securityTab);

    const updateBtn = screen.getByRole('button', { name: /Update Password/i });

    // 1. Empty password
    fireEvent.click(updateBtn);
    expect(await screen.findByText(/Please enter a new password/i)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();

    // 2. Shorter than 8 characters
    const newPassInput = screen.getByLabelText(/^New Password$/i);
    const confirmInput = screen.getByLabelText(/^Confirm New Password$/i);

    fireEvent.change(newPassInput, { target: { value: '12345' } });
    fireEvent.change(confirmInput, { target: { value: '12345' } });
    fireEvent.click(updateBtn);
    expect(await screen.findByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();

    // 3. Mismatch
    fireEvent.change(newPassInput, { target: { value: 'NewSecurePass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPass123!' } });
    fireEvent.click(updateBtn);
    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('successfully changes password via supabase.auth.updateUser for authenticated consumer', async () => {
    setupSettingsAuth('consumer');
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({ data: { user: null }, error: null } as never);

    render(
      <MemoryRouter initialEntries={['/settings?tab=security']}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    );

    const securityTab = await screen.findByRole('tab', { name: /Security/i });
    fireEvent.pointerDown(securityTab);
    fireEvent.click(securityTab);

    const newPassInput = screen.getByLabelText(/^New Password$/i);
    const confirmInput = screen.getByLabelText(/^Confirm New Password$/i);
    const updateBtn = screen.getByRole('button', { name: /Update Password/i });

    fireEvent.change(newPassInput, { target: { value: 'BrandNewSecurePass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'BrandNewSecurePass123!' } });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'BrandNewSecurePass123!' });
      expect(screen.getByText(/Password changed successfully/i)).toBeInTheDocument();
      expect(newPassInput).toHaveValue('');
      expect(confirmInput).toHaveValue('');
    });
  });

  it('works for expert and admin accounts without altering their roles', async () => {
    setupSettingsAuth('expert');
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({ data: { user: null }, error: null } as never);

    render(
      <MemoryRouter initialEntries={['/settings?tab=security']}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    );

    const securityTab = await screen.findByRole('tab', { name: /Security/i });
    fireEvent.pointerDown(securityTab);
    fireEvent.click(securityTab);

    const newPassInput = screen.getByLabelText(/^New Password$/i);
    const confirmInput = screen.getByLabelText(/^Confirm New Password$/i);
    const updateBtn = screen.getByRole('button', { name: /Update Password/i });

    fireEvent.change(newPassInput, { target: { value: 'ExpertSecurePass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'ExpertSecurePass123!' } });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'ExpertSecurePass123!' });
      expect(screen.getByText(/Password changed successfully/i)).toBeInTheDocument();
    });
  });
});
