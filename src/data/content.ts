import type { TranslationKey } from '../i18n';
import { colors } from '../theme';

/**
 * Content fixtures. Structure and numbers live here; the words live in
 * `src/i18n/`, referenced by key — so a dish reads "Molokhia with grilled
 * chicken" or "ملوخية بالدجاج المشوي" from the same record.
 *
 * Swap these arrays for API responses when the backend lands; the screens
 * don't care where the objects come from.
 */

export type Meal = {
  slot: TranslationKey;
  name: TranslationKey;
  minutes: number;
  calories: number;
  badge: TranslationKey;
};

export const MEALS: Meal[] = [
  { slot: 'slot.breakfast', name: 'meal.bessara', minutes: 10, calories: 320, badge: 'badge.supportive' },
  { slot: 'slot.lunch', name: 'meal.salmonBowl', minutes: 25, calories: 540, badge: 'badge.omega3' },
  { slot: 'slot.snack', name: 'meal.walnutsDates', minutes: 2, calories: 180, badge: 'badge.supportive' },
  { slot: 'slot.dinner', name: 'meal.molokhia', minutes: 35, calories: 520, badge: 'badge.supportive' },
];

/** Home and the plan preview show breakfast, lunch and dinner. */
export const TODAY_MEALS = [MEALS[0], MEALS[1], MEALS[3]];

export const SWAP_ALTERNATIVES: { name: TranslationKey; minutes: number; calories: number; score: number }[] = [
  { name: 'meal.cod', minutes: 20, calories: 480, score: 88 },
  { name: 'meal.lentilSoup', minutes: 30, calories: 460, score: 85 },
  { name: 'meal.gingerChicken', minutes: 30, calories: 510, score: 83 },
];

export const DAY_SCORE = 84;

/* ── Recipe detail ─────────────────────────────────────────────────────── */

export const RECIPE_DETAIL = {
  score: 86,
  classification: 'Supportive' as const,
  minutes: 25,
  caloriesPerServing: 270,
  steps: ['recipe.step1', 'recipe.step2', 'recipe.step3', 'recipe.step4'] as TranslationKey[],
  substitutions: [
    { from: 'recipe.sub.quinoa.from', to: 'recipe.sub.quinoa.to' },
    { from: 'recipe.sub.avocado.from', to: 'recipe.sub.avocado.to' },
  ] as { from: TranslationKey; to: TranslationKey }[],
};

export type Tone = 'good' | 'mid' | 'flag' | 'limit';

export const toneColors: Record<Tone, { dot: string; text: string }> = {
  good: { dot: colors.green, text: colors.green },
  mid: { dot: colors.greenMid, text: colors.greenText },
  flag: { dot: colors.amber, text: colors.amber },
  limit: { dot: colors.red, text: colors.red },
};

/** Quantities scale with the servings stepper; units are localised at render. */
export const recipeIngredients = (servings: number) => {
  const halves = ['½', '1', '1½', '2'];
  return [
    { name: 'ingredient.salmon' as TranslationKey, unit: 'unit.grams' as TranslationKey, value: String(150 * servings), tag: 'tone.supportive' as TranslationKey, tone: 'good' as Tone },
    { name: 'ingredient.quinoaCooked' as TranslationKey, unit: 'unit.grams' as TranslationKey, value: String(80 * servings), tag: 'tone.balanced' as TranslationKey, tone: 'mid' as Tone },
    { name: 'ingredient.avocado' as TranslationKey, unit: null, value: halves[Math.min(servings, 4) - 1], tag: 'tone.supportive' as TranslationKey, tone: 'good' as Tone },
    { name: 'ingredient.cucumberHerbs' as TranslationKey, unit: 'unit.cup' as TranslationKey, value: String(servings), tag: 'tone.balanced' as TranslationKey, tone: 'mid' as Tone },
    { name: 'ingredient.dressing' as TranslationKey, unit: 'unit.tbsp' as TranslationKey, value: String(servings), tag: 'tone.supportive' as TranslationKey, tone: 'good' as Tone },
  ];
};

/* ── Check-in ──────────────────────────────────────────────────────────── */

