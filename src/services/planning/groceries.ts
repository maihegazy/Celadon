import * as Crypto from 'expo-crypto';
import type { FoodRecord, RecipeDetail } from '../content/types';
import type { GroceryItemRecord, PlannedMealRecord } from './types';

/**
 * Builds the week's shopping list from the recipes the generator actually
 * planned — each ingredient once, quantities summed across the meals that
 * use it, categorised through the foods catalogue. Pure, so the aggregation
 * rules unit-test directly.
 */

/** The design's four shopping groups, in display order. */
const GROCERY_CATEGORY_ORDER = ['produce', 'protein', 'pantry', 'herbs'] as const;

/** foods.category → shopping group. Unknown or absent categories read as fresh. */
const FOOD_CATEGORY_TO_GROCERY: Record<string, string> = {
  greens: 'produce',
  produce: 'produce',
  fish: 'protein',
  dairy: 'protein',
  grains: 'pantry',
  legumes: 'pantry',
  nuts: 'pantry',
  pantry: 'pantry',
  drinks: 'pantry',
  spices: 'herbs',
};

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const arabicDigits = (value: string): string =>
  value.replace(/\./g, '٫').replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]);

/** 480.00000000000006 → '480'; 1.5 stays '1.5'. */
const trimmed = (value: number): string => String(Math.round(value * 10) / 10);

type Aggregate = {
  nameEn: string;
  nameAr: string | null;
  category: string;
  unitEn: string | null;
  unitAr: string | null;
  /** Sum across meals; null once any occurrence had no usable quantity. */
  quantity: number | null;
  /** How many planned meals want this ingredient. */
  mentions: number;
};

export function buildGroceryItemsFromPlan(
  meals: PlannedMealRecord[],
  details: Map<string, RecipeDetail>,
  foods: FoodRecord[],
): GroceryItemRecord[] {
  const foodBySlug = new Map(foods.map((food) => [food.slug, food]));

  // How many times each recipe is cooked this week.
  const timesCooked = new Map<string, number>();
  for (const meal of meals) {
    if (!meal.recipeId) continue;
    timesCooked.set(meal.recipeId, (timesCooked.get(meal.recipeId) ?? 0) + 1);
  }

  const aggregates = new Map<string, Aggregate>();
  for (const [recipeId, count] of timesCooked) {
    const detail = details.get(recipeId);
    if (!detail) continue;
    for (const ingredient of detail.ingredients) {
      const key = ingredient.nameEn.trim().toLowerCase();
      const food = ingredient.foodSlug ? foodBySlug.get(ingredient.foodSlug) : undefined;
      const category =
        (food?.category && FOOD_CATEGORY_TO_GROCERY[food.category]) || 'produce';

      const existing = aggregates.get(key);
      if (!existing) {
        aggregates.set(key, {
          nameEn: ingredient.nameEn,
          nameAr: ingredient.nameAr,
          category,
          unitEn: ingredient.unitEn,
          unitAr: ingredient.unitAr,
          quantity: ingredient.quantity === null ? null : ingredient.quantity * count,
          mentions: count,
        });
        continue;
      }
      existing.mentions += count;
      // Quantities only add up while every occurrence agrees on the unit.
      if (
        existing.quantity !== null &&
        ingredient.quantity !== null &&
        existing.unitEn === ingredient.unitEn
      ) {
        existing.quantity += ingredient.quantity * count;
      } else {
        existing.quantity = null;
      }
    }
  }

  const ordered = [...aggregates.values()].sort((a, b) => {
    const byCategory =
      GROCERY_CATEGORY_ORDER.indexOf(a.category as (typeof GROCERY_CATEGORY_ORDER)[number]) -
      GROCERY_CATEGORY_ORDER.indexOf(b.category as (typeof GROCERY_CATEGORY_ORDER)[number]);
    return byCategory !== 0 ? byCategory : a.nameEn.localeCompare(b.nameEn);
  });

  return ordered.map((entry, position) => {
    let quantityEn: string | null = null;
    let quantityAr: string | null = null;
    if (entry.quantity !== null) {
      const amount = trimmed(entry.quantity);
      quantityEn = entry.unitEn ? `${amount} ${entry.unitEn}` : amount;
      quantityAr = entry.unitAr
        ? `${arabicDigits(amount)} ${entry.unitAr}`
        : arabicDigits(amount);
    } else if (entry.mentions > 1) {
      // Mixed units — fall back to "for N meals" phrasing-free counts.
      quantityEn = `× ${entry.mentions}`;
      quantityAr = `× ${arabicDigits(String(entry.mentions))}`;
    }
    return {
      id: Crypto.randomUUID(),
      category: entry.category,
      nameEn: entry.nameEn,
      nameAr: entry.nameAr,
      quantityEn,
      quantityAr,
      position,
      checked: false,
      dismissed: false,
      isCustom: false,
    };
  });
}
