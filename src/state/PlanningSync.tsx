import * as Crypto from 'expo-crypto';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { AppState as RNAppState } from 'react-native';
import { AVOID_SLUGS, CUISINE_SLUGS } from '../data/assessment';
import { useAuth } from '../services/auth';
import { RecipeDetail, RecipeSummary, useContent } from '../services/content';
import {
  buildGroceryItems,
  buildGroceryItemsFromPlan,
  generateWeekMeals,
  GeneratorProfile,
  usePlanningRepository,
  weekStartISO,
} from '../services/planning';
import { GroceryItemRecord, PlannedMealRecord, WeekPlanRecord } from '../services/planning/types';
import { isSupabaseConfigured } from '../services/supabase';
import { AppState as AppStateShape, useAppState } from './AppState';

/**
 * Keeps the week's plan and shopping list in step with the account.
 *
 * The first load of a week generates it — a real week, built from the recipe
 * catalogue around this person's avoids, cuisines and meals-per-day — after
 * which every tick, swap, dismissal and custom item is a persisted row.
 * Writes go through the offline-first repository, so they work in the shop
 * with no signal and sync later.
 */

/** Custom grocery items land in the pantry group, as they do in the design. */
const CUSTOM_ITEM_CATEGORY = 'pantry';

const selectedSlugs = (slugs: readonly string[], selected: Record<number, boolean>): string[] =>
  slugs.filter((_, index) => selected[index]);

const profileFor = (state: AppStateShape): GeneratorProfile => ({
  avoids: selectedSlugs(AVOID_SLUGS, state.avoids),
  cuisines: selectedSlugs(CUISINE_SLUGS, state.cuisines),
  mealsPerDay: state.mealsPerDay,
});

type PlanningValue = {
  /** Ticks or unticks a planned meal. */
  toggleMeal: (id: string) => void;
  /** Replaces a planned meal with a different recipe. */
  swapMeal: (id: string, recipe: RecipeSummary) => void;
  /** Rebuilds the week's meals with a fresh rotation. */
  regenerate: () => void;
  toggleItem: (id: string) => void;
  /** "Already have it" — hides the item without deleting it. */
  dismissItem: (id: string) => void;
  addCustomItem: (name: string) => void;
};

const PlanningSyncContext = createContext<PlanningValue | null>(null);

export function PlanningSyncProvider({ children }: { children: React.ReactNode }) {
  const { session, status } = useAuth();
  const repository = usePlanningRepository();
  const { recipes, foods, getRecipe } = useContent();
  const { state, dispatch } = useAppState();

  const userId = session?.user.id ?? null;
  const stateRef = useRef(state);
  stateRef.current = state;
  const recipesRef = useRef(recipes);
  recipesRef.current = recipes;
  const foodsRef = useRef(foods);
  foodsRef.current = foods;
  const weekRef = useRef(weekStartISO());
  const planIdRef = useRef<string | null>(null);
  const hydratedFor = useRef<string | null>(null);

  // The shopping list follows the plan: fetch each planned recipe's
  // ingredients (the cached repo remembers them) and aggregate. The curated
  // staples remain the fallback when no ingredient data is reachable — and
  // in the no-backend demo, where every recipe shares one demo method.
  const deriveItems = useCallback(
    async (meals: PlannedMealRecord[]): Promise<GroceryItemRecord[]> => {
      if (!isSupabaseConfigured) return buildGroceryItems();
      const ids = [...new Set(meals.map((m) => m.recipeId).filter((id): id is string => !!id))];
      const details = new Map<string, RecipeDetail>();
      await Promise.all(
        ids.map(async (id) => {
          const recipe = recipesRef.current.find((r) => r.id === id);
          if (!recipe) return;
          try {
            const detail = await getRecipe(recipe.slug);
            if (detail && detail.ingredients.length > 0) details.set(id, detail);
          } catch {
            // Offline with a cold cache — this recipe contributes nothing.
          }
        }),
      );
      const derived = buildGroceryItemsFromPlan(meals, details, foodsRef.current);
      return derived.length > 0 ? derived : buildGroceryItems();
    },
    [getRecipe],
  );

  const hydrateWeek = useCallback(
    (week: WeekPlanRecord) => {
      planIdRef.current = week.planId;
      dispatch({
        type: 'set',
        patch: {
          planMeals: week.meals,
          planWeekStart: week.weekStart,
          planDay: new Date().getDay(),
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
          // A fresh week: generate it from the catalogue and this profile.
          const meals = generateWeekMeals(weekStart, recipesRef.current, profileFor(stateRef.current));
          week = {
            planId: Crypto.randomUUID(),
            listId: Crypto.randomUUID(),
            weekStart,
            meals,
            items: await deriveItems(meals),
          };
          await repository.ensureWeek(targetUserId, week);
          week = (await repository.loadWeek(targetUserId, weekStart)) ?? week;
        }
        if (hydratedFor.current !== targetUserId) return;
        hydrateWeek(week);
      } catch {
        // Offline with a cold cache: the screens show their empty states.
      }
    },
    [deriveItems, hydrateWeek, repository],
  );

  // Generate or load once per signed-in account — but only once the recipe
  // catalogue is in, since the generator draws from it.
  useEffect(() => {
    if (status !== 'signedIn' || !userId || recipes.length === 0) return;
    if (hydratedFor.current === userId) return;
    hydratedFor.current = userId;
    hydrate(userId);
  }, [hydrate, recipes.length, status, userId]);

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
      toggleMeal: (id: string) => {
        const meal = stateRef.current.planMeals.find((m) => m.id === id);
        if (!meal) return;
        const completed = !meal.completed;
        dispatch({ type: 'updatePlanMeal', id, patch: { completed } });
        persist((uid) => repository.setMealCompleted(uid, id, completed));
      },

      swapMeal: (id: string, recipe: RecipeSummary) => {
        const dish = { recipeId: recipe.id, nameEn: recipe.nameEn, nameAr: recipe.nameAr };
        dispatch({ type: 'updatePlanMeal', id, patch: { ...dish, completed: false } });
        persist((uid) => repository.swapMeal(uid, id, dish));
      },

      regenerate: () => {
        const planId = planIdRef.current;
        if (!planId) return;
        // A different salt, a different rotation — same rules.
        const meals = generateWeekMeals(
          weekRef.current,
          recipesRef.current,
          profileFor(stateRef.current),
          1 + Math.floor(Math.random() * 5),
        );
        dispatch({ type: 'set', patch: { planMeals: meals } });
        persist((uid) => repository.replaceMeals(uid, planId, weekRef.current, meals));

        // The list follows the plan: rebuild the generated rows, keep the
        // user's own additions exactly as they are.
        const listId = stateRef.current.groceryListId;
        deriveItems(meals)
          .then((items) => {
            const custom = stateRef.current.groceryItems.filter((item) => item.isCustom);
            dispatch({ type: 'set', patch: { groceryItems: [...custom, ...items] } });
            if (listId) persist((uid) => repository.replaceItems(uid, listId, weekRef.current, items));
          })
          .catch(() => {});
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
  }, [deriveItems, dispatch, repository, userId]);

  return <PlanningSyncContext.Provider value={value}>{children}</PlanningSyncContext.Provider>;
}

export function usePlanning() {
  const ctx = useContext(PlanningSyncContext);
  if (!ctx) throw new Error('usePlanning must be used inside <PlanningSyncProvider>');
  return ctx;
}
