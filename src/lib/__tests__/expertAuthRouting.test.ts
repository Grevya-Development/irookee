import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthenticatedUserDestination } from '../auth';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
      rpc: vi.fn(),
    },
  };
});

describe('Role-Aware Post-Login Destination Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes an approved/active expert to /expert/dashboard', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { user_type: 'expert' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'speakers') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: 'expert-123', verification_status: 'verified' },
                error: null,
              }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockFrom);

    const dest = await getAuthenticatedUserDestination('user-expert-1');
    expect(dest.defaultPath).toBe('/expert/dashboard');
    expect(dest.isExpert).toBe(true);
    expect(dest.isAdmin).toBe(false);
  });

  it('routes a user with a pending expert application to /expert/dashboard', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { user_type: 'consumer' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'speakers') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: 'expert-pending-123', verification_status: 'pending' },
                error: null,
              }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockFrom);

    const dest = await getAuthenticatedUserDestination('user-pending-1');
    expect(dest.defaultPath).toBe('/expert/dashboard');
    expect(dest.expertStatus).toBe('pending');
  });

  it('routes a regular consumer without expert records to /dashboard', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { user_type: 'consumer' }, error: null }),
            }),
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
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockFrom);

    const dest = await getAuthenticatedUserDestination('user-consumer-1');
    expect(dest.defaultPath).toBe('/dashboard');
    expect(dest.isExpert).toBe(false);
    expect(dest.isAdmin).toBe(false);
  });

  it('routes an admin user to /admin', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { user_type: 'admin' }, error: null }),
            }),
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
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
    });

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockFrom);

    const dest = await getAuthenticatedUserDestination('user-admin-1');
    expect(dest.defaultPath).toBe('/admin');
    expect(dest.isAdmin).toBe(true);
  });
});
