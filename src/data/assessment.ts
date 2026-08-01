/**
 * Assessment copy and options — verbatim from the approved design. The wording
 * is deliberately non-clinical: Celadon plans around what you tell it, it never
 * claims to diagnose or treat.
 */

export const GOALS = [
  'Calm inflammation',
  'Support an autoimmune condition',
  'More energy, less fatigue',
  'A gentle weight goal',
  'Simply eat better',
];

export const CONDITIONS = [
  "Hashimoto's / thyroid",
  'Rheumatoid arthritis',
  "IBD / Crohn's / colitis",
  'Psoriasis or eczema',
  'Lupus',
  'No diagnosis — just want less inflammation',
  'Something else',
];

export const CONCERNS = [
  'Digestive discomfort',
  'Fatigue',
  'Joint discomfort',
  'Skin flare-ups',
  'Brain fog',
  'Poor sleep',
  'None of these',
];

export const AVOIDS = [
  'Gluten',
  'Dairy',
  'Nightshades',
  'Eggs',
  'Refined sugar',
  'Seed oils',
  'Legumes',
  'Caffeine',
  'Alcohol',
  'Shellfish',
  'Tree nuts',
];

export const CUISINES = ['Egyptian', 'Levantine', 'Saudi', 'Gulf', 'Mediterranean', 'International'];

export const COUNTRIES = ['Egypt', 'Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Elsewhere'];

export const ACTIVITY_LEVELS = [
  { name: 'Mostly seated', desc: 'Desk work, light walking' },
  { name: 'Lightly active', desc: 'On your feet part of the day' },
  { name: 'Very active', desc: 'Regular training or an active job' },
];

export const MEALS_PER_DAY = ['2 meals', '3 meals', '3 + snacks', '4–5 small'];

export const WEIGHT_GOALS = ['Maintain', 'Gentle loss', 'Prefer not to set'];

export const COMFORT_MODES = [
  {
    name: 'Show everything',
    desc: 'Calories, macros and portions alongside the Celadon Score.',
  },
  {
    name: 'Gentle mode',
    desc: 'No calories, weights or numbers. Focus on how foods make you feel.',
  },
  {
    name: 'Minimal',
    desc: 'Just meal ideas and a simple supportive / limit signal.',
  },
];

export const ONBOARDING_STEPS = 9;

export const STEP_TITLES: { title: string; subtitle?: string }[] = [
  { title: 'A calmer way to eat well.' },
  { title: 'What brings you to Celadon?', subtitle: 'Your main goal shapes everything else.' },
  {
    title: 'Living with a diagnosis?',
    subtitle: 'Pick anything that applies. This shapes your plan — Celadon never diagnoses or treats.',
  },
  {
    title: "Anything your body's been telling you?",
    subtitle: "We'll pay gentle attention to these in your plan and check‑ins.",
  },
  {
    title: "Anything you'd like to avoid?",
    subtitle:
      "Allergies, intolerances and foods you'd rather skip. Nothing is forbidden — we simply plan around them.",
  },
  {
    title: 'What does home taste like?',
    subtitle: 'Your plan should feel familiar, not foreign. Pick as many as you like.',
  },
  { title: 'A little about your days', subtitle: 'So portions and meal timing fit your life.' },
  {
    title: 'How should we talk about food?',
    subtitle:
      'If numbers around food feel stressful, we can leave them out. Your relationship with eating matters more than any metric.',
  },
  { title: 'Your plan, ready.', subtitle: "Here's what Celadon will build around:" },
];

export const NEXT_LABELS = [
  '',
  'Continue',
  'Continue',
  'Continue',
  'Continue',
  'Continue',
  'Continue',
  'Continue',
  'Create my plan',
];
