import { requireSupabase } from '../supabase';
import {
  GroceryItemRecord,
  PlannedMealRecord,
  PlanningRepository,
  WeekPlanRecord,
} from './types';

type MealRow = {
  id: string;
  scheduled_on: string;
  slot: PlannedMealRecord['slot'];
  position: number;
  recipe_id: string | null;
  custom_name_en: string | null;
  custom_name_ar: string | null;
  completed: boolean;
};

/** Bundled-catalogue ids aren't rows the foreign key can point at. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dbRecipeId = (recipeId: string | null): string | null =>
  recipeId && UUID_RE.test(recipeId) ? recipeId : null;

type ItemRow = {
  id: string;
  category: string;
  name_en: string;
  name_ar: string | null;
  quantity_en: string | null;
  quantity_ar: string | null;
  position: number;
  checked: boolean;
  dismissed: boolean;
  is_custom: boolean;
};

const rowToMeal = (row: MealRow): PlannedMealRecord => ({
  id: row.id,
  scheduledOn: row.scheduled_on,
  slot: row.slot,
  position: row.position,
  recipeId: row.recipe_id,
  nameEn: row.custom_name_en ?? '',
  nameAr: row.custom_name_ar,
  completed: row.completed,
});

const mealToRow = (userId: string, planId: string, meal: PlannedMealRecord) => ({
  id: meal.id,
  plan_id: planId,
  user_id: userId,
  scheduled_on: meal.scheduledOn,
  slot: meal.slot,
  position: meal.position,
  recipe_id: dbRecipeId(meal.recipeId),
  custom_name_en: meal.nameEn,
  custom_name_ar: meal.nameAr,
  completed: meal.completed,
});

const rowToItem = (row: ItemRow): GroceryItemRecord => ({
  id: row.id,
  category: row.category,
  nameEn: row.name_en,
  nameAr: row.name_ar,
  quantityEn: row.quantity_en,
  quantityAr: row.quantity_ar,
  position: row.position,
  checked: row.checked,
  dismissed: row.dismissed,
  isCustom: row.is_custom,
});

/**
 * Supabase-backed store. Row-level security scopes everything to the caller;
 * writes are keyed on client-generated ids so offline retries stay idempotent.
 */
export class SupabasePlanningRepository implements PlanningRepository {
  async loadWeek(userId: string, weekStart: string): Promise<WeekPlanRecord | null> {
    const client = requireSupabase();

    const [plan, list] = await Promise.all([
      client
        .from('meal_plans')
        .select('id')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .maybeSingle<{ id: string }>(),
      client
        .from('grocery_lists')
        .select('id')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .maybeSingle<{ id: string }>(),
    ]);
    if (plan.error) throw plan.error;
    if (list.error) throw list.error;
    if (!plan.data || !list.data) return null;

    const [meals, items] = await Promise.all([
      client
        .from('planned_meals')
        .select('id, scheduled_on, slot, position, recipe_id, custom_name_en, custom_name_ar, completed')
        .eq('plan_id', plan.data.id)
        .order('scheduled_on', { ascending: true })
        .order('position', { ascending: true })
        .returns<MealRow[]>(),
      client
        .from('grocery_items')
        .select('id, category, name_en, name_ar, quantity_en, quantity_ar, position, checked, dismissed, is_custom')
        .eq('list_id', list.data.id)
        .order('position', { ascending: true })
        .returns<ItemRow[]>(),
    ]);
    if (meals.error) throw meals.error;
    if (items.error) throw items.error;

    return {
      planId: plan.data.id,
      listId: list.data.id,
      weekStart,
      meals: (meals.data ?? []).map(rowToMeal),
      items: (items.data ?? []).map(rowToItem),
    };
  }

  async ensureWeek(userId: string, week: WeekPlanRecord): Promise<void> {
    const client = requireSupabase();

    // The unique (user_id, week_start) keys make re-running this a no-op:
    // ignoreDuplicates leaves an existing week's rows exactly as they are.
    const plan = await client
      .from('meal_plans')
      .upsert(
        { id: week.planId, user_id: userId, week_start: week.weekStart },
        { onConflict: 'user_id,week_start', ignoreDuplicates: true },
      );
    if (plan.error) throw plan.error;

    const list = await client
      .from('grocery_lists')
      .upsert(
        { id: week.listId, user_id: userId, plan_id: null, week_start: week.weekStart },
        { onConflict: 'user_id,week_start', ignoreDuplicates: true },
      );
    if (list.error) throw list.error;

    // Another device may have won the race — resolve the real parent ids.
    const stored = await this.loadWeek(userId, week.weekStart);
    if (!stored) throw new Error('week materialisation failed');
    if (stored.meals.length > 0 || stored.items.length > 0) return;

    const meals = await client.from('planned_meals').upsert(
      week.meals.map((meal) => mealToRow(userId, stored.planId, meal)),
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (meals.error) throw meals.error;

    const items = await client.from('grocery_items').upsert(
      week.items.map((item) => ({
        id: item.id,
        list_id: stored.listId,
        user_id: userId,
        category: item.category,
        name_en: item.nameEn,
        name_ar: item.nameAr,
        quantity_en: item.quantityEn,
        quantity_ar: item.quantityAr,
        position: item.position,
        checked: item.checked,
        dismissed: item.dismissed,
        is_custom: item.isCustom,
      })),
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (items.error) throw items.error;
  }

  async setMealCompleted(userId: string, mealId: string, completed: boolean): Promise<void> {
    const { error } = await requireSupabase()
      .from('planned_meals')
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq('id', mealId);
    if (error) throw error;
  }

  async swapMeal(
    userId: string,
    mealId: string,
    dish: { recipeId: string | null; nameEn: string; nameAr: string | null },
  ): Promise<void> {
    const { error } = await requireSupabase()
      .from('planned_meals')
      .update({
        recipe_id: dbRecipeId(dish.recipeId),
        custom_name_en: dish.nameEn,
        custom_name_ar: dish.nameAr,
        // A different dish hasn't been eaten yet.
        completed: false,
        completed_at: null,
      })
      .eq('id', mealId);
    if (error) throw error;
  }

  async replaceMeals(
    userId: string,
    planId: string,
    _weekStart: string,
    meals: PlannedMealRecord[],
  ): Promise<void> {
    const client = requireSupabase();
    const removed = await client.from('planned_meals').delete().eq('plan_id', planId);
    if (removed.error) throw removed.error;
    const inserted = await client.from('planned_meals').upsert(
      meals.map((meal) => mealToRow(userId, planId, meal)),
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (inserted.error) throw inserted.error;
  }

  async setItemChecked(userId: string, itemId: string, checked: boolean): Promise<void> {
    const { error } = await requireSupabase()
      .from('grocery_items')
      .update({ checked })
      .eq('id', itemId);
    if (error) throw error;
  }

  async dismissItem(userId: string, itemId: string): Promise<void> {
    const { error } = await requireSupabase()
      .from('grocery_items')
      .update({ dismissed: true })
      .eq('id', itemId);
    if (error) throw error;
  }

  async addItem(userId: string, listId: string, item: GroceryItemRecord): Promise<void> {
    const { error } = await requireSupabase()
      .from('grocery_items')
      .upsert(
        {
          id: item.id,
          list_id: listId,
          user_id: userId,
          category: item.category,
          name_en: item.nameEn,
          name_ar: item.nameAr,
          quantity_en: item.quantityEn,
          quantity_ar: item.quantityAr,
          position: item.position,
          checked: item.checked,
          dismissed: item.dismissed,
          is_custom: item.isCustom,
        },
        { onConflict: 'id' },
      );
    if (error) throw error;
  }
}
