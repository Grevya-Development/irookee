import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

/**
 * Regression: the expert id comes from the URL and was passed straight to
 * PostgREST. A malformed id produced a 400 ("invalid input syntax for type
 * uuid") and a console error on every visit to a bad /expert/:id link.
 */

const single = vi.fn();
const from = vi.fn(() => ({
  select: () => ({ eq: () => ({ single }) }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...a: unknown[]) => from(...(a as [])) },
}));

const { useExperts } = await import('../useExperts');

beforeEach(() => {
  from.mockClear();
  single.mockReset();
});

describe('useExperts', () => {
  it('does not query the API for a non-UUID expert id', async () => {
    const { result } = renderHook(() => useExperts('nonexistent-id'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(from).not.toHaveBeenCalled();
    expect(result.current.expert).toBeNull();
    expect(result.current.error).toBe('Expert not found');
  });

  it('queries normally for a well-formed UUID and sanitizes private fields', async () => {
    single.mockResolvedValue({
      data: {
        id: '8e1de0c5-c7a2-4a84-9304-35d0985f62f7',
        name: 'jen',
        phone: '+919966827110',
        email: 'jen@private.com',
        user_id: 'user-jen-private',
        verification_documents: { docs: ['id.pdf'] },
        suspension_reason: 'private internal note',
        speaker_categories: [],
      },
      error: null,
    });

    const { result } = renderHook(() =>
      useExperts('8e1de0c5-c7a2-4a84-9304-35d0985f62f7')
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(from).toHaveBeenCalledWith('speakers');
    expect(result.current.expert?.name).toBe('jen');
    expect(result.current.expert?.phone).toBeUndefined();
    expect(result.current.expert?.email).toBeUndefined();
    expect(result.current.expert?.user_id).toBeUndefined();
    expect((result.current.expert as unknown as Record<string, unknown>)?.verification_documents).toBeUndefined();
    expect((result.current.expert as unknown as Record<string, unknown>)?.suspension_reason).toBeUndefined();
    expect(result.current.error).toBeNull();
  });
});
