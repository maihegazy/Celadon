/**
 * The shared recipe catalogue. Unlike tracking and planning this data belongs
 * to the app, not the user — every account reads the same rows, and content
 * ships by updating the database, not the binary.
 */

export type IngredientTone = 'supportive' | 'balanced' | 'flagged' | 'limit';
export type Classification = 'supportive' | 'balanced' | 'limit';

export type RecipeSummary = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  blurbEn: string | null;
  blurbAr: string | null;
  whyEn: string | null;
  whyAr: string | null;
  minutes: number;
  baseServings: number;
  score: number;
  classification: Classification;
  /** Per serving; always presented as an estimate. */
  calories: number | null;
  cuisine: string | null;
  tags: string[];
};

export type RecipeIngredient = {
  position: number;
  nameEn: string;
  nameAr: string;
  /** Quantity for `baseServings`; the app scales it with the stepper. */
  quantity: number | null;
  unitEn: string | null;
  unitAr: string | null;
  tone: IngredientTone;
};

export type RecipeStep = { position: number; textEn: string; textAr: string };

export type RecipeSubstitution = {
  fromEn: string;
  fromAr: string;
  toEn: string;
  toAr: string;
};

export type RecipeDetail = RecipeSummary & {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  substitutions: RecipeSubstitution[];
};

/** One ingredient in the shared reference catalogue (the `foods` table). */
export type FoodRecord = {
  slug: string;
  nameEn: string;
  nameAr: string;
  noteEn: string | null;
  noteAr: string | null;
  /** 0–100, how well the food supports an anti-inflammatory pattern. */
  score: number | null;
  tone: IngredientTone;
  category: string | null;
  caloriesPer100g: number | null;
};

export interface ContentRepository {
  listRecipes(): Promise<RecipeSummary[]>;
  getRecipe(slug: string): Promise<RecipeDetail | null>;
  listFoods(): Promise<FoodRecord[]>;
  /** Slugs of the recipes this user has saved. */
  listSavedSlugs(userId: string): Promise<string[]>;
  setSaved(userId: string, slug: string, saved: boolean): Promise<void>;
}
