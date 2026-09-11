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

  it('blocks step 1 progression when phone number is invalid (e.g. 6-digit number)', async () => {
    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        session: {
          user: { id: 'applicant-new', email: 'new@example.com' },
        },
      },
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'categories') {
        return {
          select: () => ({
            order: async () => ({ data: [{ id: 'cat-1', name: 'Tech' }], error: null }),
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

    const nameInput = screen.getByLabelText(/Full Name \*/i);
    const emailInput = screen.getByLabelText(/Email \*/i);
    const phoneInput = screen.getByLabelText(/Phone \*/i);
    const bioInput = screen.getByLabelText(/Tell us about yourself \*/i);

    await userEvent.type(nameInput, 'Rajesh Kumar');
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'rajesh@example.com');
    await userEvent.type(phoneInput, '123456'); // Invalid 6-digit number
    await userEvent.type(bioInput, 'This is a long valid bio about building software and scalable cloud systems for users.');

    const nextBtn = screen.getByRole('button', { name: /Next/i });
    expect(nextBtn).toBeDisabled();
  });

  it('submits an application with predefined profession setting custom_profession to null and preserving consumer user_type', async () => {
    let capturedSpeakerPayload: Record<string, unknown> | null = null;
    let capturedProfilePayload: Record<string, unknown> | null = null;

    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        session: {
          user: { id: 'applicant-pred', email: 'pred@example.com' },
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
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
          insert: (payload: Record<string, unknown>) => {
            capturedSpeakerPayload = payload;
            return {
              select: () => ({
                single: async () => ({
                  data: { id: 'new-speaker-id', ...payload },
                  error: null,
                }),
              }),
            };
          },
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { id: 'applicant-pred', user_type: 'consumer' }, error: null }),
            }),
          }),
          upsert: async (payload: Record<string, unknown>) => {
            capturedProfilePayload = payload;
            return { data: payload, error: null };
          },
        };
      }
      if (table === 'speaker_categories') {
        return {
          delete: () => ({ eq: async () => ({ error: null }) }),
          insert: async () => ({ error: null }),
        };
      }
      if (table === 'verification_requests') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
          insert: async () => ({ error: null }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    });

    render(
      <MemoryRouter>
        <ExpertOnboarding />
      </MemoryRouter>
    );

    // Step 1: Personal Info
    await userEvent.type(screen.getByLabelText(/Full Name \*/i), 'Priya Sharma');
    await userEvent.clear(screen.getByLabelText(/Email \*/i));
    await userEvent.type(screen.getByLabelText(/Email \*/i), 'pred@example.com');
    await userEvent.type(screen.getByLabelText(/Phone \*/i), '+91 9876543210');
    await userEvent.type(screen.getByPlaceholderText(/Start typing a city/i), 'Bengaluru, India');

    // Select Language
    const langInput = screen.getByPlaceholderText('Select languages...');
    await userEvent.click(langInput);
    const engBtn = await screen.findByRole('button', { name: 'English' });
    await userEvent.click(engBtn);

    await userEvent.type(screen.getByLabelText(/Tell us about yourself \*/i), 'Over 10 years of experience in AI and deep learning architectures solving complex NLP problems.');

    await userEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 2: Profession & Expertise
    await waitFor(() => {
      expect(screen.getByText('Your Expertise')).toBeInTheDocument();
    });

    const profInput = screen.getByPlaceholderText('Search your profession...');
    await userEvent.type(profInput, 'Software');
    await userEvent.click(screen.getByRole('button', { name: 'Software Engineer' }));
    await userEvent.type(screen.getByLabelText(/Expertise Areas/i), 'Machine Learning, NLP');
    await userEvent.type(screen.getByLabelText(/Years of Experience \*/i), '8');

    await userEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 3: Category
    await waitFor(() => {
      expect(screen.getByText('Categories')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Artificial Intelligence' }));
    await userEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 4: Verification / Submit
    await waitFor(() => {
      expect(screen.getByText('Verification')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Submit Application/i }));

    await waitFor(() => {
      expect(capturedSpeakerPayload).not.toBeNull();
    });

    expect(capturedSpeakerPayload).toMatchObject({
      name: 'Priya Sharma',
      title: 'Software Engineer',
      custom_profession: null,
      verification_status: 'pending',
      is_verified: false,
    });

    expect(capturedProfilePayload).toMatchObject({
      user_type: 'consumer',
    });
  }, 15000);

  it('submits an application with custom profession setting custom_profession to the entered title', async () => {
    let capturedSpeakerPayload: Record<string, unknown> | null = null;

    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        session: {
          user: { id: 'applicant-custom', email: 'custom@example.com' },
        },
      },
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'categories') {
        return {
          select: () => ({
            order: async () => ({ data: [{ id: 'cat-1', name: 'Research' }], error: null }),
          }),
        };
      }
      if (table === 'speakers') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
          insert: (payload: Record<string, unknown>) => {
            capturedSpeakerPayload = payload;
            return {
              select: () => ({
                single: async () => ({
                  data: { id: 'custom-speaker-id', ...payload },
                  error: null,
                }),
              }),
            };
          },
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { id: 'applicant-custom', user_type: 'consumer' }, error: null }),
            }),
          }),
          upsert: async () => ({ data: null, error: null }),
        };
      }
      if (table === 'speaker_categories') {
        return {
          delete: () => ({ eq: async () => ({ error: null }) }),
          insert: async () => ({ error: null }),
        };
      }
      if (table === 'verification_requests') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
          insert: async () => ({ error: null }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    });

    render(
      <MemoryRouter>
        <ExpertOnboarding />
      </MemoryRouter>
    );

    // Step 1
    await userEvent.type(screen.getByLabelText(/Full Name \*/i), 'Vikram Sarabhai');
    await userEvent.clear(screen.getByLabelText(/Email \*/i));
    await userEvent.type(screen.getByLabelText(/Email \*/i), 'custom@example.com');
    await userEvent.type(screen.getByLabelText(/Phone \*/i), '+91 9966827110');
    await userEvent.type(screen.getByPlaceholderText(/Start typing a city/i), 'Ahmedabad, India');

    // Select Language
    const langInput = screen.getByPlaceholderText('Select languages...');
    await userEvent.click(langInput);
    const engBtn = await screen.findByRole('button', { name: 'English' });
    await userEvent.click(engBtn);

    await userEvent.type(screen.getByLabelText(/Tell us about yourself \*/i), 'Pioneering space research and advanced quantum physics communications for international institutions.');

    await userEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 2: Custom Profession
    await waitFor(() => {
      expect(screen.getByText('Your Expertise')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /\+ Other/i }));
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Quantum Computing Specialist/i), 'Quantum Computing Researcher');
    await userEvent.type(screen.getByLabelText(/Expertise Areas/i), 'Quantum Algorithms, Qubits');
    await userEvent.type(screen.getByLabelText(/Years of Experience \*/i), '12');

    await userEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 3
    await waitFor(() => {
      expect(screen.getByText('Categories')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Research' }));
    await userEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 4
    await waitFor(() => {
      expect(screen.getByText('Verification')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Submit Application/i }));

    await waitFor(() => {
      expect(capturedSpeakerPayload).not.toBeNull();
    });

    expect(capturedSpeakerPayload).toMatchObject({
      name: 'Vikram Sarabhai',
      title: 'Quantum Computing Researcher',
      custom_profession: 'Quantum Computing Researcher',
      verification_status: 'pending',
      is_verified: false,
    });
  }, 15000);
});
