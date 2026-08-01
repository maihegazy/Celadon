import { colors } from '../theme';

/**
 * Content fixtures for the prototype build — the meals, recipes, insights and
 * copy from the approved design. Regional dishes are deliberate: the plan
 * should read as familiar food in Cairo or Jeddah, not imported health food.
 *
 * Everything here is presentation data. Swap these arrays for API responses
 * when the backend lands; the screens don't care where the objects come from.
 */

export type Meal = {
  slot: string;
  name: string;
  minutes: number;
  calories: number;
  badge: string;
};

export const MEALS: Meal[] = [
  { slot: 'Breakfast', name: 'Bessara with greens & olive oil', minutes: 10, calories: 320, badge: 'Supportive' },
  { slot: 'Lunch', name: 'Salmon quinoa bowl', minutes: 25, calories: 540, badge: 'Omega-3' },
  { slot: 'Snack', name: 'Walnuts & dates', minutes: 2, calories: 180, badge: 'Supportive' },
  { slot: 'Dinner', name: 'Molokhia with grilled chicken', minutes: 35, calories: 520, badge: 'Supportive' },
];

/** Home and the plan preview show breakfast, lunch and dinner. */
export const TODAY_MEALS = [MEALS[0], MEALS[1], MEALS[3]];

export const mealMeta = (meal: Meal, numbersOn: boolean) =>
  numbersOn ? `${meal.minutes} min · ${meal.calories} cal` : `${meal.minutes} min`;

export const SWAP_ALTERNATIVES = [
  { name: "Za'atar baked cod & sautéed greens", minutes: 20, calories: 480, score: 88 },
  { name: 'Shorbet ads with brown rice', minutes: 30, calories: 460, score: 85 },
  { name: 'Ginger-turmeric chicken & rice', minutes: 30, calories: 510, score: 83 },
];

export const DAY_SCORE = 84;
export const DAY_MACROS = '1,560 cal · P 96g · C 152g · F 62g · Fibre 31g';
export const DAY_MACROS_GENTLE = 'Balanced across the day — no numbers in gentle mode';

export const PLAN_RATIONALE =
  'every day hits 2+ omega-3 sources, stays clear of your gluten and nightshade flags, and leans on the Egyptian and Mediterranean dishes you chose.';

/* ── Recipe detail ─────────────────────────────────────────────────────── */

export const RECIPE_DETAIL = {
  score: 86,
  classification: 'Supportive',
  minutes: 25,
  caloriesPerServing: 270,
  blurb: 'Wild salmon over herbed quinoa with cucumber, avocado and a lemon–olive oil dressing.',
  why:
    'Salmon and olive oil are among the best-studied foods for an anti-inflammatory pattern. This recipe avoids your flagged triggers: gluten and nightshades.',
  steps: [
    'Rinse the quinoa and simmer 15 minutes with a pinch of salt.',
    'Season the salmon with lemon, cumin and olive oil; grill 4 minutes per side.',
    'Toss cucumber and herbs with the lemon–olive oil dressing.',
    'Assemble over the quinoa, top with avocado and finish with sumac.',
  ],
  substitutions: [
    { from: 'Quinoa', to: 'brown rice, if quinoa is hard to find' },
    { from: 'Avocado', to: 'extra olive oil and toasted walnuts' },
  ],
};

/** Quantities scale with the servings stepper. */
export const recipeIngredients = (servings: number) => {
  const halves = ['½', '1', '1½', '2'];
  return [
    { name: 'Wild salmon', qty: `${150 * servings}g`, tag: 'Supportive', tone: 'good' as const },
    { name: 'Quinoa, cooked', qty: `${80 * servings}g`, tag: 'Balanced', tone: 'mid' as const },
    { name: 'Avocado', qty: halves[Math.min(servings, 4) - 1], tag: 'Supportive', tone: 'good' as const },
    { name: 'Cucumber & herbs', qty: `${servings} cup`, tag: 'Balanced', tone: 'mid' as const },
    { name: 'Lemon–olive oil dressing', qty: `${servings} tbsp`, tag: 'Supportive', tone: 'good' as const },
  ];
};

