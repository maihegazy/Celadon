import { useEffect, useState } from 'react';
import { useAuth } from '../services/auth';
import { useTrackingRepository } from '../services/tracking';
import { CheckInDay, todayISO } from '../services/tracking/types';

/** The stress scale reads the other way: more is worse. */
const INVERTED_METRIC_INDEX = 3;
const METRIC_COUNT = 6;
const SCALE_MAX = 4;

/**
 * A day's "calm score", 0–100 — the average of the six check-in scales with
 * stress inverted. Presented as an observation of how the person said they
 * felt; never as a grade.
 */
export function calmScore(checkIn: CheckInDay): number {
  let total = 0;
  let counted = 0;
  for (let metric = 0; metric < METRIC_COUNT; metric++) {
    const value = checkIn.values[metric];
    if (value === undefined) continue;
    total += metric === INVERTED_METRIC_INDEX ? SCALE_MAX - value : value;
    counted += 1;
  }
  if (counted === 0) return 0;
  return Math.round((total / (counted * SCALE_MAX)) * 100);
}

const isoDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return todayISO(date);
};

/**
 * The last `days` calendar days of check-ins, oldest first, one slot per day
 * (null where none was made). Loaded once per mount from the tracking
 * repository — remote when reachable, the device cache otherwise.
 */
export function useCheckInHistory(days: number) {
  const { session } = useAuth();
  const repository = useTrackingRepository();
  const userId = session?.user.id ?? null;

  const [history, setHistory] = useState<(CheckInDay | null)[] | null>(null);

  useEffect(() => {
    if (!userId) {
      setHistory(null);
      return;
    }
    let active = true;
    (async () => {
      try {
        const from = isoDaysAgo(days - 1);
        const found = await repository.loadCheckInRange(userId, from, todayISO());
        if (!active) return;
        const byDay = new Map(found.map((checkIn) => [checkIn.day, checkIn]));
        setHistory(
          Array.from({ length: days }, (_, i) => byDay.get(isoDaysAgo(days - 1 - i)) ?? null),
        );
      } catch {
        if (active) setHistory(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [days, repository, userId]);

  return history;
}