export const CHECK_IN_METRICS: { name: TranslationKey; hint: TranslationKey }[] = [
  { name: 'metric.energy', hint: 'metric.energy.hint' },
  { name: 'metric.digestion', hint: 'metric.digestion.hint' },
  { name: 'metric.sleep', hint: 'metric.sleep.hint' },
  { name: 'metric.stress', hint: 'metric.stress.hint' },
  { name: 'metric.joints', hint: 'metric.joints.hint' },
  { name: 'metric.overall', hint: 'metric.overall.hint' },
];

/** Stress reads better on an amber scale — more isn't better there. */
export const INVERTED_METRIC = 3;

/* ── Shopping list ─────────────────────────────────────────────────────── */

export const GROCERY_CATEGORIES: {
  name: TranslationKey;
  items: { name: TranslationKey; qty: TranslationKey | null }[];
}[] = [
  {
    name: 'groceryCat.produce',
    items: [
      { name: 'groceryItem.molokhia', qty: 'groceryQty.pack' },
      { name: 'groceryItem.spinach', qty: 'groceryQty.bag' },
      { name: 'groceryItem.avocados', qty: 'groceryQty.three' },
      { name: 'groceryItem.cucumber', qty: 'groceryQty.four' },
      { name: 'groceryItem.lemons', qty: 'groceryQty.six' },
    ],
  },
  {
    name: 'groceryCat.protein',
    items: [
      { name: 'groceryItem.salmon', qty: 'groceryQty.twoFillets' },
      { name: 'groceryItem.chicken', qty: 'groceryQty.500g' },
      { name: 'groceryItem.walnuts', qty: 'groceryQty.bag' },
    ],
  },
  {
    name: 'groceryCat.pantry',
    items: [
      { name: 'groceryItem.quinoa', qty: 'groceryQty.box' },
      { name: 'groceryItem.oliveOil', qty: 'groceryQty.bottle' },
      { name: 'groceryItem.favaBeans', qty: 'groceryQty.500g' },
      { name: 'groceryItem.brownRice', qty: 'groceryQty.kilo' },
    ],
  },
  {
    name: 'groceryCat.herbs',
    items: [
      { name: 'groceryItem.turmeric', qty: 'groceryQty.jar' },
      { name: 'groceryItem.cumin', qty: 'groceryQty.jar' },
      { name: 'groceryItem.sumac', qty: 'groceryQty.jar' },
      { name: 'groceryItem.coriander', qty: 'groceryQty.bunch' },
    ],
  },
];

/** Custom additions land in the pantry group, as they do in the design. */
export const CUSTOM_GROCERY_CATEGORY = 2;

/* ── Diary ─────────────────────────────────────────────────────────────── */

export const DIARY_ENTRIES: {
  time: string;
  slot: TranslationKey;
  name: TranslationKey;
  calories: number;
  score: number;
}[] = [
  { time: '8:20', slot: 'slot.breakfast', name: 'meal.bessaraShort', calories: 320, score: 88 },
  { time: '1:05', slot: 'slot.lunchScanned', name: 'meal.salmonBowl', calories: 540, score: 82 },
  { time: '4:30', slot: 'slot.snack', name: 'meal.walnutsDates', calories: 180, score: 90 },
];

export const MACRO_BARS: { name: TranslationKey; value: TranslationKey; fill: number; color: string }[] = [
  { name: 'macro.protein', value: 'macro.proteinValue', fill: 0.67, color: colors.green },
  { name: 'macro.carbs', value: 'macro.carbsValue', fill: 0.72, color: colors.greenMid },
  { name: 'macro.fat', value: 'macro.fatValue', fill: 0.68, color: colors.greenPale },
];

export const WATER_GLASSES = 8;

/* ── Reintroduction ────────────────────────────────────────────────────── */

export const REINTRO_ACTIVE = { name: 'reintro.ghee' as TranslationKey, day: 2, days: 5 };

export const REINTRO_ITEMS: {
  name: TranslationKey;
  status: TranslationKey;
  tag: TranslationKey;
  tone: Tone | 'queued';
  dim: boolean;
}[] = [
  { name: 'reintro.item.eggYolks', status: 'reintro.item.eggYolks.status', tag: 'reintro.tag.passed', tone: 'good', dim: false },
  { name: 'reintro.ghee', status: 'reintro.item.ghee.status', tag: 'reintro.tag.testing', tone: 'flag', dim: false },
  { name: 'reintro.item.whiteRice', status: 'reintro.item.whiteRice.status', tag: 'reintro.tag.queued', tone: 'queued', dim: false },
  { name: 'reintro.item.nightshades', status: 'reintro.item.stage2', tag: 'reintro.tag.later', tone: 'queued', dim: true },
  { name: 'reintro.item.coffee', status: 'reintro.item.stage2', tag: 'reintro.tag.later', tone: 'queued', dim: true },
];

