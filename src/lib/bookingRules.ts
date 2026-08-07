/**
 * Booking status transition rules — one source of truth.
 *
 * The PR #62 audit found the same business rule enforced differently depending
 * on which surface performed the action:
 *
 *   BOOK-5  Expert Dashboard let a session be marked "completed" before its
 *           start time, which removed it from the double-booking overlap set
 *           (the trigger only blocks pending/confirmed/in_progress) and freed
 *           the slot for a second booking.
 *   BOOK-8  The client's Cancel was blocked after start time, but the expert's
 *           pending-route Decline had no such check.
 *   ADMIN-14 Admin could move an already-finished session back to "pending".
 *
 * Those are three symptoms of one cause: each surface re-implemented its own
 * guard. Everything now funnels through `canTransition`.
 */

import { getBookingEnd, getBookingStart, type BookingLike } from './bookingUtils';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'refunded';

/** Statuses that occupy an expert's calendar slot (must match the DB trigger). */
export const SLOT_BLOCKING_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'in_progress'];

export interface TransitionContext {
  /** Who is performing the change. Admins may override time-based guards. */
  actor: 'consumer' | 'expert' | 'admin';
  now?: Date;
}

export interface TransitionResult {
  allowed: boolean;
  /** User-facing explanation when blocked. */
  reason?: string;
}

const ALLOW: TransitionResult = { allowed: true };
const deny = (reason: string): TransitionResult => ({ allowed: false, reason });

/** True once the session's scheduled start time has passed. */
export const hasStarted = (booking: BookingLike, now = new Date()): boolean => {
  const start = getBookingStart(booking);
  if (!start) return false;
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return false;
  return startDate.getTime() <= now.getTime();
};

/** True once the session's end time has passed. */
export const hasEnded = (booking: BookingLike, now = new Date()): boolean => {
  const end = getBookingEnd(booking);
  return Boolean(end && end.getTime() <= now.getTime());
};

/**
 * Whether `next` may be applied to `booking`.
 *
 * Admins bypass timing guards (they need to correct historical records) but not
 * the guards that would corrupt data, such as reviving a finished session as
 * "pending".
 */
export function canTransition(
  booking: BookingLike,
  next: BookingStatus,
  ctx: TransitionContext
): TransitionResult {
  const now = ctx.now ?? new Date();
  const current = (booking.status || 'pending') as BookingStatus;
  const isAdmin = ctx.actor === 'admin';

  if (current === next) return deny(`This session is already marked ${next.replace('_', ' ')}.`);

  // Terminal states should not be silently rewritten by non-admins.
  if (!isAdmin && (current === 'completed' || current === 'no_show' || current === 'refunded')) {
    return deny(`This session is already ${current.replace('_', ' ')} and can no longer be changed.`);
  }

  switch (next) {
    // BOOK-5: completing early falsifies the record AND releases the slot.
    case 'completed':
      if (!hasStarted(booking, now)) {
        return deny(
          'A session can only be marked completed after its start time. Marking it early would free the slot for double-booking.'
        );
      }
      return ALLOW;

    // A no-show can only be judged once the session was due to begin.
    case 'no_show':
      if (!hasStarted(booking, now)) {
        return deny('A session can only be marked as a no-show after its start time.');
      }
      return ALLOW;

    // BOOK-8: applies to the consumer's Cancel AND the expert's pending Decline.
    case 'cancelled':
      if (current === 'cancelled') return deny('This session is already cancelled.');
      if (!isAdmin && hasStarted(booking, now)) {
        return deny('This session has already started and can no longer be cancelled.');
      }
      return ALLOW;

    // ADMIN-14: a finished session must not be revived as pending.
    case 'pending':
      if (hasEnded(booking, now)) {
        return deny('This session has already finished, so it cannot be moved back to pending.');
      }
      if (!isAdmin) return deny('Only an administrator can move a session back to pending.');
      return ALLOW;

    case 'confirmed':
      if (hasEnded(booking, now) && !isAdmin) {
        return deny('This session has already finished and can no longer be confirmed.');
      }
      return ALLOW;

    case 'in_progress':
      if (!hasStarted(booking, now)) {
        return deny('A session cannot be in progress before its start time.');
      }
      return ALLOW;

    case 'refunded':
      if (!isAdmin) return deny('Only an administrator can mark a session refunded.');
      return ALLOW;

    default:
      return deny('Unsupported status.');
  }
}

/**
 * BOOK-7: rescheduling to the slot the booking already occupies is a no-op that
 * was accepted as a real reschedule (and notified both parties).
 */
export function isSameSlot(
  booking: BookingLike,
  nextScheduledAt: string,
  nextDurationMinutes: number
): boolean {
  const currentStart = getBookingStart(booking);
  if (!currentStart) return false;

  const a = new Date(currentStart).getTime();
  const b = new Date(nextScheduledAt).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return false;

  const currentDuration =
    Number(booking.duration_minutes) || Number(booking.duration_hours || 0) * 60 || 60;

  // Compare to the minute; the picker cannot express finer granularity.
  return Math.floor(a / 60000) === Math.floor(b / 60000)
    && currentDuration === nextDurationMinutes;
}
