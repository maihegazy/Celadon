import { ar } from '../../i18n/ar';
import { en } from '../../i18n/en';
import type { TranslationKey } from '../../i18n/en';
import {
  AnalysisLocale,
  AnalyzeRequest,
  DetectRequest,
  DetectionResult,
  MealAnalysisError,
  MealAnalysisResult,
  MealAnalysisService,
} from './types';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** The stub writes its results in the caller's language, like a real backend would. */
const say = (locale: AnalysisLocale, key: TranslationKey): string =>
  (locale === 'ar' ? ar[key] : en[key]) ?? en[key];

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

  async detect({ source, profile, locale }: DetectRequest): Promise<DetectionResult> {
    await delay(1500);

    const simulateFailure = this.options.simulateGalleryFailure ?? true;
    if (simulateFailure && source === 'gallery' && this.galleryAttempts === 0) {
      this.galleryAttempts += 1;
      throw new MealAnalysisError(
        'unreadable',
        say(locale, 'analysis.error.unreadable'),
        say(locale, 'analysis.error.unreadableGuidance'),
      );
    }
    if (source === 'gallery') this.galleryAttempts += 1;

    return {
      dish: say(locale, 'meal.salmonBowl'),
      confidence: 0.87,
      mixedDishAmbiguity: true,
      ingredients: [
        { id: 'salmon', name: say(locale, 'ingredient.salmonFillet'), confidence: 0.96 },
        { id: 'quinoa', name: say(locale, 'ingredient.quinoa'), confidence: 0.91 },
        { id: 'tomatoes', name: say(locale, 'ingredient.tomatoes'), confidence: 0.84 },
        { id: 'olive-oil', name: say(locale, 'ingredient.oliveOilDressing'), confidence: 0.78 },
        { id: 'feta', name: say(locale, 'ingredient.feta'), confidence: 0.72 },
      ],
    };
  }

  async analyze({ ingredients, portion, profile, locale }: AnalyzeRequest): Promise<MealAnalysisResult> {
    await delay(900);

    // Ingredient identity travels as the stable id list the confirm screen kept,
    // so this works whichever language the names were shown in.
    const kept = new Set(ingredients);
    const flags = profile.avoids.map((a) => a.toLowerCase());
    const nightshadeFlag = flags.includes('nightshades');

    const breakdown = [
      kept.has('salmon') && {
        name: say(locale, 'ingredient.salmon'),
        label: say(locale, 'tone.supportive'),
        tone: 'supportive' as const,
        reason: say(locale, 'reason.salmon'),
      },
      kept.has('olive-oil') && {
        name: say(locale, 'ingredient.oliveOil'),
        label: say(locale, 'tone.supportive'),
        tone: 'supportive' as const,
        reason: say(locale, 'reason.oliveOil'),
      },
      kept.has('quinoa') && {
        name: say(locale, 'ingredient.quinoa'),
        label: say(locale, 'tone.balanced'),
        tone: 'balanced' as const,
        reason: say(locale, 'reason.quinoa'),
      },
      kept.has('tomatoes') && {
        name: say(locale, 'ingredient.tomatoes'),
        label: say(locale, nightshadeFlag ? 'tone.flagged' : 'tone.balanced'),
        tone: nightshadeFlag ? ('flagged' as const) : ('balanced' as const),
        reason: say(locale, nightshadeFlag ? 'reason.tomatoesFlagged' : 'reason.tomatoes'),
      },
      kept.has('feta') && {
        name: say(locale, 'ingredient.feta'),
        label: say(locale, 'tone.limit'),
        tone: 'limit' as const,
        reason: say(locale, 'reason.feta'),
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
      dish: say(locale, 'meal.salmonBowl'),
      celadonScore,
      classification: celadonScore >= 75 ? 'Supportive' : celadonScore >= 55 ? 'Balanced' : 'Limit',
      confidence: 'high',
      summary: say(locale, 'analysis.summary'),
      nutrition: {
        calories,
        protein: grams(34),
        carbs: grams(42),
        fat: grams(21),
        fibre: Math.max(1, grams(6)),
      },
      ingredients: breakdown,
      substitutions: [
        { from: say(locale, 'ingredient.fetaShort'), to: say(locale, 'sub.feta') },
        { from: say(locale, 'ingredient.tomatoes'), to: say(locale, 'sub.tomatoes') },
      ],
    };
  }
}
