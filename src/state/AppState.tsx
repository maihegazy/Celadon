import React, { createContext, useContext, useMemo, useReducer } from 'react';

/**
 * One store for the whole app, mirroring the prototype's single state object.
 * Everything the design lets you change lives here: assessment answers, plan
 * completion, the shopping list, check-ins, and the comfort mode that decides
 * whether numbers are shown at all.
 */
export type ComfortMode = 0 | 1 | 2; // 0 show everything · 1 gentle · 2 minimal

export type AppState = {
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
  planDay: number;
  completedMeals: Record<number, boolean>;
  planRegenerated: boolean;
  saturdayPlanned: boolean;

  /* recipe detail */
  servings: number;
  savedRecipe: boolean;

  /* shopping list */
  groceryChecked: Record<string, boolean>;
  groceryRemoved: Record<string, boolean>;
  customGroceryItems: string[];

  /* check-in */
  checkInValues: Record<number, number>;
  flare: boolean;
  checkInSaved: boolean;

  /* diary */
  water: number;
  diaryRemoved: Record<number, boolean>;
  manuallyAdded: string[];

  /* misc UI */
  recipeFilter: number;
  weightVisible: boolean;
  notificationsCleared: boolean;
  selectedPlan: number;
  /** Free-tier scans used this week; the design shows "1 free scan left" of 3. */
  scansUsed: number;
  cameraPrimingSeen: boolean;
};

const initialState: AppState = {
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

  planDay: 5,
  completedMeals: { 0: true },
  planRegenerated: false,
  saturdayPlanned: false,

  servings: 2,
  savedRecipe: false,

  groceryChecked: {},
  groceryRemoved: {},
  customGroceryItems: [],

  checkInValues: { 0: 3, 1: 2, 2: 3, 3: 1, 4: 1, 5: 3 },
  flare: false,
  checkInSaved: false,

  water: 5,
  diaryRemoved: {},
  manuallyAdded: [],

  recipeFilter: 0,
  weightVisible: false,
  notificationsCleared: false,
  selectedPlan: 1,
  scansUsed: 2,
  cameraPrimingSeen: false,
};

type Action =
  | { type: 'set'; patch: Partial<AppState> }
  | { type: 'toggleIn'; key: 'conditions' | 'concerns' | 'avoids' | 'cuisines'; index: number }
  | { type: 'toggleMealDone'; index: number }
  | { type: 'toggleGrocery'; key: string }
  | { type: 'removeGroceryItem'; key: string }
  | { type: 'addGroceryItem'; name: string }
  | { type: 'setCheckIn'; metric: number; value: number }
  | { type: 'removeDiaryEntry'; index: number }
  | { type: 'addManualFood'; name: string }
  | { type: 'adjustServings'; delta: number }
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
    case 'toggleMealDone':
      return {
        ...state,
        completedMeals: { ...state.completedMeals, [action.index]: !state.completedMeals[action.index] },
      };
    case 'toggleGrocery':
      return { ...state, groceryChecked: { ...state.groceryChecked, [action.key]: !state.groceryChecked[action.key] } };
    case 'removeGroceryItem':
      return { ...state, groceryRemoved: { ...state.groceryRemoved, [action.key]: true } };
    case 'addGroceryItem':
      return { ...state, customGroceryItems: [...state.customGroceryItems, action.name] };
    case 'setCheckIn':
      return {
        ...state,
        checkInValues: { ...state.checkInValues, [action.metric]: action.value },
        checkInSaved: false,
      };
    case 'removeDiaryEntry':
      return { ...state, diaryRemoved: { ...state.diaryRemoved, [action.index]: true } };
    case 'addManualFood':
      return { ...state, manuallyAdded: [...state.manuallyAdded, action.name] };
    case 'adjustServings':
      return { ...state, servings: Math.max(1, Math.min(4, state.servings + action.delta)) };
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
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<AppStateValue>(() => {
    const numbersOn = state.numbersOverride ?? state.comfort === 0;
    return {
      state,
      dispatch,
      set: (patch: Partial<AppState>) => dispatch({ type: 'set', patch }),
      numbersOn,
    };
  }, [state]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}