export const toneColors = {
  good: { dot: colors.green, text: colors.green },
  mid: { dot: colors.greenMid, text: colors.greenText },
  flag: { dot: colors.amber, text: colors.amber },
  limit: { dot: colors.red, text: colors.red },
} as const;

export type Tone = keyof typeof toneColors;

/* ── Check-in ──────────────────────────────────────────────────────────── */

export const CHECK_IN_METRICS = [
  { name: 'Energy', hint: 'drained → energized' },
  { name: 'Digestion', hint: 'rough → settled' },
  { name: 'Sleep', hint: 'restless → rested' },
  { name: 'Stress', hint: 'calm → high' },
  { name: 'Joint comfort', hint: 'achy → easy' },
  { name: 'Overall', hint: 'low → good' },
];

/** Stress reads better on an amber scale — more isn't better there. */
export const INVERTED_METRIC = 3;

/* ── Shopping list ─────────────────────────────────────────────────────── */

export const GROCERY_CATEGORIES: { name: string; items: [string, string][] }[] = [
  {
    name: 'Produce',
    items: [
      ['Molokhia leaves (frozen ok)', '1 pack'],
      ['Baby spinach', '1 bag'],
      ['Avocados', '3'],
      ['Cucumber', '4'],
      ['Lemons', '6'],
    ],
  },
  {
    name: 'Protein',
    items: [
      ['Wild salmon', '2 fillets'],
      ['Chicken thighs', '500g'],
      ['Walnuts', '1 bag'],
    ],
  },
  {
    name: 'Pantry',
    items: [
      ['Quinoa', '1 box'],
      ['Extra-virgin olive oil', '1 bottle'],
      ['Split fava beans (bessara)', '500g'],
      ['Brown rice', '1 kg'],
    ],
  },
  {
    name: 'Herbs & spices',
    items: [
      ['Turmeric', '1 jar'],
      ['Cumin', '1 jar'],
      ['Sumac', '1 jar'],
      ['Fresh coriander', '1 bunch'],
    ],
  },
];

/** Custom additions land in the pantry group, as they do in the design. */
export const CUSTOM_GROCERY_CATEGORY = 2;

/* ── Diary ─────────────────────────────────────────────────────────────── */

export const DIARY_ENTRIES = [
  { time: '8:20', slot: 'Breakfast', name: 'Bessara with greens', calories: 320, score: 88 },
  { time: '1:05', slot: 'Lunch · scanned', name: 'Salmon quinoa bowl', calories: 540, score: 82 },
  { time: '4:30', slot: 'Snack', name: 'Walnuts & dates', calories: 180, score: 90 },
];

export const MACRO_BARS = [
  { name: 'Protein', value: '64 / 96g', fill: 0.67, color: colors.green },
  { name: 'Carbs', value: '110 / 152g', fill: 0.72, color: colors.greenMid },
  { name: 'Fat', value: '42 / 62g', fill: 0.68, color: colors.greenPale },
];

export const WATER_GLASSES = 8;

/* ── Reintroduction ────────────────────────────────────────────────────── */

export const REINTRO_ACTIVE = {
  name: 'Ghee',
  day: 2,
  days: 5,
  note: 'No symptoms logged so far. Keep portions steady and check in daily.',
};

export const REINTRO_ITEMS = [
  { name: 'Egg yolks', status: 'Reintroduced 3 weeks ago', tag: 'Passed', tone: 'good' as Tone, dim: false },
  { name: 'Ghee', status: 'Testing — day 2 of 5', tag: 'Testing', tone: 'flag' as Tone, dim: false },
  { name: 'White rice', status: "Up next when you're ready", tag: 'Queued', tone: 'queued' as const, dim: false },
  { name: 'Nightshades', status: 'Stage 2 — after current stage', tag: 'Later', tone: 'queued' as const, dim: true },
  { name: 'Coffee', status: 'Stage 2 — after current stage', tag: 'Later', tone: 'queued' as const, dim: true },
];

