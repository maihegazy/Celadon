/**
 * The notification centre and push registrations. Notifications are composed
 * server-side, already in the user's language — the client only reads them,
 * marks them read, and clears them. Devices register their own push tokens.
 */

import type { Language } from '../../i18n';

export type NotificationKind =
  | 'meal_reminder'
  | 'shopping'
  | 'weekly_review'
  | 'new_recipe'
  | 'plan_tweak';

export type NotificationRecord = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Where tapping it should land, e.g. celadon://plan. */
  deepLink: string | null;
  /** ISO timestamp. */
  createdAt: string;
  readAt: string | null;
};

export type PushRegistration = {
  token: string;
  platform: 'ios' | 'android' | 'web';
  locale: Language;
};

export interface NotificationsRepository {
  /** Undismissed notifications, newest first. */
  list(userId: string): Promise<NotificationRecord[]>;
  markAllRead(userId: string): Promise<void>;
  /** Dismisses everything currently in the centre; rows stay for the audit trail. */
  clearAll(userId: string): Promise<void>;
  registerDevice(userId: string, registration: PushRegistration): Promise<void>;
  unregisterDevice(token: string): Promise<void>;
}
