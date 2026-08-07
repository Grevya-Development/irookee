import { describe, it, expect } from 'vitest';
import { canTransition, isSameSlot, hasStarted, hasEnded } from '../bookingRules';

/**
 * Regression tests for the booking lifecycle defects in the PR #62 report.
 * Each block names the defect it locks down.
 */

const NOW = new Date('2026-08-03T12:00:00.000Z');

const booking = (over: Record<string, unknown> = {}) => ({
  id: 'b1',
  status: 'confirmed',
  scheduled_at: '2026-08-03T15:00:00.000Z', // 3h in the future
  duration_minutes: 30,
  ...over,
});

const past = (over: Record<string, unknown> = {}) =>
  booking({ scheduled_at: '2026-08-03T09:00:00.000Z', ...over }); // started 3h ago

describe('BOOK-5 — a session cannot be completed before it starts', () => {
  it('blocks completing a future session', () => {
    const r = canTransition(booking(), 'completed', { actor: 'expert', now: NOW });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/only be marked completed after its start time/i);
  });

  it('explains the double-booking consequence, not just "not allowed"', () => {
    const r = canTransition(booking(), 'completed', { actor: 'expert', now: NOW });
    expect(r.reason).toMatch(/double-booking/i);
  });

  it('allows completing once the session has started', () => {
    expect(canTransition(past(), 'completed', { actor: 'expert', now: NOW }).allowed).toBe(true);
  });

  it('blocks early completion for admins too — it corrupts the record either way', () => {
    expect(canTransition(booking(), 'completed', { actor: 'admin', now: NOW }).allowed).toBe(false);
  });

  it('applies the same rule to no_show', () => {
    expect(canTransition(booking(), 'no_show', { actor: 'expert', now: NOW }).allowed).toBe(false);
    expect(canTransition(past(), 'no_show', { actor: 'expert', now: NOW }).allowed).toBe(true);
  });
});

describe('BOOK-8 — the started-session guard applies to every actor', () => {
  it('blocks a consumer cancelling after start', () => {
    const r = canTransition(past(), 'cancelled', { actor: 'consumer', now: NOW });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/already started/i);
  });

  it('blocks the expert pending-route decline after start (was permitted)', () => {
    const r = canTransition(past({ status: 'pending' }), 'cancelled', { actor: 'expert', now: NOW });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/already started/i);
  });

  it('still lets an admin cancel a started session as an override', () => {
    expect(canTransition(past(), 'cancelled', { actor: 'admin', now: NOW }).allowed).toBe(true);
  });

  it('allows cancelling a future session from either side', () => {
    expect(canTransition(booking(), 'cancelled', { actor: 'consumer', now: NOW }).allowed).toBe(true);
    expect(canTransition(booking({ status: 'pending' }), 'cancelled', { actor: 'expert', now: NOW }).allowed).toBe(true);
  });
});

describe('ADMIN-14 — a finished session cannot be moved back to pending', () => {
  it('blocks reviving a finished session, even for an admin', () => {
    const finished = booking({ scheduled_at: '2026-08-03T09:00:00.000Z', duration_minutes: 30 });
    const r = canTransition(finished, 'pending', { actor: 'admin', now: NOW });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/already finished/i);
  });

  it('lets an admin set a future session to pending', () => {
    expect(canTransition(booking(), 'pending', { actor: 'admin', now: NOW }).allowed).toBe(true);
  });

  it('does not let a non-admin set pending', () => {
    expect(canTransition(booking(), 'pending', { actor: 'expert', now: NOW }).allowed).toBe(false);
  });
});

describe('BOOK-7 — rescheduling to the identical slot is not a reschedule', () => {
  it('detects the same start time and duration', () => {
    expect(isSameSlot(booking(), '2026-08-03T15:00:00.000Z', 30)).toBe(true);
  });

  it('ignores sub-minute differences the picker cannot express', () => {
    expect(isSameSlot(booking(), '2026-08-03T15:00:45.000Z', 30)).toBe(true);
  });

  it('treats a different time as a real reschedule', () => {
    expect(isSameSlot(booking(), '2026-08-03T16:00:00.000Z', 30)).toBe(false);
  });

  it('treats a duration change at the same time as a real change', () => {
    expect(isSameSlot(booking(), '2026-08-03T15:00:00.000Z', 60)).toBe(false);
  });

  it('handles legacy rows that only carry event_date', () => {
    const legacy = { id: 'x', status: 'confirmed', event_date: '2026-08-03T15:00:00.000Z', duration_hours: 0.5 };
    expect(isSameSlot(legacy, '2026-08-03T15:00:00.000Z', 30)).toBe(true);
  });
});

describe('terminal states and time helpers', () => {
  it('does not let a non-admin rewrite a completed session', () => {
    const r = canTransition(past({ status: 'completed' }), 'cancelled', { actor: 'expert', now: NOW });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/already completed/i);
  });

  it('rejects a no-op transition to the current status', () => {
    expect(canTransition(booking({ status: 'confirmed' }), 'confirmed', { actor: 'admin', now: NOW }).allowed).toBe(false);
  });

  it('computes hasStarted / hasEnded from the schedule', () => {
    expect(hasStarted(booking(), NOW)).toBe(false);
    expect(hasStarted(past(), NOW)).toBe(true);
    expect(hasEnded(booking(), NOW)).toBe(false);
    expect(hasEnded(past(), NOW)).toBe(true);
  });

  it('treats a booking with no schedule as not started', () => {
    expect(hasStarted({ id: 'n', status: 'pending' }, NOW)).toBe(false);
  });
});
