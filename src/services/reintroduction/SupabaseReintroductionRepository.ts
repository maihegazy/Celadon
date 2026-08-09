import { requireSupabase } from '../supabase';
import {
  ReintroductionCheckRecord,
  ReintroductionPatch,
  ReintroductionRecord,
  ReintroductionRepository,
  ReintroductionState,
  ReintroductionStatus,
} from './types';

type ItemRow = {
  id: string;
  food_slug: string | null;
  name_en: string;
  name_ar: string;
  stage: number;
  status: ReintroductionStatus;
  trial_days: number;
  started_on: string | null;
  finished_on: string | null;
  position: number;
};

type CheckRow = {
  id: string;
  reintroduction_id: string;
  day_index: number;
  checked_on: string;
  felt_fine: boolean;
};

const rowToItem = (row: ItemRow): ReintroductionRecord => ({
  id: row.id,
  foodSlug: row.food_slug,
  nameEn: row.name_en,
  nameAr: row.name_ar,
  stage: row.stage,
  status: row.status,
  trialDays: row.trial_days,
  startedOn: row.started_on,
  finishedOn: row.finished_on,
  position: row.position,
});

/** Row-level security scopes everything to the caller; writes upsert on
 * client-generated ids so offline retries stay idempotent. */
export class SupabaseReintroductionRepository implements ReintroductionRepository {
  async load(userId: string): Promise<ReintroductionState> {
    const client = requireSupabase();
    const [items, checks] = await Promise.all([
      client
        .from('reintroductions')
        .select('id, food_slug, name_en, name_ar, stage, status, trial_days, started_on, finished_on, position')
        .eq('user_id', userId)
        .order('stage', { ascending: true })
        .order('position', { ascending: true })
        .returns<ItemRow[]>(),
      client
        .from('reintroduction_checks')
        .select('id, reintroduction_id, day_index, checked_on, felt_fine')
        .eq('user_id', userId)
        .order('day_index', { ascending: true })
        .returns<CheckRow[]>(),
    ]);
    if (items.error) throw items.error;
    if (checks.error) throw checks.error;

    return {
      items: (items.data ?? []).map(rowToItem),
      checks: (checks.data ?? []).map((row) => ({
        id: row.id,
        reintroductionId: row.reintroduction_id,
        dayIndex: row.day_index,
        checkedOn: row.checked_on,
        feltFine: row.felt_fine,
      })),
    };
  }

  async seed(userId: string, items: ReintroductionRecord[]): Promise<void> {
    const client = requireSupabase();
    // Another device may have seeded already — leave an existing ladder alone.
    const existing = await client
      .from('reintroductions')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    if (existing.error) throw existing.error;
    if ((existing.data ?? []).length > 0) return;

    const { error } = await client.from('reintroductions').upsert(
      items.map((item) => ({
        id: item.id,
        user_id: userId,
        food_slug: item.foodSlug,
        name_en: item.nameEn,
        name_ar: item.nameAr,
        stage: item.stage,
        status: item.status,
        trial_days: item.trialDays,
        started_on: item.startedOn,
        finished_on: item.finishedOn,
        position: item.position,
      })),
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (error) throw error;
  }

  async update(userId: string, id: string, patch: ReintroductionPatch): Promise<void> {
    const row: Record<string, unknown> = {};
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.startedOn !== undefined) row.started_on = patch.startedOn;
    if (patch.finishedOn !== undefined) row.finished_on = patch.finishedOn;
    const { error } = await requireSupabase().from('reintroductions').update(row).eq('id', id);
    if (error) throw error;
  }

  async addCheck(userId: string, check: ReintroductionCheckRecord): Promise<void> {
    const { error } = await requireSupabase()
      .from('reintroduction_checks')
      .upsert(
        {
          id: check.id,
          reintroduction_id: check.reintroductionId,
          user_id: userId,
          day_index: check.dayIndex,
          checked_on: check.checkedOn,
          felt_fine: check.feltFine,
        },
        { onConflict: 'id', ignoreDuplicates: true },
      );
    if (error) throw error;
  }
}
