import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ExpertProfile from '../ExpertProfile';
import ExpertCard from '@/components/ExpertCard';
import { useExperts } from '@/hooks/useExperts';
import { useAuth } from '@/components/AuthProvider';
import type { ExpertProfile as PromptExpertProfile } from '@/types/promptpeople';

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

describe('Badge Rendering & Verification Separation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
  });

  it('renders verified checkmark AND trust badges on ExpertProfile when both are present', () => {
    vi.mocked(useExperts).mockReturnValue({
      expert: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Dr. Evelyn Reed',
        title: 'Quantum Computing Lead',
        bio: 'Quantum scientist.',
        image_url: null,
        verification_status: 'verified',
        is_verified: true,
        badges: ['Top Rated', 'Trusted Expert', 'Industry Veteran'],
        rating: 4.9,
        past_events: 20,
        hourly_rate: 0,
        currency: 'INR',
        location: 'Boston, MA',
        languages: ['English'],
        experience_years: 15,
        company: 'Quantum Lab',
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-08-01T00:00:00Z',
        expertise: ['Quantum Algorithms'],
        topics: [],
        linkedin_url: null,
        website_url: null,
        user_id: 'user-1',
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

    // Verified checkmark
    expect(screen.getByText('Verified')).toBeInTheDocument();

    // Trust badges
    expect(screen.getByText('Top Rated')).toBeInTheDocument();
    expect(screen.getByText('Trusted Expert')).toBeInTheDocument();
    expect(screen.getByText('Industry Veteran')).toBeInTheDocument();
  });

  it('renders verified checkmark with NO badge pills when badges is empty/null', () => {
    vi.mocked(useExperts).mockReturnValue({
      expert: {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Carlos Mendez',
        title: 'Backend Engineer',
        bio: 'Distributed systems engineer.',
        image_url: null,
        verification_status: 'verified',
        is_verified: true,
        badges: [],
        rating: 4.8,
        past_events: 12,
        hourly_rate: 0,
        currency: 'INR',
        location: 'Madrid, Spain',
        languages: ['Spanish', 'English'],
        experience_years: 8,
        company: null,
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-08-01T00:00:00Z',
        expertise: ['PostgreSQL', 'Go'],
        topics: [],
        linkedin_url: null,
        website_url: null,
        user_id: 'user-2',
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

    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.queryByText('Top Rated')).not.toBeInTheDocument();
  });

  it('renders badges with NO verified checkmark when is_verified is false on an approved expert', () => {
    vi.mocked(useExperts).mockReturnValue({
      expert: {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Amina Khan',
        title: 'Fintech Product Lead',
        bio: 'Payments specialist.',
        image_url: null,
        verification_status: 'verified',
        is_verified: false,
        badges: ['Rising Star'],
        rating: 4.7,
        past_events: 8,
        hourly_rate: 0,
        currency: 'INR',
        location: 'Dubai, UAE',
        languages: ['English', 'Arabic'],
        experience_years: 6,
        company: null,
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-08-01T00:00:00Z',
        expertise: ['Fintech'],
        topics: [],
        linkedin_url: null,
        website_url: null,
        user_id: 'user-3',
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

    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
    expect(screen.getByText('Rising Star')).toBeInTheDocument();
    expect(screen.getByText('Amina Khan')).toBeInTheDocument();
  });

  it('renders ExpertCard with verified checkmark and trust badge pills', () => {
    const mockCardExpert: PromptExpertProfile = {
      id: '44444444-4444-4444-4444-444444444444',
      user_id: 'user-4',
      full_name: 'Devon Lee',
      title: 'DevOps Architect',
      bio: 'Kubernetes and CI/CD expert.',
      industry_expertise: ['DevOps', 'Kubernetes'],
      years_experience: 10,
      location: 'Austin, TX',
      languages: ['English'],
      hourly_rate: 0,
      status: 'approved',
      verification_level: 'basic',
      is_verified: true,
      badges: ['Trusted Guide', 'Top Rated', 'Irookee Verified Expert'],
      rating: 4.9,
      total_sessions: 30,
      intro_video_url: null,
      kyc_documents: null,
      availability_timezone: null,
      is_instant_available: true,
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
    };

    render(
      <MemoryRouter>
        <ExpertCard expert={mockCardExpert} />
      </MemoryRouter>
    );

    expect(screen.getByText('Devon Lee')).toBeInTheDocument();
    expect(screen.getByTitle('Verified Expert')).toBeInTheDocument();
    expect(screen.getByText('Trusted Guide')).toBeInTheDocument();
    expect(screen.getByText('Top Rated')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument(); // overflow badge count
  });

  it('renders ExpertCard safely with null or undefined badges without crashing', () => {
    const mockCardExpertNullBadges: PromptExpertProfile = {
      id: '55555555-5555-5555-5555-555555555555',
      user_id: 'user-5',
      full_name: 'Sam NullBadge',
      title: 'Mobile Developer',
      bio: 'iOS and Android developer.',
      industry_expertise: ['Flutter', 'Swift'],
      years_experience: 4,
      location: 'Toronto, Canada',
      languages: ['English'],
      hourly_rate: 0,
      status: 'approved',
      verification_level: 'basic',
      is_verified: false,
      badges: null,
      rating: 4.6,
      total_sessions: 2,
      intro_video_url: null,
      kyc_documents: null,
      availability_timezone: null,
      is_instant_available: true,
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
    };

    render(
      <MemoryRouter>
        <ExpertCard expert={mockCardExpertNullBadges} />
      </MemoryRouter>
    );

    expect(screen.getByText('Sam NullBadge')).toBeInTheDocument();
    expect(screen.queryByTitle('Verified Expert')).not.toBeInTheDocument();
  });
});
