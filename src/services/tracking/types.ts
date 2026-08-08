/**
 * What the user logs day by day: the check-in, water, and the food diary.
 * Mirrors the `check_ins`, `water_logs` and `diary_entries` tables.
 */

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type DiarySource = 'scan' | 'manual' | 'plan';

/** One day's check-in. `values` is keyed by CHECK_IN_METRICS index. */
export type CheckInRecord = {
  values: Record<number, number>;
  flare: boolean;
  note: string;
};

export type DiaryEntryRecord = {
  /** Client-generated UUID, so offline writes keep their identity when synced. */
  id: string;
  /** ISO timestamp of when the food was logged. */
  loggedAt: string;
  slot: MealSlot;
  source: DiarySource;
  /** Display text as the user saw it when logging. */
  name: string;
  calories: number | null;
  /** Celadon score 0–100, when known. */
  score: number | null;
};

/** Everything logged on one calendar day. */
export type DayRecord = {
  checkIn: CheckInRecord | null;
  /** Glasses of water, or null if none logged yet. */
  water: number | null;
  entries: DiaryEntryRecord[];
};

export const EMPTY_DAY: DayRecord = { checkIn: null, water: null, entries: [] };

/**
 * Store for a user's daily logs. Days are addressed by local calendar date
 * (YYYY-MM-DD) — a check-in belongs to the day the user made it, wherever
 * they were.
 */
export interface TrackingRepository {
  loadDay(userId: string, day: string): Promise<DayRecord>;
  saveCheckIn(userId: string, day: string, checkIn: CheckInRecord): Promise<void>;
  saveWater(userId: string, day: string, glasses: number): Promise<void>;
  addEntry(userId: string, day: string, entry: DiaryEntryRecord): Promise<void>;
  removeEntry(userId: string, day: string, entryId: string): Promise<void>;
  /** Pushes any writes that were queued while offline. No-op by default. */
  flush?(userId: string): Promise<void>;
}

/** The local date the app considers "today" (device timezone). */
export function todayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
