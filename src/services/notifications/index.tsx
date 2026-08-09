import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../auth';
import { isSupabaseConfigured } from '../supabase';
import { useI18n } from '../../i18n';
import { SupabaseNotificationsRepository } from './SupabaseNotificationsRepository';
import { NotificationRecord, NotificationsRepository } from './types';

export * from './types';
export { SupabaseNotificationsRepository } from './SupabaseNotificationsRepository';

const cacheKey = (userId: string) => `celadon.notifications.${userId}`;

/**
 * Fetches the Expo push token and stores it in push_devices. Quietly gives
 * up when anything is missing — web, simulators, denied permission, or a
 * build without an EAS project id. Registration is a nicety, never a gate.
 */
async function registerForPush(
  repo: NotificationsRepository,
  userId: string,
  locale: 'en' | 'ar',
): Promise<void> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

  const existing = await Notifications.getPermissionsAsync();
  const granted = existing.granted
    ? true
    : (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return;

  const projectId: string | undefined =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined))
    .data;

  // Keyed on token: a reinstall or account switch re-points the same device.
  await repo.registerDevice(userId, { token, platform: Platform.OS, locale });
}

type NotificationsValue = {
  notifications: NotificationRecord[];
  unreadCount: number;
  /** Called when the centre opens; clears the unread state. */
  markAllRead: () => void;
  clearAll: () => void;
};

const NotificationsContext = createContext<NotificationsValue | null>(null);

export function NotificationsProvider({
  children,
  repository,
}: {
  children: React.ReactNode;
  repository?: NotificationsRepository;
}) {
  const repo = useMemo(
    () =>
      repository ?? (isSupabaseConfigured ? new SupabaseNotificationsRepository() : null),
    [repository],
  );
  const { session, status } = useAuth();
  const { lang } = useI18n();
  const userId = session?.user.id ?? null;

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  // Hydrate: cached copy first so the centre isn't blank offline, then live.
  useEffect(() => {
    if (status !== 'signedIn' || !userId || !repo) {
      setNotifications([]);
      return;
    }
    let active = true;
    AsyncStorage.getItem(cacheKey(userId))
      .then((cached) => {
        if (active && cached) setNotifications(JSON.parse(cached) as NotificationRecord[]);
      })
      .catch(() => {});
    repo
      .list(userId)
      .then((list) => {
        if (!active) return;
        setNotifications(list);
        AsyncStorage.setItem(cacheKey(userId), JSON.stringify(list)).catch(() => {});
      })
      .catch(() => {
        // Offline — the cached copy stands.
      });
    return () => {
      active = false;
    };
  }, [repo, status, userId]);

  // Register this device for push whenever the signed-in user or language
  // changes; the locale rides along so the server can compose in-language.
  useEffect(() => {
    if (status !== 'signedIn' || !userId || !repo) return;
    registerForPush(repo, userId, lang).catch(() => {
      // No push on this device — the in-app centre still works.
    });
  }, [lang, repo, status, userId]);

  const persist = useCallback(
    (next: NotificationRecord[]) => {
      setNotifications(next);
      if (userId) AsyncStorage.setItem(cacheKey(userId), JSON.stringify(next)).catch(() => {});
    },
    [userId],
  );

  const markAllRead = useCallback(() => {
    if (!userId || !repo) return;
    if (notifications.every((n) => n.readAt !== null)) return;
    const now = new Date().toISOString();
    persist(notifications.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    repo.markAllRead(userId).catch(() => {});
  }, [notifications, persist, repo, userId]);

  const clearAll = useCallback(() => {
    if (!userId || !repo) return;
    persist([]);
    repo.clearAll(userId).catch(() => {});
  }, [persist, repo, userId]);

  const value = useMemo<NotificationsValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => n.readAt === null).length,
      markAllRead,
      clearAll,
    }),
    [clearAll, markAllRead, notifications],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationsProvider>');
  return ctx;
}
