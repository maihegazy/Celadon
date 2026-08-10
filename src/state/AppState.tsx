import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import type { GroceryItemRecord, PlannedMealRecord } from '../services/planning/types';
import type { DiaryEntryRecord } from '../services/tracking/types';

/**
 * One store for the whole app, mirroring the prototype's single state object.
 * Everything the design lets you change lives here: assessment answers, plan
 * completion, the shopping list, check-ins, and the comfort mode that decides
 * whether numbers are shown at all.
 */
export type ComfortMode = 0 | 1 | 2; // 0 show everything · 1 gentle · 2 minimal

export type AppState = {
  /* about you — every field is optional and null/empty until volunteered */
  displayName: string;
  /** ISO date (YYYY-MM-DD), or null while unset/incomplete. */
  birthDate: string | null;
  /** Index into SEXES, or null while unset. */
  sex: number | null;
  heightCm: number | null;
  weightKg: number | null;

  /* assessment */
  goal: number;
  conditions: Record<number, boolean>;
  concerns: Record<number, boolean>;
  avoids: Record<number, boolean>;
  cuisines: Record<number, boolean>;
  country: number;
  activity: number;
  mealsPerDay: number;
  weightGoal: number;
  comfort: ComfortMode;
  /** Per-session override of the comfort mode's number visibility. */
  numbersOverride: boolean | null;

  /* meal plan */
  /** Selected day in the week strip, 0 = Sunday. */
  planDay: number;
  /** Sunday of the generated week, or null until hydrated. */
  planWeekStart: string | null;
  /** This week's persisted meals, hydrated from the planning repository. */
  planMeals: PlannedMealRecord[];
  planRegenerated: boolean;

  /* recipe detail */
  servings: number;

  /* shopping list */
  groceryListId: string | null;
  /** This week's persisted list, hydrated from the planning repository. */
  groceryItems: GroceryItemRecord[];

  /* check-in */
  checkInValues: Record<number, number>;
  flare: boolean;
  checkInNote: string;
  checkInSaved: boolean;

  /* diary */
  water: number;
  /** Demo-only: indexes of the fixture entries dismissed this session. */
  diaryRemoved: Record<number, boolean>;
  /** Today's persisted entries, hydrated from the tracking repository. */
  diaryEntries: DiaryEntryRecord[];

  /* misc UI */
  recipeFilter: number;
  weightVisible: boolean;
  selectedPlan: number;
  /** Free-tier scans used this week; the design shows "1 free scan left" of 3. */
  scansUsed: number;
  cameraPrimingSeen: boolean;
  /** True once the assessment has been completed at least once. */
  onboardingComplete: boolean;
  /** Device-scoped: the permission priming screens have been shown. */
  permissionsSeen: boolean;
};

const initialState: AppState = {
  displayName: '',
  birthDate: null,
  sex: null,
  heightCm: null,
  weightKg: null,

  goal: 0,
  conditions: { 5: true },
  concerns: { 0: true, 1: true },
  avoids: { 0: true, 2: true },
  cuisines: { 0: true, 4: true },
  country: 0,
  activity: 1,
  mealsPerDay: 2,
  weightGoal: 0,
  comfort: 0,
  numbersOverride: null,

  planDay: new Date().getDay(),
  planWeekStart: null,
  planMeals: [],
  planRegenerated: false,

  servings: 2,

  groceryListId: null,
  groceryItems: [],

  checkInValues: { 0: 3, 1: 2, 2: 3, 3: 1, 4: 1, 5: 3 },
  flare: false,
  checkInNote: '',
  checkInSaved: false,

  water: 5,
  diaryRemoved: {},
  diaryEntries: [],

  recipeFilter: 0,
  weightVisible: false,
  selectedPlan: 1,
  scansUsed: 2,
  cameraPrimingSeen: false,
  onboardingComplete: false,
  permissionsSeen: false,
};

