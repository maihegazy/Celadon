import {
  AnalyzeRequest,
  Classification,
  ConfidenceLevel,
  DetectRequest,
  DetectionResult,
  IngredientTone,
  MealAnalysisError,
  MealAnalysisResult,
  MealAnalysisService,
} from './types';

type RemoteOptions = {
  baseUrl: string;
  /** Optional bearer token for the analysis backend. */
  token?: string;
  /** Abort an in-flight analysis after this long. */
  timeoutMs?: number;
};

/**
 * Talks to a real meal-analysis backend.
 *
 * The image is uploaded as multipart form data; the response is mapped onto
 * the same shapes the stub produces, so screens never learn where a result
 * came from. Two endpoints are expected:
 *
 *   POST {baseUrl}/detect   → { dish, confidence, ingredients[], mixed_dish }
 *   POST {baseUrl}/analyze  → { dish, score, classification, confidence,
 *                               summary, nutrition{}, ingredients[], substitutions[] }
 */
export class RemoteMealAnalysisService implements MealAnalysisService {
  constructor(private readonly options: RemoteOptions) {}

  async detect({ imageUri, source, profile }: DetectRequest): Promise<DetectionResult> {
    const form = new FormData();
    form.append('image', {
      uri: imageUri,
      name: 'meal.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    form.append('source', source);
    form.append('profile', JSON.stringify(profile));

    const data = await this.post('/detect', form);

    return {
      dish: String(data.dish ?? 'this plate'),
      confidence: Number(data.confidence ?? 0),
      mixedDishAmbiguity: Boolean(data.mixed_dish ?? false),
      ingredients: (Array.isArray(data.ingredients) ? data.ingredients : []).map(
        (item: Record<string, unknown>, index: number) => ({
          id: String(item.id ?? index),
          name: String(item.name ?? ''),
          confidence: Number(item.confidence ?? 0),
        }),
      ),
    };
  }

  async analyze({
    imageUri,
    ingredients,
    portion,
    separateItems,
    profile,
  }: AnalyzeRequest): Promise<MealAnalysisResult> {
    const form = new FormData();
    form.append('image', {
      uri: imageUri,
      name: 'meal.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    form.append('ingredients', JSON.stringify(ingredients));
    form.append('portion', portion);
    form.append('separate_items', String(separateItems));
    form.append('profile', JSON.stringify(profile));

    const data = await this.post('/analyze', form);
    const nutrition = (data.nutrition ?? {}) as Record<string, unknown>;

    return {
      dish: String(data.dish ?? 'Your meal'),
      celadonScore: Number(data.score ?? 0),
      classification: (data.classification as Classification) ?? 'Balanced',
      confidence: (data.confidence as ConfidenceLevel) ?? 'medium',
      summary: String(data.summary ?? ''),
      nutrition: {
        calories: Number(nutrition.calories ?? 0),
        protein: Number(nutrition.protein ?? 0),
        carbs: Number(nutrition.carbs ?? 0),
        fat: Number(nutrition.fat ?? 0),
        fibre: Number(nutrition.fibre ?? 0),
      },
      ingredients: (Array.isArray(data.ingredients) ? data.ingredients : []).map(
        (item: Record<string, unknown>) => ({
          name: String(item.name ?? ''),
          label: String(item.label ?? ''),
          tone: (item.tone as IngredientTone) ?? 'balanced',
          reason: String(item.reason ?? ''),
        }),
      ),
      substitutions: (Array.isArray(data.substitutions) ? data.substitutions : []).map(
        (item: Record<string, unknown>) => ({
          from: String(item.from ?? ''),
          to: String(item.to ?? ''),
        }),
      ),
    };
  }

  private async post(path: string, body: FormData): Promise<Record<string, any>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 20000);

    try {
      const response = await fetch(`${this.options.baseUrl}${path}`, {
        method: 'POST',
        body,
        signal: controller.signal,
        headers: this.options.token ? { Authorization: `Bearer ${this.options.token}` } : undefined,
      });

      if (response.status === 422) {
        // The backend looked and couldn't identify the plate — a real answer,
        // not a failure. Say so honestly rather than guessing.
        throw new MealAnalysisError(
          'unreadable',
          "We couldn't read that photo",
          'Try more light, or shoot straight down at the plate. No result is better than a wrong one.',
        );
      }
      if (!response.ok) {
        throw new MealAnalysisError(
          'unavailable',
          "We couldn't finish that scan",
          'The connection dropped before we got an answer. Your photo is still here — try again in a moment.',
        );
      }
      return (await response.json()) as Record<string, unknown>;
    } catch (error) {
      if (error instanceof MealAnalysisError) throw error;
      throw new MealAnalysisError(
        'unavailable',
        "We couldn't reach the scanner",
        "Check your connection and try again — nothing you've logged is lost.",
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
