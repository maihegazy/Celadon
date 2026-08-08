import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../services/auth';
import {
  buildReintroductionSeed,
  getReintroductionRepository,
  ReintroductionCheckRecord,
  ReintroductionPatch,
  ReintroductionRecord,
  ReintroductionState,
} from '../services/reintroduction';
import { todayISO } from '../services/tracking/types';

/**
 * The reintroduction tracker's state and moves. One food is in testing at a
 * time; a day marked "fine" advances the trial, the last fine day passes the
 * food, a reaction shelves it — and either way the next queued food steps up.
 */
export function useReintroduction() {
  const { session } = useAuth();
  const repository = getReintroductionRepository();
  const userId = session?.user.id ?? null;

  const [data, setData] = useState<ReintroductionState>({ items: [], checks: [] });
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      try {
        let state = await repository.load(userId);
        if (state.items.length === 0) {
          // First visit: set up the standard ladder so there is something
          // to act on, then read back what actually stuck.
          await repository.seed(userId, buildReintroductionSeed());
          state = await repository.load(userId);
        }
        if (active) setData(state);
      } catch {
        // Offline with a cold cache: the screen shows its empty state.
      }
    })();
    return () => {
      active = false;
    };
  }, [repository, userId]);

  const persistUpdate = useCallback(
    (id: string, patch: ReintroductionPatch) => {
      setData((current) => ({
        ...current,
        items: current.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      }));
      if (userId) repository.update(userId, id, patch).catch(() => {});
    },
    [repository, userId],
  );

  const sorted = [...data.items].sort((a, b) => a.stage - b.stage || a.position - b.position);
  const active = sorted.find((item) => item.status === 'testing') ?? null;
  const activeChecks = active
    ? data.checks.filter((check) => check.reintroductionId === active.id)
    : [];
  /** The day being answered today, 1-based and never past the trial length. */
  const activeDay = active ? Math.min(activeChecks.length + 1, active.trialDays) : 0;

  const markDay = useCallback(
    (feltFine: boolean) => {
      const current = dataRef.current;
      const testing = current.items.find((item) => item.status === 'testing');
      if (!testing || !userId) return;
      const dayIndex = current.checks.filter((c) => c.reintroductionId === testing.id).length + 1;

      const check: ReintroductionCheckRecord = {
        id: Crypto.randomUUID(),
        reintroductionId: testing.id,
        dayIndex,
        checkedOn: todayISO(),
        feltFine,
      };
      setData((prev) => ({ ...prev, checks: [...prev.checks, check] }));
      repository.addCheck(userId, check).catch(() => {});

      // A reaction shelves the food; surviving the last day passes it.
      const finished: ReintroductionRecord['status'] | null = !feltFine
        ? 'reacted'
        : dayIndex >= testing.trialDays
          ? 'passed'
          : null;
      if (!finished) return;

      persistUpdate(testing.id, { status: finished, finishedOn: todayISO() });

      const next = [...current.items]
        .sort((a, b) => a.stage - b.stage || a.position - b.position)
        .find((item) => item.status === 'queued' && item.id !== testing.id);
      if (next) persistUpdate(next.id, { status: 'testing', startedOn: todayISO() });
    },
    [persistUpdate, repository, userId],
  );

  return { items: sorted, active, activeDay, markDay };
}