/* ── Recipes ───────────────────────────────────────────────────────────── */

export const RECIPE_FILTERS: TranslationKey[] = [
  'recipeFilter.all',
  'recipeFilter.quick',
  'recipeFilter.omega3',
  'recipeFilter.egyptian',
  'recipeFilter.batch',
  'recipeFilter.saved',
];
/** The design demonstrates the empty state on the "Saved" filter. */
export const SAVED_FILTER_INDEX = 5;

export const RECIPES: { name: TranslationKey; tag: TranslationKey; minutes: number }[] = [
  { name: 'meal.molokhia', tag: 'badge.supportive', minutes: 35 },
  { name: 'meal.salmonBowl', tag: 'badge.omega3', minutes: 25 },
  { name: 'meal.codShort', tag: 'badge.omega3', minutes: 20 },
  { name: 'meal.lentilSoupShort', tag: 'badge.gutGentle', minutes: 30 },
  { name: 'meal.bessaraShort', tag: 'badge.supportive', minutes: 10 },
  { name: 'meal.carrotSoup', tag: 'badge.gutGentle', minutes: 35 },
];

/* ── Progress ──────────────────────────────────────────────────────────── */

export const TREND_VALUES = [65, 40, 80, 75, 25, 85, 90, 70, 88, 92, 30, 85, 95, 90];

export const trendColor = (value: number) =>
  value < 45 ? colors.amberBar : value < 75 ? colors.trendMid : colors.green;

export const STAT_CARDS: {
  value: TranslationKey;
  name: TranslationKey;
  delta: TranslationKey;
  tone: 'good' | 'flat';
}[] = [
  { value: 'stat.avgScore.value', name: 'stat.avgScore', delta: 'stat.avgScore.delta', tone: 'good' },
  { value: 'stat.adherence.value', name: 'stat.adherence', delta: 'stat.adherence.delta', tone: 'flat' },
  { value: 'stat.calmDays.value', name: 'stat.calmDays', delta: 'stat.calmDays.delta', tone: 'good' },
  { value: 'stat.checkIns.value', name: 'stat.checkIns', delta: 'stat.checkIns.delta', tone: 'good' },
];

export const PATTERNS: { tone: Tone; text: TranslationKey }[] = [
  { tone: 'flag', text: 'pattern.nightshades' },
  { tone: 'good', text: 'pattern.sleep' },
  { tone: 'mid', text: 'pattern.ghee' },
];

export const REPORT_PATTERNS: { tone: Tone; text: TranslationKey }[] = [
  { tone: 'flag', text: 'report.pattern.nightshades' },
  { tone: 'good', text: 'report.pattern.fish' },
  { tone: 'mid', text: 'report.pattern.ghee' },
];

/* ── Explore ───────────────────────────────────────────────────────────── */

export const EXPLORE_CATEGORIES: { name: TranslationKey; dot: string }[] = [
  { name: 'exploreCat.greens', dot: colors.green },
  { name: 'exploreCat.fish', dot: colors.waterBorder },
  { name: 'exploreCat.spices', dot: colors.amber },
  { name: 'exploreCat.fermented', dot: colors.plum },
  { name: 'exploreCat.grains', dot: colors.wheat },
  { name: 'exploreCat.fruit', dot: colors.berry },
];

export const POPULAR_FOODS: {
  name: TranslationKey;
  note: TranslationKey;
  tag: TranslationKey;
  tone: 'good' | 'limit';
}[] = [
  { name: 'popular.turmeric', note: 'popular.turmeric.note', tag: 'popular.turmeric.tag', tone: 'good' },
  { name: 'popular.sumac', note: 'popular.sumac.note', tag: 'popular.sumac.tag', tone: 'good' },
  { name: 'popular.pita', note: 'popular.pita.note', tag: 'popular.pita.tag', tone: 'limit' },
];

