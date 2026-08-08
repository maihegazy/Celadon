import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from '../../i18n/en';
import { ar } from '../../i18n/ar';
import type { TranslationKey } from '../../i18n';
import { ContentRepository, RecipeDetail, RecipeSummary } from './types';

/**
 * The catalogue that ships in the binary — the same six recipes as the
 * database seed, resolved from the bundled dictionaries. Used when no
 * backend is configured, and as the last-resort fallback when the app is
 * offline with a cold cache. Saved recipes live in AsyncStorage here.
 */

const e = (key: TranslationKey) => en[key];
const a = (key: TranslationKey) => ar[key] ?? en[key];

type Fixture = {
  slug: string;
  nameKey: TranslationKey;
  minutes: number;
  baseServings: number;
  score: number;
  calories: number;
  cuisine: string;
  tags: string[];
};

/** Mirrors supabase/seed.sql — same slugs, same numbers. */
const FIXTURES: Fixture[] = [
  { slug: 'salmon-quinoa-bowl', nameKey: 'meal.salmonBowl', minutes: 25, baseServings: 2, score: 86, calories: 540, cuisine: 'mediterranean', tags: ['omega3', 'quick'] },
  { slug: 'molokhia-grilled-chicken', nameKey: 'meal.molokhia', minutes: 35, baseServings: 4, score: 88, calories: 520, cuisine: 'egyptian', tags: ['supportive', 'batch'] },
  { slug: 'zaatar-baked-cod', nameKey: 'meal.codShort', minutes: 20, baseServings: 2, score: 88, calories: 480, cuisine: 'levantine', tags: ['omega3', 'quick'] },
  { slug: 'shorbet-ads', nameKey: 'meal.lentilSoupShort', minutes: 30, baseServings: 4, score: 82, calories: 460, cuisine: 'egyptian', tags: ['gut-gentle', 'batch'] },
  { slug: 'bessara-greens', nameKey: 'meal.bessaraShort', minutes: 10, baseServings: 2, score: 84, calories: 320, cuisine: 'egyptian', tags: ['supportive', 'quick'] },
  { slug: 'ginger-carrot-soup', nameKey: 'meal.carrotSoup', minutes: 35, baseServings: 4, score: 80, calories: 260, cuisine: 'international', tags: ['gut-gentle'] },
];

const toSummary = (fixture: Fixture): RecipeSummary => ({
  id: `bundled-${fixture.slug}`,
  slug: fixture.slug,
  nameEn: e(fixture.nameKey),
  nameAr: a(fixture.nameKey),
  blurbEn: e('recipe.blurb'),
  blurbAr: a('recipe.blurb'),
  whyEn: e('recipe.why.body'),
  whyAr: a('recipe.why.body'),
  minutes: fixture.minutes,
  baseServings: fixture.baseServings,
  score: fixture.score,
  classification: 'supportive',
  calories: fixture.calories,
  cuisine: fixture.cuisine,
  tags: fixture.tags,
});

/** The one fully-written demo method — the salmon bowl from the design. */
const salmonDetail = () => ({
  ingredients: [
    { position: 1, nameKey: 'ingredient.salmon' as TranslationKey, quantity: 300, unitEn: 'g', unitAr: 'غ', tone: 'supportive' as const },
    { position: 2, nameKey: 'ingredient.quinoaCooked' as TranslationKey, quantity: 160, unitEn: 'g', unitAr: 'غ', tone: 'balanced' as const },
    { position: 3, nameKey: 'ingredient.avocado' as TranslationKey, quantity: 1, unitEn: null, unitAr: null, tone: 'supportive' as const },
    { position: 4, nameKey: 'ingredient.cucumberHerbs' as TranslationKey, quantity: 2, unitEn: 'cup', unitAr: 'كوب', tone: 'balanced' as const },
    { position: 5, nameKey: 'ingredient.dressing' as TranslationKey, quantity: 2, unitEn: 'tbsp', unitAr: 'ملعقة كبيرة', tone: 'supportive' as const },
  ].map(({ nameKey, ...rest }) => ({ ...rest, nameEn: e(nameKey), nameAr: a(nameKey) })),
  steps: (['recipe.step1', 'recipe.step2', 'recipe.step3', 'recipe.step4'] as TranslationKey[]).map(
    (key, index) => ({ position: index + 1, textEn: e(key), textAr: a(key) }),
  ),
  substitutions: [
    { fromEn: e('recipe.sub.quinoa.from'), fromAr: a('recipe.sub.quinoa.from'), toEn: e('recipe.sub.quinoa.to'), toAr: a('recipe.sub.quinoa.to') },
    { fromEn: e('recipe.sub.avocado.from'), fromAr: a('recipe.sub.avocado.from'), toEn: e('recipe.sub.avocado.to'), toAr: a('recipe.sub.avocado.to') },
  ],
});

export class BundledContentRepository implements ContentRepository {
  private savedKey = (userId: string) => `celadon.content.saved.${userId}`;

  async listRecipes(): Promise<RecipeSummary[]> {
    return FIXTURES.map(toSummary);
  }

  async getRecipe(slug: string): Promise<RecipeDetail | null> {
    const fixture = FIXTURES.find((f) => f.slug === slug);
    if (!fixture) return null;
    // Only the salmon bowl's method was written for the design; the demo
    // shows it for every recipe, exactly as the prototype did.
    return { ...toSummary(fixture), ...salmonDetail() };
  }

  async listSavedSlugs(userId: string): Promise<string[]> {
    const raw = await AsyncStorage.getItem(this.savedKey(userId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  }

  async setSaved(userId: string, slug: string, saved: boolean): Promise<void> {
    const current = await this.listSavedSlugs(userId);
    const next = saved
      ? [...current.filter((s) => s !== slug), slug]
      : current.filter((s) => s !== slug);
    await AsyncStorage.setItem(this.savedKey(userId), JSON.stringify(next));
  }
}
