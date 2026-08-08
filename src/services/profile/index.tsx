import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useMemo } from 'react';
import { isSupabaseConfigured, requireSupabase } from '../supabase';
import {
  PROFILE_COLUMNS,
  ProfileRow,
  profileToRow,
  rowToProfile,
  StoredProfile,
} from './mapping';

export type { StoredProfile } from './mapping';

export interface ProfileRepository {
  load(userId: string): Promise<StoredProfile | null>;
  save(userId: string, profile: StoredProfile): Promise<void>;
}

/** Supabase-backed store. Row-level security limits every query to the caller. */
export class SupabaseProfileRepository implements ProfileRepository {
  async load(userId: string): Promise<StoredProfile | null> {
    const { data, error } = await requireSupabase()
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .maybeSingle<ProfileRow>();

    // A missing row is normal for a brand-new account.
    if (error || !data) return null;
    return rowToProfile(data);
  }

  async save(userId: string, profile: StoredProfile): Promise<void> {
    const { error } = await requireSupabase()
      .from('profiles')
      .upsert({ id: userId, ...profileToRow(profile) });
    if (error) throw error;
  }
}

/** Device-only store, used when no backend is configured. */
export class LocalProfileRepository implements ProfileRepository {
  private key = (userId: string) => `celadon.profile.${userId}`;

  async load(userId: string): Promise<StoredProfile | null> {
    const raw = await AsyncStorage.getItem(this.key(userId));
    return raw ? (JSON.parse(raw) as StoredProfile) : null;
  }

  async save(userId: string, profile: StoredProfile): Promise<void> {
    await AsyncStorage.setItem(this.key(userId), JSON.stringify(profile));
  }
}

export function createDefaultProfileRepository(): ProfileRepository {
  return isSupabaseConfigured ? new SupabaseProfileRepository() : new LocalProfileRepository();
}

const ProfileContext = createContext<ProfileRepository | null>(null);

export function ProfileProvider({
  children,
  repository,
}: {
  children: React.ReactNode;
  repository?: ProfileRepository;
}) {
  const value = useMemo(() => repository ?? createDefaultProfileRepository(), [repository]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfileRepository() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfileRepository must be used inside <ProfileProvider>');
  return ctx;
}
