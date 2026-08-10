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
  /** Catalogue slug, when the meal has a full recipe behind it. */
  recipeSlug: string | null;
};

export const MEALS: Meal[] = [
  { slot: 'slot.breakfast', name: 'meal.bessara', minutes: 10, calories: 320, badge: 'badge.supportive', recipeSlug: 'bessara-greens' },
  { slot: 'slot.lunch', name: 'meal.salmonBowl', minutes: 25, calories: 540, badge: 'badge.omega3', recipeSlug: 'salmon-quinoa-bowl' },
  { slot: 'slot.snack', name: 'meal.walnutsDates', minutes: 2, calories: 180, badge: 'badge.supportive', recipeSlug: null },
  { slot: 'slot.dinner', name: 'meal.molokhia', minutes: 35, calories: 520, badge: 'badge.supportive', recipeSlug: 'molokhia-grilled-chicken' },
];

/** Home and the plan preview show breakfast, lunch and dinner. */
export const TODAY_MEALS = [MEALS[0], MEALS[1], MEALS[3]];

/* ── Ingredient tones ──────────────────────────────────────────────────── */

export type Tone = 'good' | 'mid' | 'flag' | 'limit';

export const toneColors: Record<Tone, { dot: string; text: string }> = {
  good: { dot: colors.green, text: colors.green },
  mid: { dot: colors.greenMid, text: colors.greenText },
  flag: { dot: colors.amber, text: colors.amber },
  limit: { dot: colors.red, text: colors.red },
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

/**
 * Rough daily reference amounts the macro meters fill against. Reference
 * points for a gentle progress bar — not prescriptions, and never shown as
 * targets to hit.
 */
export const MACRO_METERS: {
  name: TranslationKey;
  key: 'proteinG' | 'carbsG' | 'fatG';
  target: number;
  color: string;
}[] = [
  { name: 'macro.protein', key: 'proteinG', target: 96, color: colors.green },
  { name: 'macro.carbs', key: 'carbsG', target: 152, color: colors.greenMid },
  { name: 'macro.fat', key: 'fatG', target: 62, color: colors.greenPale },
];

export const WATER_GLASSES = 8;

/* ── Reintroduction ────────────────────────────────────────────────────── */

/* ── Recipes ───────────────────────────────────────────────────────────── */

export const RECIPE_FILTERS: TranslationKey[] = [
  'recipeFilter.all',
  'recipeFilter.quick',
  'recipeFilter.omega3',
  'recipeFilter.egyptian',
  'recipeFilter.batch',
  'recipeFilter.saved',
];
/** Position of the "Saved" chip in RECIPE_FILTERS. */
export const SAVED_FILTER_INDEX = 5;

/* ── Progress ──────────────────────────────────────────────────────────── */

/** Bar colour for a day's calm score — quiet green when high, amber when low. */
export const trendColor = (value: number) =>
  value < 45 ? colors.amberBar : value < 75 ? colors.trendMid : colors.green;

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

