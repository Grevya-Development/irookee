import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ExpertDashboard } from '../ExpertDashboard';
import { supabase } from '@/integrations/supabase/client';
import * as UseAuthModule from '@/hooks/useAuth';
import type { Profile } from '@/components/AuthProvider';
import type { User, Session } from '@supabase/supabase-js';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/components/Navigation', () => ({
  default: () => <nav data-testid="mock-nav">Navigation</nav>,
}));

vi.mock('@/components/sections/Footer', () => ({
  default: () => <footer data-testid="mock-footer">Footer</footer>,
}));

describe('ExpertDashboard Multi-State Rendering & Status Separation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Application Pending Review" screen with summary and roadmap for pending applicants', async () => {
    vi.spyOn(UseAuthModule, 'useAuth').mockReturnValue({
      user: { id: 'user-pending-1', email: 'applicant@irookee.com' } as unknown as User,
      session: {} as unknown as Session,
      profile: { id: 'user-pending-1', user_type: 'consumer' } as unknown as Profile,

      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      refreshProfile: vi.fn(),
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'speakers') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: 'speaker-pending-1',
                  user_id: 'user-pending-1',
                  name: 'Priya Sharma',
                  title: 'AI Architect',
                  experience_years: 8,
                  location: 'Bengaluru, India',
                  bio: 'Expert in LLM architectures and production AI pipelines.',
                  verification_status: 'pending',
                  is_verified: false,
                },
                error: null,
              }),
              single: async () => ({ data: { rating: 5 }, error: null }),
            }),
          }),
        };
      }
      if (table === 'expertise_bookings') {
        return {
          select: () => ({
            eq: async () => ({ data: [], error: null }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    });

    render(
      <MemoryRouter>
        <ExpertDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Your Expert Application is Under Review/i)).toBeInTheDocument();
      expect(screen.getByText(/Application Pending Review/i)).toBeInTheDocument();
      expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
      expect(screen.getByText(/AI Architect/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Edit \/ Update Application/i })).toBeInTheDocument();
      // Ensure full restricted tabs/tools are not mounted
      expect(screen.queryByText(/Upcoming Sessions/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Manage Availability/i)).not.toBeInTheDocument();
    });
  });

  it('renders "Changes Requested" screen with admin feedback note for changes_requested status', async () => {
    vi.spyOn(UseAuthModule, 'useAuth').mockReturnValue({
      user: { id: 'user-cr-1', email: 'applicant-cr@irookee.com' } as unknown as User,
      session: {} as unknown as Session,
      profile: { id: 'user-cr-1', user_type: 'consumer' } as unknown as Profile,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      refreshProfile: vi.fn(),
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'speakers') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: 'speaker-cr-1',
                  user_id: 'user-cr-1',
                  name: 'Priya Sharma',
                  title: 'AI Architect',
                  verification_status: 'changes_requested',
                  suspension_reason: 'Please upload a clearer copy of your government photo ID and degree certificate.',
                  is_verified: false,
                },
                error: null,
              }),
              single: async () => ({ data: { rating: 5 }, error: null }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    });

    render(
      <MemoryRouter>
        <ExpertDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Application Updates Required/i)).toBeInTheDocument();
      expect(screen.getByText(/Please upload a clearer copy of your government photo ID/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Update & Resubmit Application/i })).toBeInTheDocument();
    });
  });

  it('renders "Suspended" notice and blocks tools when expert is suspended', async () => {
    vi.spyOn(UseAuthModule, 'useAuth').mockReturnValue({
      user: { id: 'user-susp-1', email: 'suspended@irookee.com' } as unknown as User,
      session: {} as unknown as Session,
      profile: { id: 'user-susp-1', user_type: 'consumer' } as unknown as Profile,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      refreshProfile: vi.fn(),
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'speakers') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: 'speaker-susp-1',
                  user_id: 'user-susp-1',
                  name: 'Suspended Expert',
                  verification_status: 'suspended',
                  suspension_reason: 'Violated terms of service.',
                  is_verified: false,
                },
                error: null,
              }),
              single: async () => ({ data: { rating: 5 }, error: null }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    });

    render(
      <MemoryRouter>
        <ExpertDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Your expert profile is suspended/i)).toBeInTheDocument();
      expect(screen.getByText(/Violated terms of service./i)).toBeInTheDocument();
      expect(screen.queryByText(/Upcoming Sessions/i)).not.toBeInTheDocument();
    });
  });

  it('renders full expert dashboard with session tabs for verified/approved experts', async () => {
    vi.spyOn(UseAuthModule, 'useAuth').mockReturnValue({
      user: { id: 'user-approved-1', email: 'expert@irookee.com' } as unknown as User,
      session: {} as unknown as Session,
      profile: { id: 'user-approved-1', user_type: 'expert' } as unknown as Profile,

      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      refreshProfile: vi.fn(),
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'speakers') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: 'speaker-approved-1',
                  user_id: 'user-approved-1',
                  name: 'Verified Expert',
                  title: 'Principal Consultant',
                  verification_status: 'verified',
                  is_verified: true,
                  badges: ['Top Rated'],
                },
                error: null,
              }),
              single: async () => ({ data: { rating: 4.9 }, error: null }),
            }),
          }),
        };
      }
      if (table === 'expertise_bookings') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: [], error: null }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    });

    render(
      <MemoryRouter>
        <ExpertDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Back to Dashboard/i)).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Bookings/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Availability/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Stats & Badges/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Profile/i })).toBeInTheDocument();
    });
  });
});


