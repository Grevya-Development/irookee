import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regression: Dashboard sends `booking_cancelled_late` for a cancellation made
 * less than two hours before the session. notifyBookingEvent branched only on
 * `booking_cancelled`, so a late cancellation fell through to the confirmation
 * copy and told both parties the booking was CONFIRMED.
 */

const inserted: Record<string, unknown>[] = [];
const emails: { to: string; subject: string; html: string }[] = [];

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      insert: (row: Record<string, unknown>) => {
        if (table === 'notifications') inserted.push(row);
        return Promise.resolve({ error: null });
      },
      select: () => ({
        eq: () => ({
          // no stored notification preferences -> all channels allowed
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    functions: {
      invoke: (_name: string, opts: { body: { to: string; subject: string; html: string } }) => {
        emails.push(opts.body);
        return Promise.resolve({ error: null });
      },
    },
  },
}));

const { notifyBookingEvent, escapeHtml } = await import('../notifications');

const payload = {
  bookingId: 'booking-1',
  userId: 'consumer-1',
  userEmail: 'consumer@example.com',
  expertUserId: 'expert-user-1',
  expertEmail: 'expert@example.com',
  expertName: 'Dr. Jane Smith',
  customerName: 'Sam Client',
  scheduledAt: '2026-09-01T10:00:00.000Z',
  durationMinutes: 30,
  meetingLink: 'https://meet.jit.si/irookee-abc123',
};

beforeEach(() => {
  inserted.length = 0;
  emails.length = 0;
});

describe('notifyBookingEvent', () => {
  it('treats a late cancellation as a cancellation, not a confirmation', async () => {
    await notifyBookingEvent({ ...payload, eventType: 'booking_cancelled_late' });

    const consumerNote = inserted.find((r) => r.user_id === 'consumer-1');
    const expertNote = inserted.find((r) => r.user_id === 'expert-user-1');

    expect(consumerNote?.title).toBe('Booking cancelled');
    expect(String(consumerNote?.body)).toMatch(/has been cancelled/i);
    expect(String(consumerNote?.body)).not.toMatch(/is set for/i);

    expect(expertNote?.title).toBe('Session cancelled');
    expect(String(expertNote?.body)).toMatch(/less than 2 hours/i);

    // and the email subject must not read "cancelled_late"
    expect(emails.length).toBeGreaterThan(0);
    for (const mail of emails) {
      expect(mail.subject).toBe('Irookee booking cancelled late');
      expect(mail.subject).not.toMatch(/_/);
    }
  });

  it('still reports a normal cancellation correctly', async () => {
    await notifyBookingEvent({ ...payload, eventType: 'booking_cancelled' });
    const consumerNote = inserted.find((r) => r.user_id === 'consumer-1');
    expect(consumerNote?.title).toBe('Booking cancelled');
    expect(inserted.find((r) => r.user_id === 'expert-user-1')?.title).toBe('Session cancelled');
  });

  it('still reports a new booking as confirmed', async () => {
    await notifyBookingEvent({ ...payload, eventType: 'booking_created' });
    expect(inserted.find((r) => r.user_id === 'consumer-1')?.title).toBe('Booking confirmed');
    expect(inserted.find((r) => r.user_id === 'expert-user-1')?.title).toBe('New confirmed booking');
  });

  it('escapes database-sourced values interpolated into the email HTML', async () => {
    await notifyBookingEvent({
      ...payload,
      eventType: 'booking_created',
      meetingLink: 'https://x/"><img src=x onerror=alert(1)>',
    });
    expect(emails.length).toBeGreaterThan(0);
    for (const mail of emails) {
      expect(mail.html).not.toContain('<img');
      expect(mail.html).toContain('&lt;img');
    }
  });

  it('escapeHtml neutralises tag and attribute delimiters', () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });
});
