import React, { createContext, useContext, useMemo } from 'react';
import { isSupabaseConfigured } from '../supabase';
import { LocalTrackingRepository } from './LocalTrackingRepository';
import { OfflineFirstTrackingRepository } from './OfflineFirstTrackingRepository';
import { SupabaseTrackingRepository } from './SupabaseTrackingRepository';
import { TrackingRepository } from './types';

export * from './types';
export { LocalTrackingRepository } from './LocalTrackingRepository';
export { OfflineFirstTrackingRepository } from './OfflineFirstTrackingRepository';
export { SupabaseTrackingRepository } from './SupabaseTrackingRepository';

export function createDefaultTrackingRepository(): TrackingRepository {
  return isSupabaseConfigured
    ? new OfflineFirstTrackingRepository(new SupabaseTrackingRepository(), new LocalTrackingRepository())
    : new LocalTrackingRepository();
}

const TrackingContext = createContext<TrackingRepository | null>(null);

export function TrackingProvider({
  children,
  repository,
}: {
  children: React.ReactNode;
  repository?: TrackingRepository;
}) {
  const value = useMemo(() => repository ?? createDefaultTrackingRepository(), [repository]);
  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>;
}

export function useTrackingRepository() {
  const ctx = useContext(TrackingContext);
  if (!ctx) throw new Error('useTrackingRepository must be used inside <TrackingProvider>');
  return ctx;
}