export const COMPARE_ROWS: { key: TranslationKey; a: TranslationKey; b: TranslationKey }[] = [
  { key: 'compare.score', a: 'compare.score.a', b: 'compare.score.b' },
  { key: 'compare.sodium', a: 'compare.sodium.a', b: 'compare.sodium.b' },
  { key: 'compare.calories', a: 'compare.calories.a', b: 'compare.calories.b' },
  { key: 'compare.character', a: 'compare.character.a', b: 'compare.character.b' },
];

/* ── Notifications ─────────────────────────────────────────────────────── */

export const NOTIFICATION_GROUPS: {
  name: TranslationKey;
  items: { title: TranslationKey; body: TranslationKey; time: TranslationKey; tone: Tone }[];
}[] = [
  {
    name: 'notifs.group.today',
    items: [
      { title: 'notifs.lunch.title', body: 'notifs.lunch.body', time: 'notifs.lunch.time', tone: 'good' },
      { title: 'notifs.shopping.title', body: 'notifs.shopping.body', time: 'notifs.shopping.time', tone: 'flag' },
    ],
  },
  {
    name: 'notifs.group.week',
    items: [
      { title: 'notifs.review.title', body: 'notifs.review.body', time: 'notifs.review.time', tone: 'good' },
      { title: 'notifs.recipe.title', body: 'notifs.recipe.body', time: 'notifs.recipe.time', tone: 'mid' },
      { title: 'notifs.tweak.title', body: 'notifs.tweak.body', time: 'notifs.tweak.time', tone: 'mid' },
    ],
  },
];

/* ── Manual entry ──────────────────────────────────────────────────────── */

export const MANUAL_FOODS: {
  name: TranslationKey;
  note: TranslationKey;
  tag: TranslationKey;
  tone: 'good' | 'flag' | 'limit';
}[] = [
  { name: 'food.greenTea', note: 'food.greenTea.note', tag: 'food.tag.supportive90', tone: 'good' },
  { name: 'food.labneh', note: 'food.labneh.note', tag: 'food.tag.balanced76', tone: 'flag' },
  { name: 'food.dates', note: 'food.dates.note', tag: 'food.tag.balanced72', tone: 'flag' },
  { name: 'food.chickpeas', note: 'food.chickpeas.note', tag: 'food.tag.yourFlag', tone: 'limit' },
];

/* ── Subscription ──────────────────────────────────────────────────────── */

export const PAYWALL_FEATURES: {
  name: TranslationKey;
  free: TranslationKey;
  premium: TranslationKey;
}[] = [
  { name: 'pwFeature.scans', free: 'pwFeature.scans.free', premium: 'pwFeature.scans.premium' },
  { name: 'pwFeature.plans', free: 'pwFeature.plans.free', premium: 'pwFeature.plans.premium' },
  { name: 'pwFeature.score', free: 'pwFeature.score.free', premium: 'pwFeature.score.premium' },
  { name: 'pwFeature.patterns', free: 'pwFeature.none', premium: 'pwFeature.yes' },
  { name: 'pwFeature.reports', free: 'pwFeature.none', premium: 'pwFeature.yes' },
  { name: 'pwFeature.languages', free: 'pwFeature.yes', premium: 'pwFeature.yes' },
];

export const PAYWALL_PLANS: {
  name: TranslationKey;
  price: TranslationKey;
  note: TranslationKey;
  billed: TranslationKey;
  save: boolean;
}[] = [
  { name: 'paywall.monthly', price: 'paywall.monthly.price', note: 'paywall.monthly.note', billed: 'paywall.monthly.billed', save: false },
  { name: 'paywall.annual', price: 'paywall.annual.price', note: 'paywall.annual.note', billed: 'paywall.annual.billed', save: true },
];

/** Free tier allowance, surfaced on the scan screen and the quota wall. */
export const FREE_SCANS_PER_WEEK = 3;

/* ── Week strip ────────────────────────────────────────────────────────── */

export const WEEKDAYS: TranslationKey[] = [
  'weekday.sun',
  'weekday.mon',
  'weekday.tue',
  'weekday.wed',
  'weekday.thu',
  'weekday.fri',
  'weekday.sat',
];

/** The design's week runs 26 July – 1 August. */
export const WEEK_DATES = [26, 27, 28, 29, 30, 31, 1];
export const UNPLANNED_DAY = 6;
