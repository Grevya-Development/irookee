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
      signInWithPassword: vi.fn(),
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

describe('Settings Profile & Security Change Password Integration', () => {
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

  it('displays clearly visible Change Password option inside Profile Settings and opens modal', async () => {
    setupSettingsAuth('consumer');

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    );

    // Profile Settings tab is default
    const changePasswordBtn = await screen.findByRole('button', { name: /Change Password/i });
    expect(changePasswordBtn).toBeInTheDocument();

    // Click to open modal
    fireEvent.click(changePasswordBtn);

    // Modal elements
    expect(await screen.findByRole('heading', { name: /Change Password/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Current Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm New Password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('exposes Change Password from the Security tab as well', async () => {
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

    const changePasswordBtn = await screen.findByRole('button', { name: /Change Password/i });
    fireEvent.click(changePasswordBtn);

    expect(await screen.findByRole('heading', { name: /Change Password/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Current Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm New Password$/i)).toBeInTheDocument();
  });

  it('toggles password visibility with show/hide icons for all three fields', async () => {
    setupSettingsAuth('consumer');

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: /Change Password/i }));

    const currentInput = await screen.findByLabelText(/^Current Password$/i);
    const newInput = screen.getByLabelText(/^New Password$/i);
    const confirmInput = screen.getByLabelText(/^Confirm New Password$/i);

    expect(currentInput).toHaveAttribute('type', 'password');
    expect(newInput).toHaveAttribute('type', 'password');
    expect(confirmInput).toHaveAttribute('type', 'password');

    // Toggle current password
    const toggleCurrentBtn = screen.getByLabelText(/Show current password/i);
    fireEvent.click(toggleCurrentBtn);
    expect(currentInput).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByLabelText(/Hide current password/i));
    expect(currentInput).toHaveAttribute('type', 'password');

    // Toggle new password
    const toggleNewBtn = screen.getByLabelText(/Show new password/i);
    fireEvent.click(toggleNewBtn);
    expect(newInput).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByLabelText(/Hide new password/i));
    expect(newInput).toHaveAttribute('type', 'password');

    // Toggle confirm password
    const toggleConfirmBtn = screen.getByLabelText(/Show confirm password/i);
    fireEvent.click(toggleConfirmBtn);
    expect(confirmInput).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByLabelText(/Hide confirm password/i));
    expect(confirmInput).toHaveAttribute('type', 'password');
  });

  it('validates all fields: empty current password, empty new password, length < 8, mismatch, and same password', async () => {
    setupSettingsAuth('consumer');

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: /Change Password/i }));
    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    const currentInput = screen.getByLabelText(/^Current Password$/i);
    const newInput = screen.getByLabelText(/^New Password$/i);
    const confirmInput = screen.getByLabelText(/^Confirm New Password$/i);

    // 1. Empty current password
    fireEvent.click(saveBtn);
    expect(await screen.findByText(/Please enter your current password/i)).toBeInTheDocument();
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();

    // 2. Empty new password
    fireEvent.change(currentInput, { target: { value: 'OldPassword123' } });
    fireEvent.click(saveBtn);
    expect(await screen.findByText(/Please enter a new password/i)).toBeInTheDocument();

    // 3. New password shorter than 8 characters
    fireEvent.change(newInput, { target: { value: 'short' } });
    fireEvent.change(confirmInput, { target: { value: 'short' } });
    fireEvent.click(saveBtn);
    expect(await screen.findByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();

    // 4. Passwords do not match
    fireEvent.change(newInput, { target: { value: 'ValidPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPass123!' } });
    fireEvent.click(saveBtn);
    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();

    // 5. New password identical to current password
    fireEvent.change(newInput, { target: { value: 'OldPassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'OldPassword123' } });
    fireEvent.click(saveBtn);
    expect(await screen.findByText(/New password must be different from your current password/i)).toBeInTheDocument();

    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('securely rejects submission if current password verification fails in Supabase', async () => {
    setupSettingsAuth('consumer');
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('Invalid login credentials') as never,
    });

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: /Change Password/i }));

    fireEvent.change(screen.getByLabelText(/^Current Password$/i), { target: { value: 'WrongOldPassword123' } });
    fireEvent.change(screen.getByLabelText(/^New Password$/i), { target: { value: 'BrandNewPassword123!' } });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), { target: { value: 'BrandNewPassword123!' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'consumer@irookee.com',
        password: 'WrongOldPassword123',
      });
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });

    expect(await screen.findByText(/Current password is incorrect\. Please try again\./i)).toBeInTheDocument();
  });

  it('securely verifies current password and updates password on valid submission', async () => {
    setupSettingsAuth('consumer');
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: 'user-consumer-1' }, session: {} },
      error: null,
    } as never);
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: { id: 'user-consumer-1' } },
      error: null,
    } as never);

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: /Change Password/i }));

    const currentInput = screen.getByLabelText(/^Current Password$/i);
    const newInput = screen.getByLabelText(/^New Password$/i);
    const confirmInput = screen.getByLabelText(/^Confirm New Password$/i);

    fireEvent.change(currentInput, { target: { value: 'CorrectOldPassword123' } });
    fireEvent.change(newInput, { target: { value: 'BrandNewSecurePass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'BrandNewSecurePass123!' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'consumer@irookee.com',
        password: 'CorrectOldPassword123',
      });
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'BrandNewSecurePass123!',
      });
      expect(screen.getByText(/Password changed successfully\./i)).toBeInTheDocument();
    });
  });

  it('closes modal when Cancel button is clicked', async () => {
    setupSettingsAuth('consumer');

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: /Change Password/i }));
    expect(await screen.findByRole('heading', { name: /Change Password/i, level: 2 })).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Change Password/i, level: 2 })).not.toBeInTheDocument();
    });
  });

  it('preserves expert and admin account functionality when changing password', async () => {
    setupSettingsAuth('expert');
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: 'user-expert-1' }, session: {} },
      error: null,
    } as never);
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: { id: 'user-expert-1' } },
      error: null,
    } as never);

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: /Change Password/i }));

    fireEvent.change(screen.getByLabelText(/^Current Password$/i), { target: { value: 'ExpertOldPass123' } });
    fireEvent.change(screen.getByLabelText(/^New Password$/i), { target: { value: 'ExpertNewPass123!' } });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), { target: { value: 'ExpertNewPass123!' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'expert@irookee.com',
        password: 'ExpertOldPass123',
      });
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'ExpertNewPass123!',
      });
      expect(screen.getByText(/Password changed successfully\./i)).toBeInTheDocument();
    });
  });
});
