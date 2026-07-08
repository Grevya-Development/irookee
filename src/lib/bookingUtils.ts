export type BookingLike = {
  id?: string | null
  scheduled_at?: string | null
  event_date?: string | null
  created_at?: string | null
  duration_minutes?: number | null
  duration_hours?: number | null
  original_scheduled_at?: string | null
  original_duration_minutes?: number | null
  status?: string | null
}

export const ACTIVE_BOOKING_STATUSES = new Set(['pending', 'confirmed', 'in_progress'])

export const getBookingStart = (booking: BookingLike) =>
  booking.scheduled_at || booking.event_date || null

export const getBookingEnd = (booking: BookingLike) => {
  const start = getBookingStart(booking)
  if (!start) return null

  const startDate = new Date(start)
  if (Number.isNaN(startDate.getTime())) return null

  const durationMinutes =
    Number(booking.duration_minutes) ||
    Number(booking.duration_hours || 0) * 60 ||
    60

  return new Date(startDate.getTime() + durationMinutes * 60 * 1000)
}

export const isUpcomingBooking = (booking: BookingLike, now = new Date()) => {
  if (!booking.status || booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'no_show' || booking.status === 'refunded') return false

  const end = getBookingEnd(booking)
  return Boolean(end && end.getTime() > now.getTime())
}

export const isPastBooking = (booking: BookingLike, now = new Date()) => {
  if (booking.status === 'completed' || booking.status === 'no_show' || booking.status === 'refunded') return true
  if (booking.status === 'cancelled') return false

  const end = getBookingEnd(booking)
  return Boolean(end && end.getTime() <= now.getTime())
}

export const formatBookingDuration = (booking: BookingLike) => {
  if (booking.duration_minutes) return `${booking.duration_minutes} minutes`
  if (booking.duration_hours) return `${booking.duration_hours} hours`
  return 'Duration not set'
}

export const getBookingDurationMinutes = (booking: BookingLike) =>
  Number(booking.duration_minutes) ||
  Number(booking.duration_hours || 0) * 60 ||
  60

export const buildBookingTimeFields = (
  scheduledAt: string,
  durationMinutes: number,
  existingBooking?: BookingLike | null
) => ({
  event_date: scheduledAt,
  scheduled_at: scheduledAt,
  duration_hours: durationMinutes / 60,
  duration_minutes: durationMinutes,
  original_scheduled_at: existingBooking?.original_scheduled_at || existingBooking?.scheduled_at || existingBooking?.event_date || scheduledAt,
  original_duration_minutes:
    existingBooking?.original_duration_minutes ||
    existingBooking?.duration_minutes ||
    (existingBooking?.duration_hours ? existingBooking.duration_hours * 60 : durationMinutes),
})

export const rangesOverlap = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) => startA < endB && startB < endA
