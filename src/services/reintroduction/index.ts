import * as Crypto from 'expo-crypto';
import { en } from '../../i18n/en';
import { ar } from '../../i18n/ar';
import type { TranslationKey } from '../../i18n';
import { todayISO } from '../tracking/types';
import { isSupabaseConfigured } from '../supabase';
import { LocalReintroductionRepository } from './LocalReintroductionRepository';
import { OfflineFirstReintroductionRepository } from './OfflineFirstReintroductionRepository';
import { SupabaseReintroductionRepository } from './SupabaseReintroductionRepository';
import { ReintroductionRecord, ReintroductionRepository } from './types';

export * from './types';
export { LocalReintroductionRepository } from './LocalReintroductionRepository';
export { OfflineFirstReintroductionRepository } from './OfflineFirstReintroductionRepository';
export { SupabaseReintroductionRepository } from './SupabaseReintroductionRepository';

let defaultRepository: ReintroductionRepository | null = null;

/** One screen consumes this, so a lazy module singleton stands in for a provider. */
export function getReintroductionRepository(): ReintroductionRepository {
  if (!defaultRepository) {
    defaultRepository = isSupabaseConfigured
      ? new OfflineFirstReintroductionRepository(
          new SupabaseReintroductionRepository(),
          new LocalReintroductionRepository(),
        )
      : new LocalReintroductionRepository();
  }
  return defaultRepository;
}

/** Injected in tests. */
export function setReintroductionRepository(repository: ReintroductionRepository | null) {
  defaultRepository = repository;
}

/* ── first-run ladder ─────────────────────────────────────────────────── */

const LADDER: { nameKey: TranslationKey; foodSlug: string | null; stage: number }[] = [
  { nameKey: 'reintro.item.eggYolks', foodSlug: null, stage: 1 },
  { nameKey: 'reintro.ghee', foodSlug: null, stage: 1 },
  { nameKey: 'reintro.item.whiteRice', foodSlug: null, stage: 1 },
  { nameKey: 'reintro.item.nightshades', foodSlug: 'tomatoes', stage: 2 },
  { nameKey: 'reintro.item.coffee', foodSlug: null, stage: 2 },
];

/**
 * The standard ladder a fresh account starts with, resolved into both
 * languages. The first stage-one food starts in testing right away —
 * an empty tracker teaches nothing.
 */
export function buildReintroductionSeed(): ReintroductionRecord[] {
  return LADDER.map((rung, index) => ({
    id: Crypto.randomUUID(),
    foodSlug: rung.foodSlug,
    nameEn: en[rung.nameKey],
    nameAr: ar[rung.nameKey] ?? en[rung.nameKey],
    stage: rung.stage,
    status: index === 0 ? 'testing' : 'queued',
    trialDays: 5,
    startedOn: index === 0 ? todayISO() : null,
    finishedOn: null,
    position: index,
  }));
}
