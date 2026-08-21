import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ExpertProfile from '../ExpertProfile';
import { useExperts } from '@/hooks/useExperts';
import { useAuth } from '@/components/AuthProvider';

vi.mock('@/hooks/useExperts', () => ({
  useExperts: vi.fn(),
}));

vi.mock('@/components/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/Navigation', () => ({
  default: () => <nav data-testid="mock-nav">Nav</nav>,
}));

vi.mock('@/components/Seo', () => ({
  default: () => null,
}));

vi.mock('@/components/gamification/ExpertStatsCard', () => ({
  default: () => <div data-testid="expert-stats">Stats</div>,
}));

vi.mock('@/components/gamification/ExpertTierBadge', () => ({
  default: () => null,
}));

vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
}));

describe('ExpertProfile Public Access, Gating & Privacy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders verified expert profile with booking enabled for public visitors', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      profile: null,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.mocked(useExperts).mockReturnValue({
      expert: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Dr. Sarah Connor',
        title: 'Cybersecurity Expert',
        bio: 'Leading cybersecurity specialist.',
        image_url: null,
        verification_status: 'verified',
        is_verified: true,
        badges: ['Top Rated'],
        rating: 4.9,
        past_events: 10,
        hourly_rate: 0,
        currency: 'INR',
        location: 'San Francisco, CA',
        languages: ['English'],
        experience_years: 12,
        company: 'Cyberdyne',
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-08-01T00:00:00Z',
        expertise: ['Threat Modeling', 'AppSec'],
        topics: ['Zero Trust'],
        linkedin_url: 'https://linkedin.com/in/sarah',
        website_url: 'https://sarah.io',
        user_id: 'user-expert-1',
      },
      experts: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/expert/11111111-1111-1111-1111-111111111111']}>
        <Routes>
          <Route path="/expert/:id" element={<ExpertProfile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dr. Sarah Connor')).toBeInTheDocument();
    expect(screen.getByText('Cybersecurity Expert')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Book Session' }).length).toBeGreaterThanOrEqual(1);
  });

  it('renders clean "Expert Profile Unavailable" state for non-verified profiles to public visitors', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      profile: null,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.mocked(useExperts).mockReturnValue({
      expert: null,
      experts: [],
      loading: false,
      error: 'Expert profile unavailable',
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/expert/pending-expert-id']}>
        <Routes>
          <Route path="/expert/:id" element={<ExpertProfile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Expert Profile Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/This expert profile is currently private, under review, or does not exist/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse Available Experts' })).toBeInTheDocument();
    expect(screen.queryByText('Book Session')).not.toBeInTheDocument();
  });

  it('allows expert owner to view own pending profile in Preview Mode with bookings disabled', async () => {
    vi.mocked(useAuth).mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'user-pending-owner', email: 'owner@example.com' } as any,
      session: null,
      loading: false,
      profile: null,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.mocked(useExperts).mockReturnValue({
      expert: {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Alex Pending',
        title: 'Cloud Architect',
        bio: 'Designing scalable architectures.',
        image_url: null,
        verification_status: 'pending',
        is_verified: false,
        badges: [],
        rating: 0,
        past_events: 0,
        hourly_rate: 0,
        currency: 'INR',
        location: 'Bengaluru, India',
        languages: ['English', 'Hindi'],
        experience_years: 5,
        company: null,
        created_at: '2026-08-15T00:00:00Z',
        updated_at: '2026-08-15T00:00:00Z',
        expertise: ['AWS', 'Kubernetes'],
        topics: [],
        linkedin_url: null,
        website_url: null,
        user_id: 'user-pending-owner',
        is_preview: true,
        is_owner_preview: true,
      },
      experts: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/expert/22222222-2222-2222-2222-222222222222']}>
        <Routes>
          <Route path="/expert/:id" element={<ExpertProfile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Alex Pending')).toBeInTheDocument();
    expect(screen.getByText(/Preview Mode — Application Status: pending/i)).toBeInTheDocument();
    expect(screen.getByText('Bookings Disabled in Preview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bookings Disabled in Preview' })).toBeDisabled();
  });

  it('allows admin to view unapproved expert profile in Admin Preview Mode with bookings disabled', async () => {
    vi.mocked(useAuth).mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'admin-user-id', email: 'admin@irookee.com' } as any,
      session: null,
      loading: false,
      profile: null,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.mocked(useExperts).mockReturnValue({
      expert: {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Jordan Changes',
        title: 'Product Strategist',
        bio: 'Product leadership.',
        image_url: null,
        verification_status: 'changes_requested',
        is_verified: false,
        badges: [],
        rating: 0,
        past_events: 0,
        hourly_rate: 0,
        currency: 'INR',
        location: 'London, UK',
        languages: ['English'],
        experience_years: 7,
        company: null,
        created_at: '2026-08-12T00:00:00Z',
        updated_at: '2026-08-12T00:00:00Z',
        expertise: ['Product Discovery'],
        topics: [],
        linkedin_url: null,
        website_url: null,
        user_id: 'user-other-person',
        is_preview: true,
        is_admin_preview: true,
      },
      experts: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/expert/33333333-3333-3333-3333-333333333333']}>
        <Routes>
          <Route path="/expert/:id" element={<ExpertProfile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Jordan Changes')).toBeInTheDocument();
    expect(screen.getByText(/Admin Preview Mode \(Status: changes_requested\)/i)).toBeInTheDocument();
    expect(screen.getByText('Bookings Disabled in Preview')).toBeInTheDocument();
  });
});
