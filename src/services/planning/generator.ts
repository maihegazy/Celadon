import * as Crypto from 'expo-crypto';
import { en } from '../../i18n/en';
import { ar } from '../../i18n/ar';
import type { TranslationKey } from '../../i18n';
import type { RecipeSummary } from '../content/types';
import type { MealSlot } from '../tracking/types';
import { PlannedMealRecord } from './types';

/**
 * The week generator — the first version of the roadmap's "plan generation".
 *
 * Deliberately a pure, deterministic function (given a salt): the same
 * profile and catalogue always produce the same week, which makes it
 * testable, and a new salt is all "regenerate" means. It filters the recipe
 * catalogue by what the person avoids, leans toward the cuisines they chose,
 * rotates so no two consecutive days repeat a main meal, and fills snack
 * slots from a small bilingual list. As the catalogue grows past six
 * recipes, the same rules simply get more room to work with.
 */

export type GeneratorProfile = {
  /** Avoid slugs, e.g. 'legumes', 'dairy' — see AVOID_SLUGS. */
  avoids: string[];
  /** Cuisine slugs the person prefers, e.g. 'egyptian'. */
  cuisines: string[];
  /** Index into MEAL_PATTERN_SLUGS: two, three, three_plus_snacks, four_five_small. */
  mealsPerDay: number;
};

/** Meal slots for each meals-per-day pattern, in day order. */
const PATTERN_SLOTS: MealSlot[][] = [
  ['lunch', 'dinner'],
  ['breakfast', 'lunch', 'dinner'],
  ['breakfast', 'lunch', 'snack', 'dinner'],
  ['breakfast', 'lunch', 'snack', 'dinner', 'snack'],
];

/**
 * What each seeded recipe contains, in AVOID_SLUGS terms. Lives client-side
 * for the six launch recipes; when the catalogue grows this belongs on the
 * recipe rows as tags so content ships without app releases.
 */
const RECIPE_CONTAINS: Record<string, string[]> = {
  'salmon-quinoa-bowl': [],
  'molokhia-grilled-chicken': [],
  'zaatar-baked-cod': [],
  'shorbet-ads': ['legumes'],
  'bessara-greens': ['legumes'],
  'ginger-carrot-soup': [],
};

/** Snack rotation — bilingual, no recipe behind them, and that's fine. */
const SNACKS: TranslationKey[] = ['meal.walnutsDates', 'food.labneh', 'food.dates'];

const addDays = (iso: string, days: number): string => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** True when nothing in the recipe clashes with what the person avoids. */
const suits = (recipe: RecipeSummary, avoids: string[]): boolean => {
  const contains = RECIPE_CONTAINS[recipe.slug] ?? [];
  return !contains.some((allergen) => avoids.includes(allergen));
};

export function generateWeekMeals(
  weekStart: string,
  recipes: RecipeSummary[],
  profile: GeneratorProfile,
  salt = 0,
): PlannedMealRecord[] {
  const slots = PATTERN_SLOTS[profile.mealsPerDay] ?? PATTERN_SLOTS[1];

  // Hard constraints first; if they empty the pool (an extreme avoid list),
  // fall back to the full catalogue — an imperfect week the person can swap
  // beats an empty one.
  const eligible = recipes.filter((recipe) => suits(recipe, profile.avoids));
  const pool = eligible.length > 0 ? eligible : recipes;

  // Soft preferences order the pool: preferred cuisines first, then score.
  const ranked = [...pool].sort((a, b) => {
    const cuisineA = a.cuisine && profile.cuisines.includes(a.cuisine) ? 1 : 0;
    const cuisineB = b.cuisine && profile.cuisines.includes(b.cuisine) ? 1 : 0;
    return cuisineB - cuisineA || b.score - a.score;
  });
  // Breakfast wants something quick; the rest of the ranking still applies.
  const breakfasts = [...ranked].sort((a, b) => (a.minutes <= 15 ? 0 : 1) - (b.minutes <= 15 ? 0 : 1));

  const meals: PlannedMealRecord[] = [];
  for (let day = 0; day < 7; day++) {
    const usedToday = new Set<string>();
    let mainIndex = 0;
    let snackIndex = 0;

    slots.forEach((slot, position) => {
      if (slot === 'snack') {
        const nameKey = SNACKS[(day + salt + snackIndex++) % SNACKS.length];
        meals.push({
          id: Crypto.randomUUID(),
          scheduledOn: addDays(weekStart, day),
          slot,
          position,
          recipeId: null,
          nameEn: en[nameKey],
          nameAr: ar[nameKey] ?? en[nameKey],
          completed: false,
        });
        return;
      }

      // Rotate the ranked list by day and salt so the week varies but two
      // slots on one day never serve the same dish.
      const source = slot === 'breakfast' ? breakfasts : ranked;
      let pick = source[0];
      for (let probe = 0; probe < source.length; probe++) {
        const candidate = source[(day + salt + mainIndex + probe) % source.length];
        if (!usedToday.has(candidate.slug)) {
          pick = candidate;
          break;
        }
      }
      mainIndex += 1;
      usedToday.add(pick.slug);

      meals.push({
        id: Crypto.randomUUID(),
        scheduledOn: addDays(weekStart, day),
        slot,
        position,
        // Bundled-catalogue ids aren't database rows; the write layer nulls
        // them out, and the stored names stand alone either way.
        recipeId: pick.id,
        nameEn: pick.nameEn,
        nameAr: pick.nameAr,
        completed: false,
      });
    });
  }
  return meals;
}
