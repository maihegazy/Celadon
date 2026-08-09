/**
 * The week's meal plan and the shopping list built from it. Mirrors the
 * `meal_plans`, `planned_meals`, `grocery_lists` and `grocery_items` tables.
 *
 * Until plan generation lands, a week is materialised once from the bundled
 * demo content — after that every tick, dismissal and custom item is real,
 * owned by the user, and survives a reinstall.
 */

import type { MealSlot } from '../tracking/types';

export type PlannedMealRecord = {
  /** Client-generated UUID; stable across offline retries. */
  id: string;
  /** ISO date the meal is planned for. */
  scheduledOn: string;
  slot: MealSlot;
  /** Order within the day. */
  position: number;
  /** The catalogue recipe behind the meal, when there is one. */
  recipeId: string | null;
  nameEn: string;
  nameAr: string | null;
  completed: boolean;
};

export type GroceryItemRecord = {
  id: string;
  /** Category slug — 'produce', 'protein', 'pantry', 'herbs'. */
  category: string;
  nameEn: string;
  nameAr: string | null;
  quantityEn: string | null;
  quantityAr: string | null;
  position: number;
  checked: boolean;
  /** "Already have it" — hidden without deleting history. */
  dismissed: boolean;
  isCustom: boolean;
};

export type WeekPlanRecord = {
  planId: string;
  listId: string;
  weekStart: string;
  meals: PlannedMealRecord[];
  items: GroceryItemRecord[];
};

export interface PlanningRepository {
  /** The stored week, or null if nothing has been materialised for it yet. */
  loadWeek(userId: string, weekStart: string): Promise<WeekPlanRecord | null>;
  /**
   * Creates the week from a client-built seed. Idempotent: ids are supplied
   * by the caller, and a week that already exists is left untouched.
   */
  ensureWeek(userId: string, week: WeekPlanRecord): Promise<void>;
  setMealCompleted(userId: string, mealId: string, completed: boolean): Promise<void>;
  /** Points an existing planned meal at a different dish. */
  swapMeal(
    userId: string,
    mealId: string,
    dish: { recipeId: string | null; nameEn: string; nameAr: string | null },
  ): Promise<void>;
  /** Replaces the week's meals wholesale — what "regenerate" means. */
  replaceMeals(userId: string, planId: string, weekStart: string, meals: PlannedMealRecord[]): Promise<void>;
  setItemChecked(userId: string, itemId: string, checked: boolean): Promise<void>;
  dismissItem(userId: string, itemId: string): Promise<void>;
  addItem(userId: string, listId: string, item: GroceryItemRecord): Promise<void>;
  /** Pushes any writes queued while offline. No-op by default. */
  flush?(userId: string): Promise<void>;
}

/** The design's week runs Sunday to Saturday. */
export function weekStartISO(now = new Date()): string {
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, '0');
  const d = String(start.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
