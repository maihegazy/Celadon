import { generateWeekMeals } from '../generator';
import type { RecipeSummary } from '../../content/types';

/**
 * The week generator is the plan's brain — these tests pin its promises:
 * respect what the person avoids, give every day its slots, vary the week,
 * and never produce an empty plan.
 */

const recipe = (
  slug: string,
  overrides: Partial<RecipeSummary> = {},
): RecipeSummary => ({
  id: `id-${slug}`,
  slug,
  nameEn: slug,
  nameAr: `ar-${slug}`,
  blurbEn: null,
  blurbAr: null,
  whyEn: null,
  whyAr: null,
  minutes: 30,
  baseServings: 2,
  score: 80,
  classification: 'supportive',
  calories: 500,
  cuisine: 'egyptian',
  tags: [],
  ...overrides,
});

const CATALOGUE: RecipeSummary[] = [
  recipe('salmon-quinoa-bowl', { cuisine: 'mediterranean', score: 86, minutes: 25 }),
  recipe('molokhia-grilled-chicken', { score: 88, minutes: 35 }),
  recipe('zaatar-baked-cod', { cuisine: 'levantine', score: 88, minutes: 20 }),
  recipe('shorbet-ads', { score: 82, minutes: 30 }),
  recipe('bessara-greens', { score: 84, minutes: 10 }),
  recipe('ginger-carrot-soup', { cuisine: 'international', score: 80, minutes: 35 }),
];

const WEEK = '2026-08-02'; // a Sunday

describe('generateWeekMeals', () => {
  it('gives every day the slots its meal pattern asks for', () => {
    const meals = generateWeekMeals(WEEK, CATALOGUE, { avoids: [], cuisines: [], mealsPerDay: 1 });

    expect(meals).toHaveLength(21); // three meals × seven days
    const monday = meals.filter((meal) => meal.scheduledOn === '2026-08-03');
    expect(monday.map((meal) => meal.slot)).toEqual(['breakfast', 'lunch', 'dinner']);
  });

  it('adds snack slots for the snacking patterns', () => {
    const meals = generateWeekMeals(WEEK, CATALOGUE, { avoids: [], cuisines: [], mealsPerDay: 2 });
    const day = meals.filter((meal) => meal.scheduledOn === WEEK);
    expect(day.map((meal) => meal.slot)).toEqual(['breakfast', 'lunch', 'snack', 'dinner']);
    // Snacks come from the bilingual list, not the catalogue.
    const snack = day.find((meal) => meal.slot === 'snack');
    expect(snack?.recipeId).toBeNull();
    expect(snack?.nameAr).toBeTruthy();
  });

  it('never plans a dish that clashes with what the person avoids', () => {
    const meals = generateWeekMeals(WEEK, CATALOGUE, {
      avoids: ['legumes'],
      cuisines: [],
      mealsPerDay: 1,
    });
    const names = meals.map((meal) => meal.nameEn);
    expect(names).not.toContain('shorbet-ads');
    expect(names).not.toContain('bessara-greens');
  });

  it('falls back to the full catalogue rather than an empty week', () => {
    const onlyLegumes = [recipe('shorbet-ads'), recipe('bessara-greens')];
    const meals = generateWeekMeals(WEEK, onlyLegumes, {
      avoids: ['legumes'],
      cuisines: [],
      mealsPerDay: 1,
    });
    expect(meals.length).toBeGreaterThan(0);
  });

  it('never serves the same dish twice in one day', () => {
    const meals = generateWeekMeals(WEEK, CATALOGUE, { avoids: [], cuisines: [], mealsPerDay: 3 });
    for (let day = 0; day < 7; day++) {
      const iso = meals[day * 5].scheduledOn;
      const mains = meals
        .filter((meal) => meal.scheduledOn === iso && meal.slot !== 'snack')
        .map((meal) => meal.nameEn);
      expect(new Set(mains).size).toBe(mains.length);
    }
  });

  it('varies main meals across consecutive days', () => {
    const meals = generateWeekMeals(WEEK, CATALOGUE, { avoids: [], cuisines: [], mealsPerDay: 1 });
    const lunches = [0, 1].map(
      (day) =>
        meals.find(
          (meal) => meal.scheduledOn === (day === 0 ? '2026-08-02' : '2026-08-03') && meal.slot === 'lunch',
        )?.nameEn,
    );
    expect(lunches[0]).not.toEqual(lunches[1]);
  });

  it('is deterministic for a salt, and a new salt reshuffles', () => {
    const profile = { avoids: [], cuisines: ['egyptian'], mealsPerDay: 1 };
    const strip = (meals: ReturnType<typeof generateWeekMeals>) =>
      meals.map(({ scheduledOn, slot, nameEn }) => ({ scheduledOn, slot, nameEn }));

    expect(strip(generateWeekMeals(WEEK, CATALOGUE, profile, 0))).toEqual(
      strip(generateWeekMeals(WEEK, CATALOGUE, profile, 0)),
    );
    expect(strip(generateWeekMeals(WEEK, CATALOGUE, profile, 0))).not.toEqual(
      strip(generateWeekMeals(WEEK, CATALOGUE, profile, 3)),
    );
  });

  it('spans the seven days starting at the given Sunday', () => {
    const meals = generateWeekMeals(WEEK, CATALOGUE, { avoids: [], cuisines: [], mealsPerDay: 0 });
    const days = [...new Set(meals.map((meal) => meal.scheduledOn))].sort();
    expect(days[0]).toBe('2026-08-02');
    expect(days[6]).toBe('2026-08-08');
    expect(days).toHaveLength(7);
  });
});
