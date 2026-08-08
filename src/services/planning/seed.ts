import * as Crypto from 'expo-crypto';
import { GROCERY_CATEGORIES, MEALS } from '../../data/content';
import { en } from '../../i18n/en';
import { ar } from '../../i18n/ar';
import type { TranslationKey } from '../../i18n';
import { todayISO } from '../tracking/types';
import { GroceryItemRecord, PlannedMealRecord, WeekPlanRecord } from './types';

/**
 * Builds a week from the bundled demo content, resolving each translation
 * key into both languages so the stored rows are self-contained — exactly
 * the shape plan generation will produce once it exists.
 */

const inEnglish = (key: TranslationKey): string => en[key];
const inArabic = (key: TranslationKey): string | null => ar[key] ?? null;

/** 'groceryCat.produce' → 'produce'. */
const categorySlug = (key: TranslationKey): string => key.split('.').pop() as string;

/** 'slot.breakfast' → 'breakfast'. */
const slotSlug = (key: TranslationKey) => key.split('.').pop() as PlannedMealRecord['slot'];

export function buildWeekSeed(weekStart: string): WeekPlanRecord {
  const meals: PlannedMealRecord[] = MEALS.map((meal, position) => ({
    id: Crypto.randomUUID(),
    scheduledOn: todayISO(),
    slot: slotSlug(meal.slot),
    position,
    nameEn: inEnglish(meal.name),
    nameAr: inArabic(meal.name),
    completed: false,
  }));

  let position = 0;
  const items: GroceryItemRecord[] = GROCERY_CATEGORIES.flatMap((category) =>
    category.items.map((item) => ({
      id: Crypto.randomUUID(),
      category: categorySlug(category.name),
      nameEn: inEnglish(item.name),
      nameAr: inArabic(item.name),
      quantityEn: item.qty ? inEnglish(item.qty) : null,
      quantityAr: item.qty ? inArabic(item.qty) : null,
      position: position++,
      checked: false,
      dismissed: false,
      isCustom: false,
    })),
  );

  return {
    planId: Crypto.randomUUID(),
    listId: Crypto.randomUUID(),
    weekStart,
    meals,
    items,
  };
}
