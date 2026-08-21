import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpertApproval } from '../ExpertApproval';
import { supabase } from '@/integrations/supabase/client';

const mockExpertsData = [
  {
    id: 'expert-1',
    name: 'Jane Doe',
    title: 'Full Stack Developer',
    custom_profession: 'Custom Full Stack Wizard',
    email: 'jane@example.com',
    phone: '+1234567890',
    location: 'San Francisco, CA',
    company: 'Acme Corp',
    experience_years: 6,
    verification_status: 'pending',
    is_verified: false,
    badges: ['Top Rated'],
    verification_documents: null,
    created_at: '2026-08-10T10:00:00Z',
    bio: 'Passionate developer and mentor.',
    linkedin_url: 'https://linkedin.com/in/janedoe',
    user_id: 'user-1',
  },
];

vi.mock('@/integrations/supabase/client', () => {
  const createQueryChain = (data: unknown) => {
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.single = vi.fn().mockResolvedValue({
      data: {
        id: 'expert-1',
        user_id: 'user-1',
        verification_status: 'pending',
        is_verified: false,
        suspension_history: [],
      },
      error: null,
    });
    chain.then = (resolve: (val: unknown) => unknown) =>
      Promise.resolve({ data, error: null }).then(resolve);
    chain.update = vi.fn(() => {
      const updateChain: Record<string, unknown> = {};
      updateChain.eq = vi.fn().mockResolvedValue({ data: null, error: null });
      return updateChain;
    });
    chain.delete = vi.fn(() => {
      const deleteChain: Record<string, unknown> = {};
      deleteChain.eq = vi.fn().mockResolvedValue({ data: null, error: null });
      return deleteChain;
    });
    return chain;
  };

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'speakers') {
          return createQueryChain(mockExpertsData);
        }
        return createQueryChain([]);
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://test.url' }, error: null }),
        }),
      },
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
});

vi.mock('@/lib/notifications', () => ({
  createInAppNotification: vi.fn().mockResolvedValue({}),
  sendNotificationEmail: vi.fn().mockResolvedValue({}),
}));

describe('ExpertApproval Admin Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders expert applications with name, title, custom profession badge, and status', async () => {
    render(<ExpertApproval />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
    expect(screen.getByText(/Custom: Custom Full Stack Wizard/i)).toBeInTheDocument();
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Top Rated')).toBeInTheDocument();
  });

  it('approves a pending expert application and updates user_type to expert', async () => {
    const user = userEvent.setup();
    render(<ExpertApproval />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    const approveButton = screen.getByTitle('Approve Application');
    await user.click(approveButton);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('speakers');
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });

  it('toggles verified badge independently from verification_status', async () => {
    const user = userEvent.setup();
    render(<ExpertApproval />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    const toggleButton = screen.getByTitle('Grant Verified checkmark');
    await user.click(toggleButton);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('speakers');
    });
  });

  it('opens request changes dialog and submits feedback', async () => {
    const user = userEvent.setup();
    render(<ExpertApproval />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    const reqChangesBtn = screen.getByTitle('Request Changes');
    await user.click(reqChangesBtn);

    expect(screen.getByText('Request Changes from Applicant')).toBeInTheDocument();
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Please re-upload your certificates');

    const submitBtn = screen.getByText('Submit Decision');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('speakers');
    });
  });

  it('opens expert detail modal and displays trust badges and custom profession remap tool', async () => {
    const user = userEvent.setup();
    render(<ExpertApproval />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    const viewBtn = screen.getByTitle('View Details');
    await user.click(viewBtn);

    expect(screen.getByText(/Custom Profession Review Required/i)).toBeInTheDocument();
    expect(screen.getByText(/Trust Tags & Badges/i)).toBeInTheDocument();
    expect(screen.getByText('+ Super Expert')).toBeInTheDocument();
  });
});
