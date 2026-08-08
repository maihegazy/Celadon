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
  /* Macro estimates in grams — present when analysis provided them. */
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fibreG: number | null;
  /** The meal_scans row this entry came from, when logged via a scan. */
  scanId: string | null;
};

/** A completed analysis, archived to `meal_scans` when the user logs it. */
export type MealScanRecord = {
  id: string;
  createdAt: string;
  dish: string;
  score: number;
  classification: 'supportive' | 'balanced' | 'limit';
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fibreG: number | null;
  portion: string;
  separateItems: boolean;
  /** Per-ingredient verdicts as returned, already in the user's language. */
  ingredients: unknown[];
  substitutions: unknown[];
  locale: 'en' | 'ar';
};

/** Everything logged on one calendar day. */
export type DayRecord = {
  checkIn: CheckInRecord | null;
  /** Glasses of water, or null if none logged yet. */
  water: number | null;
  entries: DiaryEntryRecord[];
};

/** One day's check-in with its date, for history and trends. */
export type CheckInDay = CheckInRecord & { day: string };

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
  /** Archives a completed analysis and logs its diary entry together. */
  logScan(userId: string, day: string, scan: MealScanRecord, entry: DiaryEntryRecord): Promise<void>;
  /** Check-ins between two dates inclusive, oldest first. Days without one are absent. */
  loadCheckInRange(userId: string, fromDay: string, toDay: string): Promise<CheckInDay[]>;
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
