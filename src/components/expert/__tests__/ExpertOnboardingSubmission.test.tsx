import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ExpertOnboarding } from '../ExpertOnboarding';
import { supabase } from '@/integrations/supabase/client';
import * as NotificationLib from '@/lib/notifications';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
    storage: {
      from: () => ({
        upload: vi.fn(),
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/doc.pdf' } }),
      }),
    },
  },
}));

vi.mock('@/components/Navigation', () => ({
  default: () => <nav data-testid="mock-nav">Navigation</nav>,
}));

vi.mock('@/components/sections/Footer', () => ({
  default: () => <footer data-testid="mock-footer">Footer</footer>,
}));

vi.mock('@/lib/notifications', () => ({
  sendNotificationEmail: vi.fn().mockResolvedValue(true),
  createInAppNotification: vi.fn().mockResolvedValue(true),
  notifyAdmins: vi.fn().mockResolvedValue(true),
}));

describe('ExpertOnboarding Submission & Role Preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefills existing speaker application data when available', async () => {
    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        session: {
          user: { id: 'applicant-1', email: 'applicant@irookee.com' },
        },
      },
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'categories') {
        return {
          select: () => ({
            order: async () => ({ data: [{ id: 'cat-1', name: 'Artificial Intelligence' }], error: null }),
          }),
        };
      }
      if (table === 'speakers') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: 'speaker-app-1',
                  user_id: 'applicant-1',
                  name: 'Priya Sharma',
                  title: 'AI Consultant',
                  email: 'applicant@irookee.com',
                  phone: '+919966827110',
                  location: 'Bengaluru, India',
                  languages: ['English', 'Hindi'],
                  bio: 'Extensive background in natural language processing and deep learning architectures.',
                  verification_status: 'pending',
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: 'applicant-1', user_type: 'consumer', full_name: 'Priya Sharma' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'speaker_categories') {
        return {
          select: () => ({
            eq: async () => ({ data: [{ category_id: 'cat-1' }], error: null }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    });

    render(
      <MemoryRouter>
        <ExpertOnboarding />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Priya Sharma')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+919966827110')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Extensive background in natural language processing/i)).toBeInTheDocument();
    });
  });
});
