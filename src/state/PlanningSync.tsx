import * as Crypto from 'expo-crypto';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { AppState as RNAppState } from 'react-native';
import { useAuth } from '../services/auth';
import { buildWeekSeed, usePlanningRepository, weekStartISO } from '../services/planning';
import { GroceryItemRecord, WeekPlanRecord } from '../services/planning/types';
import { useAppState } from './AppState';

/**
 * Keeps the week's plan and shopping list in step with the account.
 *
 * The first load of a week materialises it — for now from the bundled demo
 * content, later from the plan generator — after which every meal tick,
 * grocery check, dismissal and custom item is a persisted row. Writes go
 * through the offline-first repository, so they work in the shop with no
 * signal and sync later.
 */

/** Custom grocery items land in the pantry group, as they do in the design. */
const CUSTOM_ITEM_CATEGORY = 'pantry';

type PlanningValue = {
  /** Ticks or unticks the meal at `position` in the day's list. */
  toggleMeal: (position: number) => void;
  toggleItem: (id: string) => void;
  /** "Already have it" — hides the item without deleting it. */
  dismissItem: (id: string) => void;
  addCustomItem: (name: string) => void;
};

const PlanningSyncContext = createContext<PlanningValue | null>(null);

export function PlanningSyncProvider({ children }: { children: React.ReactNode }) {
  const { session, status } = useAuth();
  const repository = usePlanningRepository();
  const { state, dispatch } = useAppState();

  const userId = session?.user.id ?? null;
  const stateRef = useRef(state);
  stateRef.current = state;
  const weekRef = useRef(weekStartISO());
  const hydratedFor = useRef<string | null>(null);

  const hydrateWeek = useCallback(
    (week: WeekPlanRecord) => {
      const completedMeals: Record<number, boolean> = {};
      week.meals.forEach((meal) => {
        if (meal.completed) completedMeals[meal.position] = true;
      });
      dispatch({
        type: 'set',
        patch: {
          planMeals: week.meals,
          completedMeals,
          groceryListId: week.listId,
          groceryItems: week.items,
        },
      });
    },
    [dispatch],
  );

  const hydrate = useCallback(
    async (targetUserId: string) => {
      const weekStart = weekStartISO();
      weekRef.current = weekStart;
      try {
        let week = await repository.loadWeek(targetUserId, weekStart);
        if (!week) {
          // A fresh week: materialise it so there are rows to tick.
          week = buildWeekSeed(weekStart);
          await repository.ensureWeek(targetUserId, week);
          week = (await repository.loadWeek(targetUserId, weekStart)) ?? week;
        }
        if (hydratedFor.current !== targetUserId) return;
        hydrateWeek(week);
      } catch {
        // Offline with a cold cache: the in-memory demo content still works.
      }
    },
    [hydrateWeek, repository],
  );

  useEffect(() => {
    if (status !== 'signedIn' || !userId || hydratedFor.current === userId) return;
    hydratedFor.current = userId;
    hydrate(userId);
  }, [hydrate, status, userId]);

  useEffect(() => {
    if (status === 'signedOut') hydratedFor.current = null;
  }, [status]);

  // On foreground: push queued writes; if the week rolled over, start fresh.
  useEffect(() => {
    if (!userId) return;
    const subscription = RNAppState.addEventListener('change', (appState) => {
      if (appState !== 'active') return;
      if (weekStartISO() !== weekRef.current) hydrate(userId);
      else repository.flush?.(userId).catch(() => {});
    });
    return () => subscription.remove();
  }, [hydrate, repository, userId]);

  const value = useMemo<PlanningValue>(() => {
    const persist = (write: (uid: string) => Promise<void>) => {
      if (!userId) return; // Signed out: the in-memory store is all there is.
      write(userId).catch(() => {
        // The repository has already cached and queued what it could.
      });
    };

    return {
      toggleMeal: (position: number) => {
        const meal = stateRef.current.planMeals.find((m) => m.position === position);
        const completed = !stateRef.current.completedMeals[position];
        dispatch({ type: 'setMealCompleted', position, completed });
        if (meal) persist((uid) => repository.setMealCompleted(uid, meal.id, completed));
      },

      toggleItem: (id: string) => {
        const item = stateRef.current.groceryItems.find((i) => i.id === id);
        if (!item) return;
        const checked = !item.checked;
        dispatch({ type: 'updateGroceryItem', id, patch: { checked } });
        persist((uid) => repository.setItemChecked(uid, id, checked));
      },

      dismissItem: (id: string) => {
        dispatch({ type: 'updateGroceryItem', id, patch: { dismissed: true } });
        persist((uid) => repository.dismissItem(uid, id));
      },

      addCustomItem: (name: string) => {
        const { groceryListId, groceryItems } = stateRef.current;
        const item: GroceryItemRecord = {
          id: Crypto.randomUUID(),
          category: CUSTOM_ITEM_CATEGORY,
          nameEn: name,
          nameAr: null,
          quantityEn: null,
          quantityAr: null,
          position: groceryItems.reduce((max, i) => Math.max(max, i.position), -1) + 1,
          checked: false,
          dismissed: false,
          isCustom: true,
        };
        dispatch({ type: 'addGroceryItemRecord', item });
        if (groceryListId) persist((uid) => repository.addItem(uid, groceryListId, item));
      },
    };
  }, [dispatch, repository, userId]);

  return <PlanningSyncContext.Provider value={value}>{children}</PlanningSyncContext.Provider>;
}

export function usePlanning() {
  const ctx = useContext(PlanningSyncContext);
  if (!ctx) throw new Error('usePlanning must be used inside <PlanningSyncProvider>');
  return ctx;
}
