import type { FoodRecord, RecipeDetail, RecipeIngredient } from '../../content/types';
import type { PlannedMealRecord } from '../types';
import { buildGroceryItemsFromPlan } from '../groceries';

let nextId = 0;
const meal = (recipeId: string | null, slot: PlannedMealRecord['slot'] = 'lunch'): PlannedMealRecord => ({
  id: `meal-${nextId++}`,
  scheduledOn: '2026-08-02',
  slot,
  position: nextId,
  nameEn: 'Dish',
  nameAr: null,
  completed: false,
  recipeId,
});

const ingredient = (overrides: Partial<RecipeIngredient>): RecipeIngredient => ({
  position: 1,
  nameEn: 'Ingredient',
  nameAr: 'مكوّن',
  quantity: 100,
  unitEn: 'g',
  unitAr: 'غ',
  tone: 'supportive',
  foodSlug: null,
  ...overrides,
});

const detail = (id: string, ingredients: RecipeIngredient[]): RecipeDetail => ({
  id,
  slug: id,
  nameEn: id,
  nameAr: id,
  blurbEn: null,
  blurbAr: null,
  whyEn: null,
  whyAr: null,
  minutes: 20,
  baseServings: 2,
  score: 80,
  classification: 'supportive',
  calories: null,
  cuisine: null,
  tags: [],
  ingredients,
  steps: [],
  substitutions: [],
});

const food = (slug: string, category: string): FoodRecord => ({
  slug,
  nameEn: slug,
  nameAr: slug,
  noteEn: null,
  noteAr: null,
  score: 80,
  tone: 'supportive',
  category,
  caloriesPer100g: null,
});

describe('buildGroceryItemsFromPlan', () => {
  it('sums a quantity across the meals that cook the same recipe', () => {
    const details = new Map([
      ['r1', detail('r1', [ingredient({ nameEn: 'Wild salmon', quantity: 300 })])],
    ]);
    const items = buildGroceryItemsFromPlan([meal('r1'), meal('r1', 'dinner')], details, []);
    expect(items).toHaveLength(1);
    expect(items[0].quantityEn).toBe('600 g');
    expect(items[0].quantityAr).toBe('٦٠٠ غ');
  });

  it('merges the same ingredient from different recipes', () => {
    const details = new Map([
      ['r1', detail('r1', [ingredient({ nameEn: 'Olive oil', quantity: 2, unitEn: 'tbsp' })])],
      ['r2', detail('r2', [ingredient({ nameEn: 'olive oil', quantity: 3, unitEn: 'tbsp' })])],
    ]);
    const items = buildGroceryItemsFromPlan([meal('r1'), meal('r2')], details, []);
    expect(items).toHaveLength(1);
    expect(items[0].quantityEn).toBe('5 tbsp');
  });

  it('falls back to a mention count when units disagree', () => {
    const details = new Map([
      ['r1', detail('r1', [ingredient({ nameEn: 'Garlic', quantity: 4, unitEn: 'clove' })])],
      ['r2', detail('r2', [ingredient({ nameEn: 'Garlic', quantity: 1, unitEn: 'head' })])],
    ]);
    const items = buildGroceryItemsFromPlan([meal('r1'), meal('r2')], details, []);
    expect(items[0].quantityEn).toBe('× 2');
  });

  it('categorises through the foods catalogue and orders the shop walk', () => {
    const details = new Map([
      [
        'r1',
        detail('r1', [
          ingredient({ nameEn: 'Turmeric', foodSlug: 'turmeric' }),
          ingredient({ nameEn: 'Wild salmon', foodSlug: 'salmon' }),
          ingredient({ nameEn: 'Quinoa', foodSlug: 'quinoa' }),
          ingredient({ nameEn: 'Cucumber' }),
        ]),
      ],
    ]);
    const foods = [food('turmeric', 'spices'), food('salmon', 'fish'), food('quinoa', 'grains')];
    const items = buildGroceryItemsFromPlan([meal('r1')], details, foods);
    expect(items.map((item) => [item.nameEn, item.category])).toEqual([
      ['Cucumber', 'produce'],
      ['Wild salmon', 'protein'],
      ['Quinoa', 'pantry'],
      ['Turmeric', 'herbs'],
    ]);
    expect(items.map((item) => item.position)).toEqual([0, 1, 2, 3]);
    expect(items.every((item) => !item.isCustom && !item.checked && !item.dismissed)).toBe(true);
  });

  it('ignores snacks without recipes and recipes without details', () => {
    const details = new Map([['r1', detail('r1', [ingredient({ nameEn: 'Dates' })])]]);
    const items = buildGroceryItemsFromPlan(
      [meal('r1'), meal(null, 'snack'), meal('r-unknown')],
      details,
      [],
    );
    expect(items).toHaveLength(1);
    expect(items[0].nameEn).toBe('Dates');
  });
});
