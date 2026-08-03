import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useMemo } from 'react';
import type { ComfortMode } from '../../state/AppState';
import { isSupabaseConfigured, requireSupabase } from '../supabase';

/**
 * The health profile — the answers from the assessment, plus the two settings
 * that change how the app talks to this person.
 *
 * Stored as one JSON document per user. It's small, it's read and written as a
 * whole, and keeping it in a single column means adding a question later
 * doesn't need a migration.
 */
export type StoredProfile = {
  goal: number;
  conditions: Record<number, boolean>;
  concerns: Record<number, boolean>;
  avoids: Record<number, boolean>;
  cuisines: Record<number, boolean>;
  country: number;
  activity: number;
  mealsPerDay: number;
  weightGoal: number;
  comfort: ComfortMode;
  /** False until the assessment has been completed once. */
  onboardingComplete: boolean;
};

export interface ProfileRepository {
  load(userId: string): Promise<StoredProfile | null>;
  save(userId: string, profile: StoredProfile): Promise<void>;
}

/** Supabase-backed store. Row-level security limits every query to the caller. */
export class SupabaseProfileRepository implements ProfileRepository {
  async load(userId: string): Promise<StoredProfile | null> {
    const { data, error } = await requireSupabase()
      .from('profiles')
      .select('assessment')
      .eq('id', userId)
      .maybeSingle();

    // A missing row is normal for a brand-new account.
    if (error || !data?.assessment) return null;
    return data.assessment as StoredProfile;
  }

  async save(userId: string, profile: StoredProfile): Promise<void> {
    await requireSupabase()
      .from('profiles')
      .upsert({ id: userId, assessment: profile, updated_at: new Date().toISOString() });
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
