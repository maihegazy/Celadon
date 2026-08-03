import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { DetectionResult, MealAnalysisResult } from '../services/mealAnalysis/types';
import type { TranslationKey } from '../i18n';

export type RootStackParamList = {
  /** `step` re-enters the assessment mid-way; `returnTo` sends you back where you came from. */
  Onboarding: { step?: number; returnTo?: keyof RootStackParamList } | undefined;
  Auth: { mode?: 'signin' | 'signup' | 'forgot' } | undefined;
  Permissions: undefined;

  Home: undefined;
  Scan: undefined;
  ScanConfirm: { imageUri: string; detection: DetectionResult };
  ScanResult: { result: MealAnalysisResult; imageUri: string };
  ScanQuota: undefined;

  Plan: undefined;
  RecipeDetail: { name: TranslationKey };
  Recipes: { filter?: number } | undefined;
  Grocery: undefined;
  Diary: undefined;
  ManualAdd: undefined;

  CheckIn: undefined;
  Celebrate: undefined;
  Reintroduction: undefined;
  Progress: undefined;
  DoctorReport: undefined;

  Explore: undefined;
  Notifications: undefined;
  Profile: undefined;
  Paywall: undefined;
  TrialEnding: undefined;
  GentleMode: undefined;
  Legal: { tab?: number } | undefined;
  DeleteAccount: undefined;
  Language: undefined;
  Offline: undefined;
};

export type AppNavigation = NativeStackNavigationProp<RootStackParamList>;

export const useAppNavigation = () => useNavigation<AppNavigation>();

/**
 * Screens that keep the tab bar visible. Mirrors the prototype's `showTabs`
 * list — stacked screens like the shopping list keep it, modal-ish flows
 * (scan, paywall, onboarding) don't.
 */
export const TAB_BAR_SCREENS: (keyof RootStackParamList)[] = [
  'Home',
  'Plan',
  'Progress',
  'Profile',
  'Recipes',
  'Diary',
  'CheckIn',
  'Grocery',
  'Reintroduction',
  'Explore',
  'Notifications',
  'ManualAdd',
  'DoctorReport',
  'Legal',
  'GentleMode',
];