type Action =
  | { type: 'set'; patch: Partial<AppState> }
  | { type: 'toggleIn'; key: 'conditions' | 'concerns' | 'avoids' | 'cuisines'; index: number }
  | { type: 'updatePlanMeal'; id: string; patch: Partial<PlannedMealRecord> }
  | { type: 'updateGroceryItem'; id: string; patch: Partial<GroceryItemRecord> }
  | { type: 'addGroceryItemRecord'; item: GroceryItemRecord }
  | { type: 'setCheckIn'; metric: number; value: number }
  | { type: 'removeDiaryEntry'; index: number }
  | { type: 'addDiaryEntry'; entry: DiaryEntryRecord }
  | { type: 'removeDiaryEntryById'; id: string }
  | { type: 'adjustServings'; delta: number }
  /** Replace the saved answers with a profile loaded from the backend. */
  | { type: 'hydrate'; profile: Partial<AppState> }
  /** Clears account-scoped state on sign-out, keeping device preferences. */
  | { type: 'signOut' }
  | { type: 'reset' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'set':
      return { ...state, ...action.patch };
    case 'toggleIn':
      return {
        ...state,
        [action.key]: { ...state[action.key], [action.index]: !state[action.key][action.index] },
      };
    case 'updatePlanMeal':
      return {
        ...state,
        planMeals: state.planMeals.map((meal) =>
          meal.id === action.id ? { ...meal, ...action.patch } : meal,
        ),
      };
    case 'updateGroceryItem':
      return {
        ...state,
        groceryItems: state.groceryItems.map((item) =>
          item.id === action.id ? { ...item, ...action.patch } : item,
        ),
      };
    case 'addGroceryItemRecord':
      // Keyed on id so a hydration racing a local add can't duplicate it.
      return {
        ...state,
        groceryItems: [...state.groceryItems.filter((i) => i.id !== action.item.id), action.item],
      };
    case 'setCheckIn':
      return {
        ...state,
        checkInValues: { ...state.checkInValues, [action.metric]: action.value },
        checkInSaved: false,
      };
    case 'removeDiaryEntry':
      return { ...state, diaryRemoved: { ...state.diaryRemoved, [action.index]: true } };
    case 'addDiaryEntry':
      // Keyed on id so a hydration racing a local add can't duplicate it.
      return {
        ...state,
        diaryEntries: [...state.diaryEntries.filter((e) => e.id !== action.entry.id), action.entry],
      };
    case 'removeDiaryEntryById':
      return { ...state, diaryEntries: state.diaryEntries.filter((e) => e.id !== action.id) };
    case 'adjustServings':
      return { ...state, servings: Math.max(1, Math.min(4, state.servings + action.delta)) };
    case 'hydrate':
      return { ...state, ...action.profile };
    case 'signOut':
      // The OS permission prompts were answered on this device, not by this
      // account — asking again after a sign-out would be noise.
      return { ...initialState, permissionsSeen: state.permissionsSeen };
    case 'reset':
      return initialState;
    default:
      return state;
  }
}

type AppStateValue = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  /** Convenience setter for single-field updates. */
  set: (patch: Partial<AppState>) => void;
  /**
   * Whether calories, macros and weights are shown. Gentle and minimal modes
   * hide them; a per-screen "Show"/"Hide" toggle can override for the session.
   */
  numbersOn: boolean;
  /** False until device-scoped preferences have been read back. */
  booted: boolean;
};

/** Device-scoped flags — they describe this install, not this account. */
const DEVICE_KEY = 'celadon.device';
type DeviceState = Pick<AppState, 'permissionsSeen'>;

/** The slice of state that belongs to the user rather than to this session. */
export const assessmentSlice = (state: AppState) => ({
  displayName: state.displayName,
  birthDate: state.birthDate,
  sex: state.sex,
  heightCm: state.heightCm,
  weightKg: state.weightKg,
  goal: state.goal,
  conditions: state.conditions,
  concerns: state.concerns,
  avoids: state.avoids,
  cuisines: state.cuisines,
  country: state.country,
  activity: state.activity,
  mealsPerDay: state.mealsPerDay,
  weightGoal: state.weightGoal,
  comfort: state.comfort,
  onboardingComplete: state.onboardingComplete,
});

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [booted, setBooted] = useState(false);

  // Read device preferences once at launch.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(DEVICE_KEY)
      .then((raw) => {
        if (!active) return;
        if (raw) dispatch({ type: 'hydrate', profile: JSON.parse(raw) as DeviceState });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setBooted(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // …and write them back whenever they change.
  useEffect(() => {
    if (!booted) return;
    const device: DeviceState = { permissionsSeen: state.permissionsSeen };
    AsyncStorage.setItem(DEVICE_KEY, JSON.stringify(device)).catch(() => {});
  }, [booted, state.permissionsSeen]);

  const value = useMemo<AppStateValue>(() => {
    const numbersOn = state.numbersOverride ?? state.comfort === 0;
    return {
      state,
      dispatch,
      set: (patch: Partial<AppState>) => dispatch({ type: 'set', patch }),
      numbersOn,
      booted,
    };
  }, [booted, state]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}
