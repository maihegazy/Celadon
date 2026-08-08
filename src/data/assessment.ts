import type { TranslationKey } from '../i18n';

/**
 * Assessment options, as translation keys. The copy lives in `src/i18n/`; the
 * order here is what the design specifies and what the stored answer indexes
 * refer to, so don't reorder without migrating `AppState`.
 */

export const GOALS: TranslationKey[] = [
  'goal.calm',
  'goal.autoimmune',
  'goal.energy',
  'goal.weight',
  'goal.better',
];

export const SEXES: TranslationKey[] = [
  'sex.female',
  'sex.male',
  'sex.other',
  'sex.preferNot',
];

export const CONDITIONS: TranslationKey[] = [
  'condition.thyroid',
  'condition.arthritis',
  'condition.ibd',
  'condition.skin',
  'condition.lupus',
  'condition.none',
  'condition.other',
];

export const CONCERNS: TranslationKey[] = [
  'concern.digestion',
  'concern.fatigue',
  'concern.joints',
  'concern.skin',
  'concern.fog',
  'concern.sleep',
  'concern.none',
];

export const AVOIDS: TranslationKey[] = [
  'avoid.gluten',
  'avoid.dairy',
  'avoid.nightshades',
  'avoid.eggs',
  'avoid.sugar',
  'avoid.seedOils',
  'avoid.legumes',
  'avoid.caffeine',
  'avoid.alcohol',
  'avoid.shellfish',
  'avoid.nuts',
];

/**
 * Stable slugs, in the same order as the option lists above.
 *
 * These are what the database stores — indexes would break the moment an
 * option is inserted in the middle, and display names change with language.
 */
export const GOAL_SLUGS = [
  'calm_inflammation',
  'autoimmune',
  'energy',
  'weight',
  'eat_better',
];

export const CONCERN_SLUGS = [
  'digestion',
  'fatigue',
  'joints',
  'skin',
  'brain_fog',
  'sleep',
  'none',
];

export const COUNTRY_SLUGS = ['egypt', 'saudi_arabia', 'uae', 'kuwait', 'qatar', 'elsewhere'];

export const SEX_SLUGS = ['female', 'male', 'other', 'prefer_not_to_say'];

export const ACTIVITY_SLUGS = ['seated', 'light', 'high'] as const;

export const MEAL_PATTERN_SLUGS = ['two', 'three', 'three_plus_snacks', 'four_five_small'];

export const WEIGHT_GOAL_SLUGS = ['maintain', 'gentle_loss', 'unset'] as const;

export const COMFORT_SLUGS = ['full', 'gentle', 'minimal'] as const;

export const AVOID_SLUGS = [
  'gluten',
  'dairy',
  'nightshades',
  'eggs',
  'refined_sugar',
  'seed_oils',
  'legumes',
  'caffeine',
  'alcohol',
  'shellfish',
  'tree_nuts',
];

export const CONDITION_SLUGS = [
  'hashimotos',
  'rheumatoid_arthritis',
  'ibd',
  'psoriasis',
  'lupus',
  'none',
  'other',
];

export const CUISINE_SLUGS = ['egyptian', 'levantine', 'saudi', 'gulf', 'mediterranean', 'international'];

export const CUISINES: TranslationKey[] = [
  'cuisine.egyptian',
  'cuisine.levantine',
  'cuisine.saudi',
  'cuisine.gulf',
  'cuisine.mediterranean',
  'cuisine.international',
];

export const COUNTRIES: TranslationKey[] = [
  'country.egypt',
  'country.saudi',
  'country.uae',
  'country.kuwait',
  'country.qatar',
  'country.elsewhere',
];

export const ACTIVITY_LEVELS: { name: TranslationKey; desc: TranslationKey }[] = [
  { name: 'activity.seated.name', desc: 'activity.seated.desc' },
  { name: 'activity.light.name', desc: 'activity.light.desc' },
  { name: 'activity.high.name', desc: 'activity.high.desc' },
];

export const MEALS_PER_DAY: TranslationKey[] = [
  'meals.two',
  'meals.three',
  'meals.threeSnacks',
  'meals.small',
];

export const WEIGHT_GOALS: TranslationKey[] = [
  'weightGoal.maintain',
  'weightGoal.gentleLoss',
  'weightGoal.none',
];

export const COMFORT_MODES: { name: TranslationKey; desc: TranslationKey }[] = [
  { name: 'comfort.full.name', desc: 'comfort.full.desc' },
  { name: 'comfort.gentle.name', desc: 'comfort.gentle.desc' },
  { name: 'comfort.minimal.name', desc: 'comfort.minimal.desc' },
];

export const ONBOARDING_STEPS = 10;

export const STEP_TITLES: { title: TranslationKey; subtitle?: TranslationKey }[] = [
  { title: 'onboarding.intro.title' },
  { title: 'onboarding.about.title', subtitle: 'onboarding.about.subtitle' },
  { title: 'onboarding.goal.title', subtitle: 'onboarding.goal.subtitle' },
  { title: 'onboarding.condition.title', subtitle: 'onboarding.condition.subtitle' },
  { title: 'onboarding.concern.title', subtitle: 'onboarding.concern.subtitle' },
  { title: 'onboarding.avoid.title', subtitle: 'onboarding.avoid.subtitle' },
  { title: 'onboarding.cuisine.title', subtitle: 'onboarding.cuisine.subtitle' },
  { title: 'onboarding.days.title', subtitle: 'onboarding.days.subtitle' },
  { title: 'onboarding.comfort.title', subtitle: 'onboarding.comfort.subtitle' },
  { title: 'onboarding.preview.title', subtitle: 'onboarding.preview.subtitle' },
];
