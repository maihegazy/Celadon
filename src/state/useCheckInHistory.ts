import { useEffect, useState } from 'react';
import { useAuth } from '../services/auth';
import { useTrackingRepository } from '../services/tracking';
import { CheckInDay, todayISO } from '../services/tracking/types';

// The score itself lives with the insight rules so both unit-test purely.
export { calmScore } from '../services/insights/compute';

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
