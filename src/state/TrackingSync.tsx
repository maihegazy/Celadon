import * as Crypto from 'expo-crypto';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { AppState as RNAppState } from 'react-native';
import { useAuth } from '../services/auth';
import { useTrackingRepository } from '../services/tracking';
import { DiaryEntryRecord, MealSlot, todayISO } from '../services/tracking/types';
import { useAppState } from './AppState';

/**
 * Keeps today's logs — check-in, water, diary — in step with the account.
 *
 * On sign-in (and again when the app returns to the foreground on a new day)
 * it loads today's records into the store. Writes go through the tracking
 * repository, which is offline-first: the UI updates instantly and the
 * backend catches up when it can.
 */

type TrackingValue = {
  /** Upserts today's check-in from what's currently in the store. */
  saveCheckIn: () => void;
  /** Sets today's water count; persisted after a short debounce. */
  setWater: (glasses: number) => void;
  /** Logs a food to today's diary. Returns the new entry. */
  addFood: (food: {
    name: string;
    slot?: MealSlot;
    calories?: number | null;
    score?: number | null;
  }) => DiaryEntryRecord;
  /** Removes a persisted diary entry. */
  removeEntry: (id: string) => void;
};

const TrackingSyncContext = createContext<TrackingValue | null>(null);

const WATER_DEBOUNCE_MS = 800;

export function TrackingSyncProvider({ children }: { children: React.ReactNode }) {
  const { session, status } = useAuth();
  const repository = useTrackingRepository();
  const { state, dispatch, set } = useAppState();

  const userId = session?.user.id ?? null;
  const stateRef = useRef(state);
  stateRef.current = state;
  // The day currently hydrated; also stamps writes so a save that fires just
  // after midnight still lands on the day the user saw on screen.
  const dayRef = useRef(todayISO());
  const hydratedFor = useRef<string | null>(null);

  const hydrate = useCallback(
    async (targetUserId: string) => {
      const day = todayISO();
      dayRef.current = day;
      try {
        const data = await repository.loadDay(targetUserId, day);
        // The account may have changed while the load was in flight.
        if (hydratedFor.current !== targetUserId) return;
        dispatch({
          type: 'set',
          patch: {
            // A day with no check-in row starts unsaved; the slider defaults
            // stay, ready for the first tap.
            ...(data.checkIn
              ? {
                  checkInValues: data.checkIn.values,
                  flare: data.checkIn.flare,
                  checkInNote: data.checkIn.note,
                  checkInSaved: true,
                }
              : { checkInSaved: false }),
            water: data.water ?? 0,
            diaryEntries: data.entries,
          },
        });
      } catch {
        // Offline with a cold cache: the in-memory defaults still work.
      }
    },
    [dispatch, repository],
  );

  // Load today's records once per signed-in account.
  useEffect(() => {
    if (status !== 'signedIn' || !userId || hydratedFor.current === userId) return;
    hydratedFor.current = userId;
    hydrate(userId);
  }, [hydrate, status, userId]);

  useEffect(() => {
    if (status === 'signedOut') hydratedFor.current = null;
  }, [status]);

  // On foreground: push anything queued while offline, and if the calendar
  // day has rolled over, start the new day fresh.
  useEffect(() => {
    if (!userId) return;
    const subscription = RNAppState.addEventListener('change', (appState) => {
      if (appState !== 'active') return;
      if (todayISO() !== dayRef.current) hydrate(userId);
      else repository.flush?.(userId).catch(() => {});
    });
    return () => subscription.remove();
  }, [hydrate, repository, userId]);

  const waterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (waterTimer.current) clearTimeout(waterTimer.current);
  }, []);

  const value = useMemo<TrackingValue>(() => {
    const persist = (write: (uid: string) => Promise<void>) => {
      if (!userId) return; // Signed out: the in-memory store is all there is.
      write(userId).catch(() => {
        // The repository has already cached and queued what it could.
      });
    };

    return {
      saveCheckIn: () => {
        const { checkInValues, flare, checkInNote } = stateRef.current;
        set({ checkInSaved: true });
        persist((uid) =>
          repository.saveCheckIn(uid, dayRef.current, {
            values: checkInValues,
            flare,
            note: checkInNote,
          }),
        );
      },

      setWater: (glasses: number) => {
        set({ water: glasses });
        if (waterTimer.current) clearTimeout(waterTimer.current);
        waterTimer.current = setTimeout(() => {
          persist((uid) => repository.saveWater(uid, dayRef.current, glasses));
        }, WATER_DEBOUNCE_MS);
      },

      addFood: ({ name, slot = 'snack', calories = null, score = null }) => {
        const entry: DiaryEntryRecord = {
          id: Crypto.randomUUID(),
          loggedAt: new Date().toISOString(),
          slot,
          source: 'manual',
          name,
          calories,
          score,
        };
        dispatch({ type: 'addDiaryEntry', entry });
        persist((uid) => repository.addEntry(uid, dayRef.current, entry));
        return entry;
      },

      removeEntry: (id: string) => {
        dispatch({ type: 'removeDiaryEntryById', id });
        persist((uid) => repository.removeEntry(uid, dayRef.current, id));
      },
    };
  }, [dispatch, repository, set, userId]);

  return <TrackingSyncContext.Provider value={value}>{children}</TrackingSyncContext.Provider>;
}

export function useTracking() {
  const ctx = useContext(TrackingSyncContext);
  if (!ctx) throw new Error('useTracking must be used inside <TrackingSyncProvider>');
  return ctx;
}
