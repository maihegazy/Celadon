/**
 * Meal analysis contract.
 *
 * The scan flow talks to this interface only, so the on-device stub and a real
 * vision model behind an HTTP endpoint are interchangeable — see
 * `StubMealAnalysisService` and `RemoteMealAnalysisService`.
 */

export type PortionSize = 'small' | 'medium' | 'large';

export type PhotoSource = 'camera' | 'gallery';

/** How sure the model is overall. Surfaced to the user, never hidden. */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type Classification = 'Supportive' | 'Balanced' | 'Limit';

/** Why an ingredient landed where it did, relative to *this* user's profile. */
export type IngredientTone = 'supportive' | 'balanced' | 'flagged' | 'limit';

export type DetectedIngredient = {
  id: string;
  name: string;
  /** 0–1. Shown as a percentage next to each item. */
  confidence: number;
};

export type DetectionResult = {
  /** Best guess at the dish, e.g. "salmon quinoa bowl". */
  dish: string;
  /** 0–1 confidence in the dish guess. */
  confidence: number;
  ingredients: DetectedIngredient[];
  /** True when the plate might be several separate items rather than one dish. */
  mixedDishAmbiguity: boolean;
};

export type AnalyzedIngredient = {
  name: string;
  label: string;
  tone: IngredientTone;
  /** One plain sentence explaining the call. */
  reason: string;
};

export type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
};

export type MealAnalysisResult = {
  dish: string;
  /** 0–100 — how well the meal supports an anti-inflammatory pattern. */
  celadonScore: number;
  classification: Classification;
  confidence: ConfidenceLevel;
  /** Short explanation of the score, in the app's voice. */
  summary: string;
  /** Always an estimate when it comes from a photo — labelled as such in the UI. */
  nutrition: Nutrition;
  ingredients: AnalyzedIngredient[];
  substitutions: { from: string; to: string }[];
};

/** The bits of the health profile that change how a meal is scored. */
export type AnalysisProfile = {
  avoids: string[];
  conditions: string[];
  cuisines: string[];
};

export type DetectRequest = {
  imageUri: string;
  source: PhotoSource;
  profile: AnalysisProfile;
};

export type AnalyzeRequest = {
  imageUri: string;
  /** Ingredients the user kept after correcting the detection. */
  ingredients: string[];
  portion: PortionSize;
  /** Whether the user said it's one mixed dish or separate items. */
  separateItems: boolean;
  profile: AnalysisProfile;
};

export type MealAnalysisErrorCode =
  /** Too dark / too blurry to identify confidently. */
  | 'unreadable'
  /** No food found in frame. */
  | 'no_food'
  /** Network or server failure. */
  | 'unavailable';

export class MealAnalysisError extends Error {
  code: MealAnalysisErrorCode;
  /** Guidance shown on the error screen. */
  guidance: string;

  constructor(code: MealAnalysisErrorCode, message: string, guidance: string) {
    super(message);
    this.name = 'MealAnalysisError';
    this.code = code;
    this.guidance = guidance;
  }
}

export interface MealAnalysisService {
  /** Step one — identify the dish and its parts so the user can correct them. */
  detect(request: DetectRequest): Promise<DetectionResult>;
  /** Step two — score the confirmed plate against the user's profile. */
  analyze(request: AnalyzeRequest): Promise<MealAnalysisResult>;
}

export const confidenceLabel = (level: ConfidenceLevel) =>
  level === 'high' ? 'High confidence' : level === 'medium' ? 'Medium confidence' : 'Low confidence';