/* ── Recipes ───────────────────────────────────────────────────────────── */

export const RECIPE_FILTERS = ['All', 'Under 20 min', 'Omega-3 rich', 'Egyptian', 'Batch cook', 'Saved'];
/** The design demonstrates the empty state on the "Saved" filter. */
export const SAVED_FILTER_INDEX = 5;

export const RECIPES = [
  { name: 'Molokhia with grilled chicken', tag: 'Supportive', time: '35 min' },
  { name: 'Salmon quinoa bowl', tag: 'Omega-3', time: '25 min' },
  { name: "Za'atar baked cod", tag: 'Omega-3', time: '20 min' },
  { name: 'Shorbet ads (red lentil soup)', tag: 'Gut-gentle', time: '30 min' },
  { name: 'Bessara with greens', tag: 'Supportive', time: '10 min' },
  { name: 'Ginger carrot soup', tag: 'Gut-gentle', time: '35 min' },
];

/* ── Progress ──────────────────────────────────────────────────────────── */

export const TREND_VALUES = [65, 40, 80, 75, 25, 85, 90, 70, 88, 92, 30, 85, 95, 90];

export const trendColor = (value: number) =>
  value < 45 ? colors.amberBar : value < 75 ? colors.trendMid : colors.green;

export const STAT_CARDS = [
  { value: '84', name: 'Avg Celadon Score', delta: '↑ 6 vs last month', tone: 'good' as const },
  { value: '78%', name: 'Plan adherence', delta: 'steady', tone: 'flat' as const },
  { value: '11 / 14', name: 'Calm days', delta: 'best stretch yet', tone: 'good' as const },
  { value: '12', name: 'Check-ins', delta: '↑ 3 this week', tone: 'good' as const },
];

export const PATTERNS = [
  {
    tone: 'flag' as Tone,
    text: 'Joint discomfort shows up **2× more often** within a day of eating nightshades.',
  },
  {
    tone: 'good' as Tone,
    text: 'Days above 80 on the Celadon Score tend to be followed by **better sleep check-ins**.',
  },
  { tone: 'mid' as Tone, text: 'Ghee reintroduction: **no symptom change** so far.' },
];

export const REPORT_PATTERNS = [
  { tone: 'flag' as Tone, text: 'Joint discomfort reported 2× more often within a day of nightshade meals.' },
  { tone: 'good' as Tone, text: 'Weeks with 3+ fish meals averaged 1.8 more calm days.' },
  { tone: 'mid' as Tone, text: 'Ghee reintroduction (in progress): no symptom change through day 2.' },
];

export const WEEKLY_INSIGHT =
  'Your most supportive choices were fish dinners — weeks with 3+ average 1.8 more calm days.';

/* ── Explore ───────────────────────────────────────────────────────────── */

export const EXPLORE_CATEGORIES = [
  { name: 'Leafy greens', dot: colors.green },
  { name: 'Omega-3 fish', dot: colors.waterBorder },
  { name: 'Spices & herbs', dot: colors.amber },
  { name: 'Fermented', dot: colors.plum },
  { name: 'Whole grains', dot: colors.wheat },
  { name: 'Berries & fruit', dot: colors.berry },
];

export const POPULAR_FOODS = [
  {
    name: 'Turmeric',
    note: 'Curcumin — best absorbed with black pepper and fat',
    tag: 'Supportive · 92',
    tone: 'good' as const,
  },
  {
    name: 'Sumac',
    note: 'Antioxidant-rich souring spice, easy daily habit',
    tag: 'Supportive · 88',
    tone: 'good' as const,
  },
  {
    name: 'White pita',
    note: 'Refined flour — contains gluten, on your avoid list',
    tag: 'Limit · 38',
    tone: 'limit' as const,
  },
];

