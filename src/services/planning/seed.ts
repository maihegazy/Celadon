import * as Crypto from 'expo-crypto';
import { GROCERY_CATEGORIES } from '../../data/content';
import { en } from '../../i18n/en';
import { ar } from '../../i18n/ar';
import type { TranslationKey } from '../../i18n';
import { GroceryItemRecord } from './types';

/**
 * The standard shopping list a fresh week starts with, resolved into both
 * languages so the stored rows are self-contained. Deriving the list from
 * the generated meals needs per-recipe ingredients for the whole catalogue —
 * the database has them for one recipe so far — so until that content lands,
 * the curated staples list is the honest starting point.
 */

const inEnglish = (key: TranslationKey): string => en[key];
const inArabic = (key: TranslationKey): string | null => ar[key] ?? null;

/** 'groceryCat.produce' → 'produce'. */
const categorySlug = (key: TranslationKey): string => key.split('.').pop() as string;

export function buildGroceryItems(): GroceryItemRecord[] {
  let position = 0;
  return GROCERY_CATEGORIES.flatMap((category) =>
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
}
