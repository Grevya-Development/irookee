import { supabase } from '@/lib/supabase'

type NotificationPayload = {
  userId?: string | null
  title: string
  body: string
  type: string
  relatedId?: string | null
}

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

export const sendNotificationEmail = async (payload: {
  to: string
  subject: string
  html: string
  eventType: string
  userId?: string | null
}) => {
  const { error } = await supabase.functions.invoke('send-notification-email', {
    body: payload,
  })

  if (error) {
    console.error('Failed to send notification email:', error)
  }
}
