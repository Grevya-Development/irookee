import { supabase } from '@/lib/supabase'

type NotificationPayload = {
  userId?: string | null
  title: string
  body: string
  type: string
  relatedId?: string | null
}

type NotificationPreferences = {
  email_booking_confirmed?: boolean | null
  email_expert_application?: boolean | null
  email_expert_approved?: boolean | null
  in_app_notifications?: boolean | null
}

type BookingNotificationPayload = {
  bookingId?: string | null
  eventType:
    | 'booking_created'
    | 'booking_confirmed'
    | 'booking_cancelled'
    | 'booking_cancelled_late'
    | 'booking_rescheduled'
  userId?: string | null
  userEmail?: string | null
  expertUserId?: string | null
  expertEmail?: string | null
  expertName?: string | null
  customerName?: string | null
  scheduledAt?: string | null
  durationMinutes?: number | null
  meetingLink?: string | null
}

/** Booking fields such as meeting_link originate from the database and are
 *  interpolated into notification email HTML, so they must be escaped. */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const createInAppNotification = async ({
  userId,
  title,
  body,
  type,
  relatedId,
}: NotificationPayload) => {
  if (!userId) return

  const { error } = await supabase
    .from('notifications' as never)
    .insert({
      user_id: userId,
      title,
      body,
      type,
      related_id: relatedId || null,
    } as never)

  if (error) {
    console.error('Failed to create notification:', error)
  }
}

const getNotificationPreferences = async (userId?: string | null) => {
  if (!userId) return null

  const { data, error } = await supabase
    .from('notification_preferences' as never)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Failed to load notification preferences:', error)
    return null
  }

  return data as NotificationPreferences | null
}

const allowsInApp = (preferences: NotificationPreferences | null) =>
  preferences?.in_app_notifications !== false

const allowsEmail = (
  preferences: NotificationPreferences | null,
  key: keyof Pick<NotificationPreferences, 'email_booking_confirmed' | 'email_expert_application' | 'email_expert_approved'>
) => preferences?.[key] !== false

/** Email delivery requires a server-side secret (Resend/SMTP), which a
 *  client-only app cannot hold safely. With the edge functions removed this is
 *  a no-op; in-app notifications are the delivery channel. The signature is
 *  kept so call sites keep working if an email backend is reintroduced. */
export const sendNotificationEmail = async (payload: {
  to: string
  subject: string
  html: string
  eventType: string
  userId?: string | null
}) => {
  console.info(`Email notifications are disabled (no server backend); skipping "${payload.eventType}" email to ${payload.to}`)
}

export const notifyAdmins = async ({
  title,
  body,
  type,
  relatedId,
}: Omit<NotificationPayload, 'userId'>) => {
  const { data, error } = await supabase
    .from('user_roles' as never)
    .select('user_id')
    .eq('role', 'admin')

  if (error) {
    console.error('Failed to load admin users for notification:', error)
    return
  }

  await Promise.all(
    ((data || []) as { user_id?: string | null }[]).map((admin) =>
      createInAppNotification({
        userId: admin.user_id,
        title,
        body,
        type,
        relatedId,
      })
    )
  )
}

export const notifyBookingEvent = async ({
  bookingId,
  eventType,
  userId,
  userEmail,
  expertUserId,
  expertEmail,
  expertName,
  customerName,
  scheduledAt,
  durationMinutes,
  meetingLink,
}: BookingNotificationPayload) => {
  const userPreferences = await getNotificationPreferences(userId)
  const expertPreferences = await getNotificationPreferences(expertUserId)
  const dateText = scheduledAt
    ? new Date(scheduledAt).toLocaleString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'the selected time'
  const durationText = durationMinutes ? `${durationMinutes} minutes` : 'the selected duration'
  const readableType = eventType.replace('booking_', '').replace(/_/g, ' ')

  // A late cancellation is still a cancellation: it must never fall through to
  // the "confirmed" copy.
  const isCancellation =
    eventType === 'booking_cancelled' || eventType === 'booking_cancelled_late'

  const userTitle = isCancellation
    ? 'Booking cancelled'
    : eventType === 'booking_rescheduled'
      ? 'Booking rescheduled'
      : 'Booking confirmed'
  const userBody = isCancellation
    ? `Your session with ${expertName || 'the expert'} has been cancelled.`
    : eventType === 'booking_rescheduled'
      ? `Your session with ${expertName || 'the expert'} has been rescheduled to ${dateText} (${durationText}).`
      : `Your session with ${expertName || 'the expert'} is set for ${dateText} (${durationText}).`
  const expertTitle = isCancellation ? 'Session cancelled' : eventType === 'booking_rescheduled'
    ? 'Session rescheduled'
    : 'New confirmed booking'
  const expertBody =
    eventType === 'booking_cancelled_late'
      ? `${customerName || 'A client'} cancelled their session less than 2 hours before the start time.`
      : eventType === 'booking_cancelled'
        ? `${customerName || 'A client'} cancelled their session.`
        : eventType === 'booking_rescheduled'
          ? `${customerName || 'A client'} has rescheduled their session to ${dateText} (${durationText}).`
          : `${customerName || 'A client'} has a session scheduled for ${dateText} (${durationText}).`

  const tasks: Promise<unknown>[] = []

  if (allowsInApp(userPreferences)) {
    tasks.push(createInAppNotification({
      userId,
      title: userTitle,
      body: userBody,
      type: eventType,
      relatedId: bookingId,
    }))
  }

  if (allowsInApp(expertPreferences)) {
    tasks.push(createInAppNotification({
      userId: expertUserId,
      title: expertTitle,
      body: expertBody,
      type: eventType,
      relatedId: bookingId,
    }))
  }

  const emailHtml = `
    <p>Your Irookee booking was ${escapeHtml(readableType)}.</p>
    <p><strong>When:</strong> ${escapeHtml(dateText)}</p>
    <p><strong>Duration:</strong> ${escapeHtml(durationText)}</p>
    ${meetingLink ? `<p><strong>Meeting link:</strong> ${escapeHtml(meetingLink)}</p>` : ''}
  `

  if (userEmail && allowsEmail(userPreferences, 'email_booking_confirmed')) {
    tasks.push(sendNotificationEmail({
      to: userEmail,
      subject: `Irookee booking ${readableType}`,
      html: emailHtml,
      eventType,
      userId,
    }))
  }

  if (expertEmail && allowsEmail(expertPreferences, 'email_booking_confirmed')) {
    tasks.push(sendNotificationEmail({
      to: expertEmail,
      subject: `Irookee booking ${readableType}`,
      html: emailHtml,
      eventType,
      userId: expertUserId,
    }))
  }

  await Promise.all(tasks)
}
