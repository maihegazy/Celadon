import {
  AnalyzeRequest,
  DetectRequest,
  DetectionResult,
  MealAnalysisError,
  MealAnalysisResult,
  MealAnalysisService,
} from './types';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * On-device stand-in for the vision model. It returns the reference plate from
 * the approved design so the whole scan journey — including the failure path —
 * is walkable without a backend.
 *
 * Point `EXPO_PUBLIC_MEAL_ANALYSIS_URL` at a real endpoint and the app uses
 * `RemoteMealAnalysisService` instead; nothing in the screens changes.
 */
export class StubMealAnalysisService implements MealAnalysisService {
  /**
   * The design specifies a "we couldn't read that photo" state, reached from a
   * gallery upload. Reproducing that here keeps the error screen reachable in
   * demos: the first gallery pick of a session fails, then behaves normally.
   */
  private galleryAttempts = 0;

  constructor(private readonly options: { simulateGalleryFailure?: boolean } = {}) {}

  async detect({ source, profile }: DetectRequest): Promise<DetectionResult> {
    await delay(1500);

    const simulateFailure = this.options.simulateGalleryFailure ?? true;
    if (simulateFailure && source === 'gallery' && this.galleryAttempts === 0) {
      this.galleryAttempts += 1;
      throw new MealAnalysisError(
        'unreadable',
        "We couldn't read that photo",
        'It looks too dark to identify confidently. Try more light, or shoot straight down at the plate. No result is better than a wrong one.',
      );
    }
    if (source === 'gallery') this.galleryAttempts += 1;

    const avoidsNightshades = profile.avoids.some((a) => a.toLowerCase() === 'nightshades');

    return {
      dish: 'salmon quinoa bowl',
      confidence: 0.87,
      mixedDishAmbiguity: true,
      ingredients: [
        { id: 'salmon', name: 'Wild salmon fillet', confidence: 0.96 },
        { id: 'quinoa', name: 'Quinoa', confidence: 0.91 },
        {
          id: 'tomatoes',
          name: avoidsNightshades ? 'Cherry tomatoes' : 'Cherry tomatoes',
          confidence: 0.84,
        },
        { id: 'olive-oil', name: 'Olive oil dressing', confidence: 0.78 },
        { id: 'feta', name: 'Feta cheese', confidence: 0.72 },
      ],
    };
  }

  async analyze({ ingredients, portion, profile }: AnalyzeRequest): Promise<MealAnalysisResult> {
    await delay(900);

    const kept = new Set(ingredients.map((i) => i.toLowerCase()));
    const has = (needle: string) => [...kept].some((i) => i.includes(needle));
    const flags = profile.avoids.map((a) => a.toLowerCase());

    const breakdown = [
      has('salmon') && {
        name: 'Wild salmon',
        label: 'Supportive',
        tone: 'supportive' as const,
        reason: 'Rich in omega-3 EPA/DHA — one of the strongest anti-inflammatory foods.',
      },
      has('olive oil') && {
        name: 'Olive oil',
        label: 'Supportive',
        tone: 'supportive' as const,
        reason: 'Oleocanthal has well-studied anti-inflammatory activity.',
      },
      has('quinoa') && {
        name: 'Quinoa',
        label: 'Balanced',
        tone: 'balanced' as const,
        reason: 'Gluten-free whole grain, gentle on most protocols.',
      },
      has('tomato') && {
        name: 'Cherry tomatoes',
        label: flags.includes('nightshades') ? 'Your flag' : 'Balanced',
        tone: flags.includes('nightshades') ? ('flagged' as const) : ('balanced' as const),
        reason: flags.includes('nightshades')
          ? 'Nightshade — on your avoid list. A small amount; swap for cucumber next time.'
          : 'Nightshade — fine for most, worth watching if your joints flare.',
      },
      has('feta') && {
        name: 'Feta cheese',
        label: 'Limit',
        tone: 'limit' as const,
        reason: "Salty aged dairy can be less supportive for some. You haven't tested dairy yet.",
      },
    ].filter(Boolean) as MealAnalysisResult['ingredients'];

    // Portion nudges the estimate; the UI is explicit that this is not a measurement.
    const portionFactor = portion === 'small' ? 0.75 : portion === 'large' ? 1.3 : 1;
    // Calories land on a round number — false precision would oversell a guess.
    const calories = Math.round((540 * portionFactor) / 5) * 5;
    const grams = (base: number) => Math.round(base * portionFactor);

    const penalties = breakdown.filter((i) => i.tone === 'flagged' || i.tone === 'limit').length * 5;
    const celadonScore = Math.max(0, Math.min(100, 92 - penalties));

    return {
      dish: 'Salmon quinoa bowl',
      celadonScore,
      classification: celadonScore >= 75 ? 'Supportive' : celadonScore >= 55 ? 'Balanced' : 'Limit',
      confidence: 'high',
      summary:
        'A strong choice. Omega-3s and olive oil do the heavy lifting; two small flags below.',
      nutrition: {
        calories,
        protein: grams(34),
        carbs: grams(42),
        fat: grams(21),
        fibre: Math.max(1, grams(6)),
      },
      ingredients: breakdown,
      substitutions: [
        { from: 'Feta', to: 'labneh (if dairy is fine) or extra avocado' },
        { from: 'Cherry tomatoes', to: 'cucumber, radish or pickled beets' },
      ],
    };
  }
}