export const COMPARE_ROWS = [
  { key: 'Celadon Score', a: '46 — Limit', b: '76 — Balanced' },
  { key: 'Sodium', a: 'High', b: 'Moderate' },
  { key: 'Calories / 100g', a: '265', b: '160' },
  { key: 'Character', a: 'Aged, salty — occasional accent', b: 'Strained, probiotic — daily-friendly' },
];

export const COMPARE_VERDICT =
  'For daily use, labneh is the easier choice — strained, probiotic and less salty. Feta still has a place as an occasional accent.';

/* ── Notifications ─────────────────────────────────────────────────────── */

export const NOTIFICATION_GROUPS = [
  {
    name: 'Today',
    items: [
      {
        title: 'Lunch is coming up',
        body: 'Salmon quinoa bowl — 25 min. Start the quinoa now and the rest is quick.',
        time: '12:30',
        tone: 'good' as Tone,
      },
      {
        title: 'Shopping reminder',
        body: "12 items left before Sunday's plan starts. The list is ready when you are.",
        time: '9:00',
        tone: 'flag' as Tone,
      },
    ],
  },
  {
    name: 'This week',
    items: [
      {
        title: 'Your week in review',
        body: 'Average Celadon Score 84 — up 6 points. Fish dinners did the heavy lifting.',
        time: 'Mon',
        tone: 'good' as Tone,
      },
      {
        title: 'New for you',
        body: "Za'atar baked cod — 20 minutes, omega-3 rich, fits every one of your flags.",
        time: 'Sun',
        tone: 'mid' as Tone,
      },
      {
        title: 'A gentle tweak',
        body: "We lightened Thursday's dinner — your evening check-ins have felt heavy lately.",
        time: 'Sun',
        tone: 'mid' as Tone,
      },
    ],
  },
];

/* ── Manual entry ──────────────────────────────────────────────────────── */

export const MANUAL_FOODS = [
  { name: 'Green tea', note: 'Anti-inflammatory catechins', tag: 'Supportive · 90', tone: 'good' as const },
  { name: 'Labneh & cucumber', note: 'Strained, probiotic', tag: 'Balanced · 76', tone: 'flag' as const },
  { name: 'Dates (2)', note: 'Natural sweetness, some fibre', tag: 'Balanced · 72', tone: 'flag' as const },
  { name: 'Roasted chickpeas', note: 'Legume — on your avoid list', tag: 'Your flag', tone: 'limit' as const },
];

/* ── Subscription ──────────────────────────────────────────────────────── */

export const PAYWALL_FEATURES = [
  { name: 'AI meal scans', free: '3 / week', premium: 'Unlimited' },
  { name: 'Personal meal plans', free: '1 week', premium: 'Adaptive weekly' },
  { name: 'Celadon Score', free: 'Basic', premium: 'Full breakdown' },
  { name: 'Pattern detection', free: '—', premium: '✓' },
  { name: 'Doctor-ready reports', free: '—', premium: '✓' },
  { name: 'Arabic & English', free: '✓', premium: '✓' },
];

export const PAYWALL_PLANS = [
  { name: 'Monthly', price: 'EGP 249', note: 'per month', save: false, billed: 'EGP 249 / month' },
  {
    name: 'Annual',
    price: 'EGP 166',
    note: 'per month · EGP 1,990 / yr',
    save: true,
    billed: 'EGP 1,990 / year',
  },
];

/** Free tier allowance, surfaced on the scan screen and the quota wall. */
export const FREE_SCANS_PER_WEEK = 3;

/* ── Misc copy ─────────────────────────────────────────────────────────── */

export const DATE_LABEL = 'Saturday, August 1';

export const HOME_FOCUS = {
  eyebrow: "Today's gentle focus",
  title: 'Add one omega‑3 source — your salmon bowl at lunch has it covered.',
  note: "Small steps compound. That's the whole plan.",
};

export const MEDICAL_NOTE =
  "Celadon offers nutrition guidance and pattern observations. It doesn't diagnose, treat or cure any condition — please keep working with your doctor or nutritionist.";
