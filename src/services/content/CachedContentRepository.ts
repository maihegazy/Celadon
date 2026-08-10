import AsyncStorage from '@react-native-async-storage/async-storage';
import { BundledContentRepository } from './BundledContentRepository';
import { ContentRepository, FoodRecord, RecipeDetail, RecipeSummary } from './types';

/**
 * Reads from the backend, remembers the result on device, and serves the
 * remembered copy when offline. The bundled catalogue is the floor: the
 * recipe library is never empty, whatever the connection is doing.
 *
 * Saving is write-through: the on-device copy updates first so the button
 * responds instantly, then the backend, best-effort.
 */
export class CachedContentRepository implements ContentRepository {
  private listKey = 'celadon.content.recipes';
  private foodsKey = 'celadon.content.foods';
  private detailKey = (slug: string) => `celadon.content.recipe.${slug}`;

  constructor(
    private remote: ContentRepository,
    private bundled = new BundledContentRepository(),
  ) {}

  async listRecipes(): Promise<RecipeSummary[]> {
    try {
      const recipes = await this.remote.listRecipes();
      if (recipes.length > 0) {
        await AsyncStorage.setItem(this.listKey, JSON.stringify(recipes));
        return recipes;
      }
    } catch {
      // Offline — fall through to the cache.
    }
    const cached = await AsyncStorage.getItem(this.listKey);
    if (cached) return JSON.parse(cached) as RecipeSummary[];
    return this.bundled.listRecipes();
  }

  async listFoods(): Promise<FoodRecord[]> {
    try {
      const foods = await this.remote.listFoods();
      if (foods.length > 0) {
        await AsyncStorage.setItem(this.foodsKey, JSON.stringify(foods));
        return foods;
      }
    } catch {
      // Offline — fall through to the cache.
    }
    const cached = await AsyncStorage.getItem(this.foodsKey);
    if (cached) return JSON.parse(cached) as FoodRecord[];
    return this.bundled.listFoods();
  }

  async getRecipe(slug: string): Promise<RecipeDetail | null> {
    try {
      const recipe = await this.remote.getRecipe(slug);
      if (recipe) {
        await AsyncStorage.setItem(this.detailKey(slug), JSON.stringify(recipe));
        return recipe;
      }
    } catch {
      // Offline — fall through to the cache.
    }
    const cached = await AsyncStorage.getItem(this.detailKey(slug));
    if (cached) return JSON.parse(cached) as RecipeDetail;
    return this.bundled.getRecipe(slug);
  }

  async listSavedSlugs(userId: string): Promise<string[]> {
    try {
      const slugs = await this.remote.listSavedSlugs(userId);
      // The bundled repository doubles as the on-device copy of saves.
      await AsyncStorage.setItem(`celadon.content.saved.${userId}`, JSON.stringify(slugs));
      return slugs;
    } catch {
      return this.bundled.listSavedSlugs(userId);
    }
  }

  async setSaved(userId: string, slug: string, saved: boolean): Promise<void> {
    await this.bundled.setSaved(userId, slug, saved);
    try {
      await this.remote.setSaved(userId, slug, saved);
    } catch {
      // Offline: the save is on-device and will reconcile on next sign-in load.
    }
  }
}
