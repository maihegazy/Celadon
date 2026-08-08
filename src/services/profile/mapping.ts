import {
  ACTIVITY_SLUGS,
  AVOID_SLUGS,
  COMFORT_SLUGS,
  CONCERN_SLUGS,
  CONDITION_SLUGS,
  COUNTRY_SLUGS,
  CUISINE_SLUGS,
  GOAL_SLUGS,
  MEAL_PATTERN_SLUGS,
  WEIGHT_GOAL_SLUGS,
} from '../../data/assessment';
import type { ComfortMode } from '../../state/AppState';

/**
 * The health profile — the answers from the assessment, plus the two settings
 * that change how the app talks to this person.
 */
export type StoredProfile = {
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
  /** False until the assessment has been completed once. */
  onboardingComplete: boolean;
};

/* ── index ⇄ slug ──────────────────────────────────────────────────────
 * The app tracks answers by their position in the option list; the database
 * stores slugs. Positions would break the moment an option is inserted in the
 * middle, so the boundary translates rather than leaking indexes into storage.
 */

const toSlugs = (slugs: readonly string[], selected: Record<number, boolean>): string[] =>
  slugs.filter((_, index) => selected[index]);

const fromSlugs = (slugs: readonly string[], stored: string[] | null): Record<number, boolean> => {
  const set = new Set(stored ?? []);
  const selected: Record<number, boolean> = {};
  slugs.forEach((slug, index) => {
    if (set.has(slug)) selected[index] = true;
  });
  return selected;
};

/** Unknown values fall back to the first option rather than throwing. */
const indexOf = (slugs: readonly string[], value: string | null, fallback = 0): number => {
  const found = value ? slugs.indexOf(value) : -1;
  return found === -1 ? fallback : found;
};

type ProfileRow = {
  goal: string | null;
  country: string | null;
  activity: string | null;
  meal_pattern: string | null;
  weight_goal: string | null;
  comfort: string | null;
  conditions: string[] | null;
  concerns: string[] | null;
  avoids: string[] | null;
  cuisines: string[] | null;
  onboarding_complete: boolean | null;
};

const rowToProfile = (row: ProfileRow): StoredProfile => ({
  goal: indexOf(GOAL_SLUGS, row.goal),
  country: indexOf(COUNTRY_SLUGS, row.country),
  activity: indexOf(ACTIVITY_SLUGS, row.activity, 1),
  mealsPerDay: indexOf(MEAL_PATTERN_SLUGS, row.meal_pattern, 1),
  weightGoal: indexOf(WEIGHT_GOAL_SLUGS, row.weight_goal, 2),
  comfort: indexOf(COMFORT_SLUGS, row.comfort) as ComfortMode,
  conditions: fromSlugs(CONDITION_SLUGS, row.conditions),
  concerns: fromSlugs(CONCERN_SLUGS, row.concerns),
  avoids: fromSlugs(AVOID_SLUGS, row.avoids),
  cuisines: fromSlugs(CUISINE_SLUGS, row.cuisines),
  onboardingComplete: !!row.onboarding_complete,
});

const profileToRow = (profile: StoredProfile) => ({
  goal: GOAL_SLUGS[profile.goal] ?? null,
  country: COUNTRY_SLUGS[profile.country] ?? null,
  activity: ACTIVITY_SLUGS[profile.activity] ?? 'light',
  meal_pattern: MEAL_PATTERN_SLUGS[profile.mealsPerDay] ?? 'three',
  weight_goal: WEIGHT_GOAL_SLUGS[profile.weightGoal] ?? 'unset',
  comfort: COMFORT_SLUGS[profile.comfort] ?? 'full',
  conditions: toSlugs(CONDITION_SLUGS, profile.conditions),
  concerns: toSlugs(CONCERN_SLUGS, profile.concerns),
  avoids: toSlugs(AVOID_SLUGS, profile.avoids),
  cuisines: toSlugs(CUISINE_SLUGS, profile.cuisines),
  onboarding_complete: profile.onboardingComplete,
});


export const PROFILE_COLUMNS =
  'goal, country, activity, meal_pattern, weight_goal, comfort, conditions, concerns, avoids, cuisines, onboarding_complete';

export { rowToProfile, profileToRow };
export type { ProfileRow };
