import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from '../../i18n/en';
import { ar } from '../../i18n/ar';
import type { TranslationKey } from '../../i18n';
import { ContentRepository, FoodRecord, RecipeDetail, RecipeSummary } from './types';

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

/**
 * The reference food catalogue, mirroring supabase/seed.sql row for row.
 * Notes are stored bilingually rather than as translation keys because the
 * database rows are — the bundled copy behaves exactly like a fetched one.
 */
const FOODS: FoodRecord[] = [
  { slug: 'salmon', nameEn: 'Wild salmon', nameAr: 'سلمون بري', noteEn: 'Rich in omega-3 EPA/DHA — one of the strongest anti-inflammatory foods', noteAr: 'غني بأوميغا ٣ — من أقوى الأطعمة المضادة للالتهاب', score: 95, tone: 'supportive', category: 'fish', caloriesPer100g: 208 },
  { slug: 'olive-oil', nameEn: 'Extra-virgin olive oil', nameAr: 'زيت زيتون بكر ممتاز', noteEn: 'Oleocanthal has well-studied anti-inflammatory activity', noteAr: 'الأوليوكانثال له نشاط مضاد للالتهاب مدروس جيدًا', score: 94, tone: 'supportive', category: 'pantry', caloriesPer100g: 884 },
  { slug: 'turmeric', nameEn: 'Turmeric', nameAr: 'الكركم', noteEn: 'Curcumin — best absorbed with black pepper and fat', noteAr: 'الكركمين — يُمتصّ بشكل أفضل مع الفلفل الأسود والدهون', score: 92, tone: 'supportive', category: 'spices', caloriesPer100g: 312 },
  { slug: 'molokhia', nameEn: 'Molokhia', nameAr: 'ملوخية', noteEn: 'Leafy green, high in fibre and minerals', noteAr: 'ورق أخضر غني بالألياف والمعادن', score: 90, tone: 'supportive', category: 'greens', caloriesPer100g: 58 },
  { slug: 'green-tea', nameEn: 'Green tea', nameAr: 'شاي أخضر', noteEn: 'Anti-inflammatory catechins', noteAr: 'كاتيكينات مضادة للالتهاب', score: 90, tone: 'supportive', category: 'drinks', caloriesPer100g: 1 },
  { slug: 'walnuts', nameEn: 'Walnuts', nameAr: 'جوز', noteEn: 'Plant omega-3 (ALA) and polyphenols', noteAr: 'أوميغا ٣ نباتية ومركّبات بوليفينول', score: 89, tone: 'supportive', category: 'nuts', caloriesPer100g: 654 },
  { slug: 'sumac', nameEn: 'Sumac', nameAr: 'السمّاق', noteEn: 'Antioxidant-rich souring spice, easy daily habit', noteAr: 'بهار حامض غني بمضادات الأكسدة، عادة يومية سهلة', score: 88, tone: 'supportive', category: 'spices', caloriesPer100g: 260 },
  { slug: 'quinoa', nameEn: 'Quinoa', nameAr: 'كينوا', noteEn: 'Gluten-free whole grain, gentle on most protocols', noteAr: 'حبة كاملة خالية من الغلوتين، لطيفة على معظم الأنظمة', score: 76, tone: 'balanced', category: 'grains', caloriesPer100g: 120 },
  { slug: 'labneh', nameEn: 'Labneh', nameAr: 'لبنة', noteEn: 'Strained, probiotic — daily-friendly', noteAr: 'مصفّاة وغنية بالبروبيوتيك — مناسبة يوميًا', score: 76, tone: 'balanced', category: 'dairy', caloriesPer100g: 160 },
  { slug: 'chickpeas', nameEn: 'Chickpeas', nameAr: 'حمص', noteEn: 'Legume — excluded on some protocols', noteAr: 'من البقوليات — مستبعدة في بعض الأنظمة', score: 74, tone: 'balanced', category: 'legumes', caloriesPer100g: 164 },
  { slug: 'dates', nameEn: 'Dates', nameAr: 'تمر', noteEn: 'Natural sweetness, some fibre', noteAr: 'حلاوة طبيعية وبعض الألياف', score: 72, tone: 'balanced', category: 'produce', caloriesPer100g: 282 },
  { slug: 'tomatoes', nameEn: 'Cherry tomatoes', nameAr: 'طماطم كرزية', noteEn: 'Nightshade — fine for most, worth watching if your joints flare', noteAr: 'من الباذنجانيات — مناسبة لمعظم الناس، وتستحق الملاحظة إن تهيّجت مفاصلك', score: 70, tone: 'balanced', category: 'produce', caloriesPer100g: 18 },
  { slug: 'feta', nameEn: 'Feta', nameAr: 'جبن فيتا', noteEn: 'Aged, salty — occasional accent', noteAr: 'معتّقة ومملّحة — لمسة عرضية', score: 46, tone: 'limit', category: 'dairy', caloriesPer100g: 265 },
  { slug: 'white-pita', nameEn: 'White pita', nameAr: 'العيش الأبيض', noteEn: 'Refined flour — contains gluten', noteAr: 'دقيق مكرر — يحتوي على الغلوتين', score: 38, tone: 'limit', category: 'grains', caloriesPer100g: 275 },
];

/** The one fully-written demo method — the salmon bowl from the design. */
const salmonDetail = () => ({
  ingredients: [
    { position: 1, nameKey: 'ingredient.salmon' as TranslationKey, quantity: 300, unitEn: 'g', unitAr: 'غ', tone: 'supportive' as const, foodSlug: 'salmon' },
    { position: 2, nameKey: 'ingredient.quinoaCooked' as TranslationKey, quantity: 160, unitEn: 'g', unitAr: 'غ', tone: 'balanced' as const, foodSlug: 'quinoa' },
    { position: 3, nameKey: 'ingredient.avocado' as TranslationKey, quantity: 1, unitEn: null, unitAr: null, tone: 'supportive' as const, foodSlug: null },
    { position: 4, nameKey: 'ingredient.cucumberHerbs' as TranslationKey, quantity: 2, unitEn: 'cup', unitAr: 'كوب', tone: 'balanced' as const, foodSlug: null },
    { position: 5, nameKey: 'ingredient.dressing' as TranslationKey, quantity: 2, unitEn: 'tbsp', unitAr: 'ملعقة كبيرة', tone: 'supportive' as const, foodSlug: 'olive-oil' },
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

  async listFoods(): Promise<FoodRecord[]> {
    // Same ordering as the backend query: strongest score first.
    return [...FOODS].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
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
