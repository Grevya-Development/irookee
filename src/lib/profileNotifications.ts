/**
 * Centralized Profile Notification Service for Irookee.
 * Provides accessible, deduplicated, auto-dismissing toast notifications for profile operations.
 */
import { toast as sonnerToast } from 'sonner';

export type ProfileUpdateType = 'profile' | 'phone' | 'email' | 'expertise' | 'avatar' | 'general';

const SUCCESS_MESSAGES: Record<ProfileUpdateType, string> = {
  profile: '✓ Profile updated successfully',
  phone: '✓ Phone updated successfully',
  email: '✓ Email updated successfully',
  expertise: '✓ Expertise updated successfully',
  avatar: '✓ Profile picture updated successfully',
  general: '✓ Updates saved successfully',
};

// Deduplication map to prevent toast stacking/flooding within 2 seconds
const recentToastTimestamps = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 2000;

function isDuplicate(message: string): boolean {
  const now = Date.now();
  const lastTime = recentToastTimestamps.get(message);
  if (lastTime && now - lastTime < DEDUPLICATION_WINDOW_MS) {
    return true;
  }
  recentToastTimestamps.set(message, now);
  // Clean up old entries
  if (recentToastTimestamps.size > 50) {
    for (const [key, time] of recentToastTimestamps.entries()) {
      if (now - time > DEDUPLICATION_WINDOW_MS) {
        recentToastTimestamps.delete(key);
      }
    }
  }
  return false;
}

export const profileNotificationService = {
  /**
   * Triggers a standardized profile success toast notification.
   */
  notifySuccess(type: ProfileUpdateType, customMessage?: string) {
    const message = customMessage || SUCCESS_MESSAGES[type] || SUCCESS_MESSAGES.general;

    if (isDuplicate(message)) return;

    sonnerToast.success(message, {
      duration: 3000,
      id: `profile-success-${type}`,
      dismissible: true,
    });
  },

  /**
   * Triggers a standardized profile failure/error toast notification.
   */
  notifyError(error: unknown, fallbackMessage = 'Could not update profile details') {
    let message = fallbackMessage;

    if (error instanceof Error && error.message) {
      message = error.message;
    } else if (typeof error === 'string' && error.trim()) {
      message = error.trim();
    } else if (typeof error === 'object' && error !== null) {
      const errObj = error as Record<string, unknown>;
      if (typeof errObj.message === 'string') {
        message = errObj.message;
      }
    }

    // Clean up Supabase RLS / DB codes into human-readable messages
    if (message.includes('violates row-level security') || message.includes('42501')) {
      message = 'Permission denied: Could not update profile.';
    } else if (message.includes('unique constraint') || message.includes('23505')) {
      message = 'This email or record already exists.';
    }

    if (isDuplicate(message)) return;

    sonnerToast.error(message, {
      duration: 4000,
      id: `profile-error-${Date.now()}`,
      dismissible: true,
    });
  },
};
