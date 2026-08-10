import AsyncStorage from '@react-native-async-storage/async-storage';
import { GroceryItemRecord, PlannedMealRecord, PlanningRepository, WeekPlanRecord } from './types';

/**
 * Device-only store, one JSON blob per user per week.
 *
 * The whole store when no backend is configured, and the read cache /
 * write-through layer under `OfflineFirstPlanningRepository` when one is.
 */
export class LocalPlanningRepository implements PlanningRepository {
  private key = (userId: string, weekStart: string) => `celadon.planning.${userId}.${weekStart}`;

  async loadWeek(userId: string, weekStart: string): Promise<WeekPlanRecord | null> {
    const raw = await AsyncStorage.getItem(this.key(userId, weekStart));
    return raw ? (JSON.parse(raw) as WeekPlanRecord) : null;
  }

  async replaceWeek(userId: string, week: WeekPlanRecord): Promise<void> {
    await AsyncStorage.setItem(this.key(userId, week.weekStart), JSON.stringify(week));
  }

  async ensureWeek(userId: string, week: WeekPlanRecord): Promise<void> {
    const existing = await this.loadWeek(userId, week.weekStart);
    if (!existing) await this.replaceWeek(userId, week);
  }

  async setMealCompleted(userId: string, mealId: string, completed: boolean): Promise<void> {
    await this.updateAll(userId, (week) => ({
      ...week,
      meals: week.meals.map((meal) => (meal.id === mealId ? { ...meal, completed } : meal)),
    }));
  }

  async swapMeal(
    userId: string,
    mealId: string,
    dish: { recipeId: string | null; nameEn: string; nameAr: string | null },
  ): Promise<void> {
    await this.updateAll(userId, (week) => ({
      ...week,
      meals: week.meals.map((meal) =>
        meal.id === mealId ? { ...meal, ...dish, completed: false } : meal,
      ),
    }));
  }

  async replaceMeals(
    userId: string,
    planId: string,
    _weekStart: string,
    meals: PlannedMealRecord[],
  ): Promise<void> {
    await this.updateAll(userId, (week) => (week.planId === planId ? { ...week, meals } : week));
  }

  async setItemChecked(userId: string, itemId: string, checked: boolean): Promise<void> {
    await this.updateItem(userId, itemId, (item) => ({ ...item, checked }));
  }

  async dismissItem(userId: string, itemId: string): Promise<void> {
    await this.updateItem(userId, itemId, (item) => ({ ...item, dismissed: true }));
  }

  async addItem(userId: string, listId: string, item: GroceryItemRecord): Promise<void> {
    await this.updateAll(userId, (week) =>
      week.listId === listId
        ? { ...week, items: [...week.items.filter((i) => i.id !== item.id), item] }
        : week,
    );
  }

  private async updateItem(
    userId: string,
    itemId: string,
    fn: (item: GroceryItemRecord) => GroceryItemRecord,
  ): Promise<void> {
    await this.updateAll(userId, (week) => ({
      ...week,
      items: week.items.map((item) => (item.id === itemId ? fn(item) : item)),
    }));
  }

  /** Applies an update across every stored week that contains the target row. */
  private async updateAll(
    userId: string,
    fn: (week: WeekPlanRecord) => WeekPlanRecord,
  ): Promise<void> {
    const prefix = `celadon.planning.${userId}.`;
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(prefix));
    for (const key of keys) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      const week = JSON.parse(raw) as WeekPlanRecord;
      const updated = fn(week);
      if (updated !== week) await AsyncStorage.setItem(key, JSON.stringify(updated));
    }
  }
}
