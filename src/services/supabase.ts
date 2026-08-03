import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

/**
 * Supabase client.
 *
 * Configured through public env vars — the anon key is designed to be shipped
 * in the app; every table is protected by row-level security instead, so a
 * user can only ever read or write their own rows. The service-role key must
 * never appear in this repo.
 *
 * Without credentials the app runs on local implementations (see
 * `LocalAuthService`), which keeps the prototype walkable offline.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: AsyncStorage,
        // Sessions survive relaunches and refresh themselves in the background.
        autoRefreshToken: true,
        persistSession: true,
        // React Native has no URL to parse a session out of; OAuth callbacks
        // are handled explicitly in the auth service instead.
        detectSessionInUrl: false,
      },
    })
  : null;

/** Narrowing helper for the code paths that require a live client. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}
