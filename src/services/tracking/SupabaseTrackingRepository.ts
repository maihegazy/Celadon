import { requireSupabase } from '../supabase';
import {
  CheckInDay,
  CheckInRecord,
  DayRecord,
  DiaryEntryRecord,
  DiarySource,
  MealScanRecord,
  MealSlot,
  TrackingRepository,
} from './types';

/**
 * Supabase-backed store. Row-level security scopes every query to the caller,
 * and all writes are idempotent (upserts keyed on user+day, inserts keyed on
 * a client-generated id) so the offline queue can safely retry them.
 */

/** check_ins columns, in CHECK_IN_METRICS order. */
const METRIC_COLUMNS = ['energy', 'digestion', 'sleep', 'stress', 'joint_comfort', 'overall'] as const;

type CheckInRow = {
  energy: number | null;
  digestion: number | null;
  sleep: number | null;
  stress: number | null;
  joint_comfort: number | null;
  overall: number | null;
  flare: boolean;
  note: string | null;
};

type DiaryRow = {
  id: string;
  logged_at: string;
  slot: MealSlot;
  source: DiarySource;
  name: string;
  calories: number | null;
  celadon_score: number | null;
  protein_g: number | string | null;
  carbs_g: number | string | null;
  fat_g: number | string | null;
  fibre_g: number | string | null;
  scan_id: string | null;
};

/** Numeric columns can arrive as strings depending on the driver. */
const toNumber = (value: number | string | null): number | null => {
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const rowToCheckIn = (row: CheckInRow): CheckInRecord => {
  const values: Record<number, number> = {};
  METRIC_COLUMNS.forEach((column, index) => {
    if (row[column] !== null) values[index] = row[column] as number;
  });
  return { values, flare: row.flare, note: row.note ?? '' };
};

const checkInToRow = (checkIn: CheckInRecord): CheckInRow => {
  const row = { flare: checkIn.flare, note: checkIn.note.trim() || null } as CheckInRow;
  METRIC_COLUMNS.forEach((column, index) => {
    row[column] = checkIn.values[index] ?? null;
  });
  return row;
};

const rowToEntry = (row: DiaryRow): DiaryEntryRecord => ({
  id: row.id,
  loggedAt: row.logged_at,
  slot: row.slot,
  source: row.source,
  name: row.name,
  calories: row.calories,
  score: row.celadon_score,
  proteinG: toNumber(row.protein_g),
  carbsG: toNumber(row.carbs_g),
  fatG: toNumber(row.fat_g),
  fibreG: toNumber(row.fibre_g),
  scanId: row.scan_id,
});

const entryToRow = (userId: string, day: string, entry: DiaryEntryRecord) => ({
  id: entry.id,
  user_id: userId,
  logged_on: day,
  logged_at: entry.loggedAt,
  slot: entry.slot,
  source: entry.source,
  name: entry.name,
  calories: entry.calories,
  celadon_score: entry.score,
  protein_g: entry.proteinG,
  carbs_g: entry.carbsG,
  fat_g: entry.fatG,
  fibre_g: entry.fibreG,
  scan_id: entry.scanId,
});

export class SupabaseTrackingRepository implements TrackingRepository {
  async loadDay(userId: string, day: string): Promise<DayRecord> {
    const client = requireSupabase();
    const [checkIn, water, entries] = await Promise.all([
      client
        .from('check_ins')
        .select('energy, digestion, sleep, stress, joint_comfort, overall, flare, note')
        .eq('user_id', userId)
        .eq('checked_on', day)
        .maybeSingle<CheckInRow>(),
      client
        .from('water_logs')
        .select('glasses')
        .eq('user_id', userId)
        .eq('logged_on', day)
        .maybeSingle<{ glasses: number }>(),
      client
        .from('diary_entries')
        .select('id, logged_at, slot, source, name, calories, celadon_score, protein_g, carbs_g, fat_g, fibre_g, scan_id')
        .eq('user_id', userId)
        .eq('logged_on', day)
        .order('logged_at', { ascending: true })
        .returns<DiaryRow[]>(),
    ]);

    // A missing row just means nothing was logged; a query error is real.
    if (checkIn.error) throw checkIn.error;
    if (water.error) throw water.error;
    if (entries.error) throw entries.error;

    return {
      checkIn: checkIn.data ? rowToCheckIn(checkIn.data) : null,
      water: water.data?.glasses ?? null,
      entries: (entries.data ?? []).map(rowToEntry),
    };
  }

  async saveCheckIn(userId: string, day: string, checkIn: CheckInRecord): Promise<void> {
    const { error } = await requireSupabase()
      .from('check_ins')
      .upsert(
        { user_id: userId, checked_on: day, ...checkInToRow(checkIn) },
        { onConflict: 'user_id,checked_on' },
      );
    if (error) throw error;
  }

  async saveWater(userId: string, day: string, glasses: number): Promise<void> {
    const { error } = await requireSupabase()
      .from('water_logs')
      .upsert({ user_id: userId, logged_on: day, glasses }, { onConflict: 'user_id,logged_on' });
    if (error) throw error;
  }

  async addEntry(userId: string, day: string, entry: DiaryEntryRecord): Promise<void> {
    const { error } = await requireSupabase()
      .from('diary_entries')
      .upsert(entryToRow(userId, day, entry), { onConflict: 'id' });
    if (error) throw error;
  }

  async logScan(
    userId: string,
    day: string,
    scan: MealScanRecord,
    entry: DiaryEntryRecord,
  ): Promise<void> {
    // The scan row first — the diary entry references it. Both upsert on
    // client ids, so an offline replay that got halfway through is safe.
    const scanWrite = await requireSupabase()
      .from('meal_scans')
      .upsert(
        {
          id: scan.id,
          user_id: userId,
          created_at: scan.createdAt,
          dish: scan.dish,
          celadon_score: scan.score,
          classification: scan.classification,
          confidence: scan.confidence,
          summary: scan.summary,
          calories: scan.calories,
          protein_g: scan.proteinG,
          carbs_g: scan.carbsG,
          fat_g: scan.fatG,
          fibre_g: scan.fibreG,
          portion: scan.portion,
          separate_items: scan.separateItems,
          ingredients: scan.ingredients,
          substitutions: scan.substitutions,
          locale: scan.locale,
        },
        { onConflict: 'id' },
      );
    if (scanWrite.error) throw scanWrite.error;
    await this.addEntry(userId, day, entry);
  }

  async removeEntry(userId: string, _day: string, entryId: string): Promise<void> {
    const { error } = await requireSupabase().from('diary_entries').delete().eq('id', entryId);
    if (error) throw error;
  }

  async loadCheckInRange(userId: string, fromDay: string, toDay: string): Promise<CheckInDay[]> {
    const { data, error } = await requireSupabase()
      .from('check_ins')
      .select('checked_on, energy, digestion, sleep, stress, joint_comfort, overall, flare, note')
      .eq('user_id', userId)
      .gte('checked_on', fromDay)
      .lte('checked_on', toDay)
      .order('checked_on', { ascending: true })
      .returns<(CheckInRow & { checked_on: string })[]>();
    if (error) throw error;
    return (data ?? []).map((row) => ({ ...rowToCheckIn(row), day: row.checked_on }));
  }
}
