import { requireSupabase } from '../supabase';
import {
  NotificationRecord,
  NotificationsRepository,
  PushRegistration,
} from './types';

type NotificationRow = {
  id: string;
  kind: NotificationRecord['kind'];
  title: string;
  body: string;
  deep_link: string | null;
  created_at: string;
  read_at: string | null;
};

/**
 * Supabase-backed store. RLS allows select and update only — notifications
 * are written server-side, and clearing sets dismissed_at rather than
 * deleting, so the trail survives. Push devices insert/delete their own rows.
 */
export class SupabaseNotificationsRepository implements NotificationsRepository {
  async list(userId: string): Promise<NotificationRecord[]> {
    const { data, error } = await requireSupabase()
      .from('notifications')
      .select('id, kind, title, body, deep_link, created_at, read_at')
      .eq('user_id', userId)
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<NotificationRow[]>();
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      deepLink: row.deep_link,
      createdAt: row.created_at,
      readAt: row.read_at,
    }));
  }

  async markAllRead(userId: string): Promise<void> {
    const { error } = await requireSupabase()
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);
    if (error) throw error;
  }

  async clearAll(userId: string): Promise<void> {
    const { error } = await requireSupabase()
      .from('notifications')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('dismissed_at', null);
    if (error) throw error;
  }

  async registerDevice(userId: string, registration: PushRegistration): Promise<void> {
    const { error } = await requireSupabase().from('push_devices').upsert(
      {
        user_id: userId,
        token: registration.token,
        platform: registration.platform,
        locale: registration.locale,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'token' },
    );
    if (error) throw error;
  }

  async unregisterDevice(token: string): Promise<void> {
    const { error } = await requireSupabase()
      .from('push_devices')
      .delete()
      .eq('token', token);
    if (error) throw error;
  }
}
