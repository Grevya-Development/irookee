import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPassword from '../ResetPassword';

const mockUpdatePassword = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    updatePassword: mockUpdatePassword,
    signOut: mockSignOut,
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((_cb) => {
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
  },
}));

describe('ResetPassword Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders invalid/expired message when direct access has no recovery session', async () => {
    render(
      <MemoryRouter initialEntries={['/auth/reset-password']}>
        <ResetPassword />
      </MemoryRouter>
    );

    expect(await screen.findByText(/This password reset link is invalid or has expired/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Request New Reset Link/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to Login/i })).toBeInTheDocument();
  });

  it('renders reset password form when session is available', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'u1' } } as unknown as import('@supabase/supabase-js').Session },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/auth/reset-password']}>
        <ResetPassword />
      </MemoryRouter>
    );

    expect(await screen.findByLabelText(/^New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm New Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
  });

  it('validates password minimum length and mismatch', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'u1' } } as unknown as import('@supabase/supabase-js').Session },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/auth/reset-password']}>
        <ResetPassword />
      </MemoryRouter>
    );

    const newPassInput = await screen.findByLabelText(/^New Password/i);
    const confirmPassInput = screen.getByLabelText(/^Confirm New Password/i);
    const submitBtn = screen.getByRole('button', { name: /Reset Password/i });

    // Test short password
    fireEvent.change(newPassInput, { target: { value: 'short' } });
    fireEvent.change(confirmPassInput, { target: { value: 'short' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Use at least 8 characters/i)).toBeInTheDocument();

    // Test mismatch
    fireEvent.change(newPassInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPassInput, { target: { value: 'different123' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Those passwords do not match/i)).toBeInTheDocument();
  });

  it('successfully updates password, terminates recovery session, and displays login action', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'u1' } } as unknown as import('@supabase/supabase-js').Session },
      error: null,
    });
    mockUpdatePassword.mockResolvedValueOnce({ error: null });

    render(
      <MemoryRouter initialEntries={['/auth/reset-password']}>
        <ResetPassword />
      </MemoryRouter>
    );

    const newPassInput = await screen.findByLabelText(/^New Password/i);
    const confirmPassInput = screen.getByLabelText(/^Confirm New Password/i);
    const submitBtn = screen.getByRole('button', { name: /Reset Password/i });

    fireEvent.change(newPassInput, { target: { value: 'SecretPassword123!' } });
    fireEvent.change(confirmPassInput, { target: { value: 'SecretPassword123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith('SecretPassword123!');
    });

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });

    expect(await screen.findByText(/Password updated successfully/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Login/i })).toBeInTheDocument();
  });
});
