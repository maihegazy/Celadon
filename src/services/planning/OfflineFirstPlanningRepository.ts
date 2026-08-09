import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalPlanningRepository } from './LocalPlanningRepository';
import { GroceryItemRecord, PlannedMealRecord, PlanningRepository, WeekPlanRecord } from './types';

/**
 * Offline-first wrapper, same contract as the tracking one: writes land in
 * the on-device cache immediately, failures join a persistent outbox that is
 * replayed in order on the next flush. Ticking off groceries in the shop —
 * exactly where reception is worst — must always work.
 */

type Op =
  | { kind: 'ensureWeek'; week: WeekPlanRecord }
  | { kind: 'mealCompleted'; mealId: string; completed: boolean }
  | { kind: 'swapMeal'; mealId: string; dish: { recipeId: string | null; nameEn: string; nameAr: string | null } }
  | { kind: 'replaceMeals'; planId: string; weekStart: string; meals: PlannedMealRecord[] }
  | { kind: 'itemChecked'; itemId: string; checked: boolean }
  | { kind: 'dismissItem'; itemId: string }
  | { kind: 'addItem'; listId: string; item: GroceryItemRecord };

const outboxKey = (userId: string) => `celadon.planning.outbox.${userId}`;

/** Toggles coalesce per row — only the latest state of a checkbox matters. */
function enqueue(queue: Op[], op: Op): Op[] {
  if (op.kind === 'mealCompleted') {
    return [...queue.filter((q) => !(q.kind === 'mealCompleted' && q.mealId === op.mealId)), op];
  }
  if (op.kind === 'swapMeal') {
    return [...queue.filter((q) => !(q.kind === 'swapMeal' && q.mealId === op.mealId)), op];
  }
  if (op.kind === 'replaceMeals') {
    // A newer regeneration supersedes an unsent one — and any queued ticks
    // or swaps against meals the regeneration is about to delete.
    return [
      ...queue.filter(
        (q) => q.kind !== 'replaceMeals' && q.kind !== 'mealCompleted' && q.kind !== 'swapMeal',
      ),
      op,
    ];
  }
  if (op.kind === 'itemChecked') {
    return [...queue.filter((q) => !(q.kind === 'itemChecked' && q.itemId === op.itemId)), op];
  }
  return [...queue, op];
}

export class OfflineFirstPlanningRepository implements PlanningRepository {
  private flushing: Promise<void> | null = null;

  constructor(
    private remote: PlanningRepository,
    private cache: LocalPlanningRepository,
  ) {}

  async loadWeek(userId: string, weekStart: string): Promise<WeekPlanRecord | null> {
    await this.flush(userId);
    try {
      const week = await this.remote.loadWeek(userId, weekStart);
      if (await this.hasPending(userId)) return this.cache.loadWeek(userId, weekStart);
      if (week) await this.cache.replaceWeek(userId, week);
      return week;
    } catch {
      return this.cache.loadWeek(userId, weekStart);
    }
  }

  async ensureWeek(userId: string, week: WeekPlanRecord): Promise<void> {
    await this.cache.ensureWeek(userId, week);
    await this.push(userId, { kind: 'ensureWeek', week });
  }

  async setMealCompleted(userId: string, mealId: string, completed: boolean): Promise<void> {
    await this.cache.setMealCompleted(userId, mealId, completed);
    await this.push(userId, { kind: 'mealCompleted', mealId, completed });
  }

  async swapMeal(
    userId: string,
    mealId: string,
    dish: { recipeId: string | null; nameEn: string; nameAr: string | null },
  ): Promise<void> {
    await this.cache.swapMeal(userId, mealId, dish);
    await this.push(userId, { kind: 'swapMeal', mealId, dish });
  }

  async replaceMeals(
    userId: string,
    planId: string,
    weekStart: string,
    meals: PlannedMealRecord[],
  ): Promise<void> {
    await this.cache.replaceMeals(userId, planId, weekStart, meals);
    await this.push(userId, { kind: 'replaceMeals', planId, weekStart, meals });
  }

  async setItemChecked(userId: string, itemId: string, checked: boolean): Promise<void> {
    await this.cache.setItemChecked(userId, itemId, checked);
    await this.push(userId, { kind: 'itemChecked', itemId, checked });
  }

  async dismissItem(userId: string, itemId: string): Promise<void> {
    await this.cache.dismissItem(userId, itemId);
    await this.push(userId, { kind: 'dismissItem', itemId });
  }

  async addItem(userId: string, listId: string, item: GroceryItemRecord): Promise<void> {
    await this.cache.addItem(userId, listId, item);
    await this.push(userId, { kind: 'addItem', listId, item });
  }

  async flush(userId: string): Promise<void> {
    if (!this.flushing) {
      this.flushing = this.drain(userId).finally(() => {
        this.flushing = null;
      });
    }
    return this.flushing;
  }

  private async drain(userId: string): Promise<void> {
    let queue = await this.readOutbox(userId);
    while (queue.length > 0) {
      try {
        await this.send(userId, queue[0]);
      } catch {
        return; // Still offline — order preserved for the next attempt.
      }
      queue = queue.slice(1);
      await this.writeOutbox(userId, queue);
    }
  }

  private async push(userId: string, op: Op): Promise<void> {
    // Order matters behind a failure: a row's insert must land before its
    // updates, so new ops queue behind pending ones.
    if (await this.hasPending(userId)) {
      await this.writeOutbox(userId, enqueue(await this.readOutbox(userId), op));
      await this.flush(userId);
      return;
    }
    try {
      await this.send(userId, op);
    } catch {
      await this.writeOutbox(userId, enqueue(await this.readOutbox(userId), op));
    }
  }

  private send(userId: string, op: Op): Promise<void> {
    switch (op.kind) {
      case 'ensureWeek':
        return this.remote.ensureWeek(userId, op.week);
      case 'mealCompleted':
        return this.remote.setMealCompleted(userId, op.mealId, op.completed);
      case 'swapMeal':
        return this.remote.swapMeal(userId, op.mealId, op.dish);
      case 'replaceMeals':
        return this.remote.replaceMeals(userId, op.planId, op.weekStart, op.meals);
      case 'itemChecked':
        return this.remote.setItemChecked(userId, op.itemId, op.checked);
      case 'dismissItem':
        return this.remote.dismissItem(userId, op.itemId);
      case 'addItem':
        return this.remote.addItem(userId, op.listId, op.item);
    }
  }

  private async hasPending(userId: string): Promise<boolean> {
    return (await this.readOutbox(userId)).length > 0;
  }

  private async readOutbox(userId: string): Promise<Op[]> {
    const raw = await AsyncStorage.getItem(outboxKey(userId));
    return raw ? (JSON.parse(raw) as Op[]) : [];
  }

  private async writeOutbox(userId: string, queue: Op[]): Promise<void> {
    if (queue.length === 0) await AsyncStorage.removeItem(outboxKey(userId));
    else await AsyncStorage.setItem(outboxKey(userId), JSON.stringify(queue));
  }
}
