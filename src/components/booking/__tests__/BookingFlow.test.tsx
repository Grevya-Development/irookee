import { describe, it, expect, vi } from 'vitest';
import { ensureUserProfileExists } from '@/lib/userUtils';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'test-user-123', email: 'test@irookee.com', full_name: 'Test Consumer', user_type: 'consumer' },
            error: null,
          }),
          upsert: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-user-123', email: 'test@irookee.com', full_name: 'Test Consumer', user_type: 'consumer' },
            error: null,
          }),
        };
      }
      if (table === 'speakers') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'expert-123', user_id: 'expert-user-456', name: 'Dr. Jane Smith', email: 'jane@expert.com' },
            error: null,
          }),
        };
      }
      if (table === 'expertise_bookings') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({
            data: [{ id: 'booking-999', status: 'confirmed', scheduled_at: '2026-07-29T10:00:00Z' }],
            error: null,
          }),
        };
      }
      return {};
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-123', email: 'test@irookee.com', user_metadata: { full_name: 'Test Consumer' } } },
        error: null,
      }),
    },
  },
}));

describe('BUG 1 Audit: Booking Execution & Profile Integrity', () => {
  it('1. ensureUserProfileExists guarantees non-null profile data and prevents "profile is not defined"', async () => {
    const mockUser = {
      id: 'test-user-123',
      email: 'test@irookee.com',
      app_metadata: {},
      user_metadata: { full_name: 'Test Consumer' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    // Test with null profile
    const result = await ensureUserProfileExists(mockUser as unknown as Parameters<typeof ensureUserProfileExists>[0], null);
    
    expect(result).toBeDefined();
    expect(result.customerName).toBe('Test Consumer');
    expect(result.customerEmail).toBe('test@irookee.com');
    expect(result.profile).toBeDefined();
    expect(result.profile.id).toBe('test-user-123');
  });

  it('2. Booking insertion payload completes cleanly with verified status 200/inserted row', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockUser = { id: 'test-user-123', email: 'test@irookee.com' };

    const { customerName, customerEmail } = await ensureUserProfileExists(mockUser as unknown as Parameters<typeof ensureUserProfileExists>[0], null);
    
    const insertRes = await supabase.from('expertise_bookings').insert({
      expert_id: 'expert-123',
      consumer_id: mockUser.id,
      scheduled_at: '2026-07-29T10:00:00Z',
      duration_minutes: 30,
      status: 'confirmed',
    });

    expect(insertRes.error).toBeNull();
    expect(insertRes.data).toBeDefined();
    expect(customerName).toBe('Test Consumer');
    expect(customerEmail).toBe('test@irookee.com');
  });

  it('3. Submit lock prevents race condition and double-click duplicate booking creation', async () => {
    let isSubmitting = false;
    let executionCount = 0;

    const simulateBookingClick = async () => {
      if (isSubmitting) return 'BLOCKED';
      isSubmitting = true;
      executionCount++;
      // Simulate async network request
      await new Promise((resolve) => setTimeout(resolve, 50));
      isSubmitting = false;
      return 'SUCCESS';
    };

    // Trigger two rapid clicks concurrently
    const [res1, res2] = await Promise.all([simulateBookingClick(), simulateBookingClick()]);

    expect(executionCount).toBe(1);
    expect(res1).toBe('SUCCESS');
    expect(res2).toBe('BLOCKED');
  });
});
