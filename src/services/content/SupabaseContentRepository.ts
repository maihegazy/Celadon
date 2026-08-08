import { requireSupabase } from '../supabase';
import {
  Classification,
  ContentRepository,
  IngredientTone,
  RecipeDetail,
  RecipeSummary,
} from './types';

const RECIPE_COLUMNS =
  'id, slug, name_en, name_ar, blurb_en, blurb_ar, why_en, why_ar, minutes, base_servings, celadon_score, classification, calories, cuisine, tags';

type RecipeRow = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  blurb_en: string | null;
  blurb_ar: string | null;
  why_en: string | null;
  why_ar: string | null;
  minutes: number;
  base_servings: number;
  celadon_score: number;
  classification: Classification;
  calories: number | null;
  cuisine: string | null;
  tags: string[] | null;
};

const rowToSummary = (row: RecipeRow): RecipeSummary => ({
  id: row.id,
  slug: row.slug,
  nameEn: row.name_en,
  nameAr: row.name_ar,
  blurbEn: row.blurb_en,
  blurbAr: row.blurb_ar,
  whyEn: row.why_en,
  whyAr: row.why_ar,
  minutes: row.minutes,
  baseServings: row.base_servings,
  score: row.celadon_score,
  classification: row.classification,
  calories: row.calories,
  cuisine: row.cuisine,
  tags: row.tags ?? [],
});

/** Read-only catalogue access; RLS allows select and nothing else. */
export class SupabaseContentRepository implements ContentRepository {
  async listRecipes(): Promise<RecipeSummary[]> {
    const { data, error } = await requireSupabase()
      .from('recipes')
      .select(RECIPE_COLUMNS)
      .order('name_en', { ascending: true })
      .returns<RecipeRow[]>();
    if (error) throw error;
    return (data ?? []).map(rowToSummary);
  }

  async getRecipe(slug: string): Promise<RecipeDetail | null> {
    const client = requireSupabase();
    const recipe = await client
      .from('recipes')
      .select(RECIPE_COLUMNS)
      .eq('slug', slug)
      .maybeSingle<RecipeRow>();
    if (recipe.error) throw recipe.error;
    if (!recipe.data) return null;

    const [ingredients, steps, substitutions] = await Promise.all([
      client
        .from('recipe_ingredients')
        .select('position, name_en, name_ar, quantity, unit_en, unit_ar, tone')
        .eq('recipe_id', recipe.data.id)
        .order('position', { ascending: true })
        .returns<
          {
            position: number;
            name_en: string;
            name_ar: string;
            quantity: number | string | null;
            unit_en: string | null;
            unit_ar: string | null;
            tone: IngredientTone;
          }[]
        >(),
      client
        .from('recipe_steps')
        .select('position, text_en, text_ar')
        .eq('recipe_id', recipe.data.id)
        .order('position', { ascending: true })
        .returns<{ position: number; text_en: string; text_ar: string }[]>(),
      client
        .from('recipe_substitutions')
        .select('from_en, from_ar, to_en, to_ar')
        .eq('recipe_id', recipe.data.id)
        .returns<{ from_en: string; from_ar: string; to_en: string; to_ar: string }[]>(),
    ]);
    if (ingredients.error) throw ingredients.error;
    if (steps.error) throw steps.error;
    if (substitutions.error) throw substitutions.error;

    return {
      ...rowToSummary(recipe.data),
      ingredients: (ingredients.data ?? []).map((row) => ({
        position: row.position,
        nameEn: row.name_en,
        nameAr: row.name_ar,
        // Numerics can arrive as strings depending on the driver.
        quantity: row.quantity === null ? null : Number(row.quantity),
        unitEn: row.unit_en,
        unitAr: row.unit_ar,
        tone: row.tone,
      })),
      steps: (steps.data ?? []).map((row) => ({
        position: row.position,
        textEn: row.text_en,
        textAr: row.text_ar,
      })),
      substitutions: (substitutions.data ?? []).map((row) => ({
        fromEn: row.from_en,
        fromAr: row.from_ar,
        toEn: row.to_en,
        toAr: row.to_ar,
      })),
    };
  }

  async listSavedSlugs(userId: string): Promise<string[]> {
    const { data, error } = await requireSupabase()
      .from('saved_recipes')
      .select('recipes ( slug )')
      .eq('user_id', userId)
      .returns<{ recipes: { slug: string } | null }[]>();
    if (error) throw error;
    return (data ?? []).map((row) => row.recipes?.slug).filter((slug): slug is string => !!slug);
  }

  async setSaved(userId: string, slug: string, saved: boolean): Promise<void> {
    const client = requireSupabase();
    const recipe = await client
      .from('recipes')
      .select('id')
      .eq('slug', slug)
      .maybeSingle<{ id: string }>();
    if (recipe.error) throw recipe.error;
    if (!recipe.data) return;

    if (saved) {
      const { error } = await client
        .from('saved_recipes')
        .upsert(
          { user_id: userId, recipe_id: recipe.data.id },
          { onConflict: 'user_id,recipe_id', ignoreDuplicates: true },
        );
      if (error) throw error;
    } else {
      const { error } = await client
        .from('saved_recipes')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipe.data.id);
      if (error) throw error;
    }
  }
}
