import React, { createContext, useContext, useMemo } from 'react';
import { RemoteMealAnalysisService } from './RemoteMealAnalysisService';
import { StubMealAnalysisService } from './StubMealAnalysisService';
import type { MealAnalysisService } from './types';

export * from './types';
export { StubMealAnalysisService } from './StubMealAnalysisService';
export { RemoteMealAnalysisService } from './RemoteMealAnalysisService';

const MealAnalysisContext = createContext<MealAnalysisService | null>(null);

/**
 * Chooses the implementation once, at the root. Set
 * `EXPO_PUBLIC_MEAL_ANALYSIS_URL` (and optionally
 * `EXPO_PUBLIC_MEAL_ANALYSIS_TOKEN`) to run against a real backend; without
 * them the app runs on the local stub.
 */
export function createDefaultMealAnalysisService(): MealAnalysisService {
  const baseUrl = process.env.EXPO_PUBLIC_MEAL_ANALYSIS_URL;
  if (baseUrl) {
    return new RemoteMealAnalysisService({
      baseUrl: baseUrl.replace(/\/$/, ''),
      token: process.env.EXPO_PUBLIC_MEAL_ANALYSIS_TOKEN,
    });
  }
  return new StubMealAnalysisService();
}

export function MealAnalysisProvider({
  children,
  service,
}: {
  children: React.ReactNode;
  /** Injected in tests, or to swap in a different model at runtime. */
  service?: MealAnalysisService;
}) {
  const value = useMemo(() => service ?? createDefaultMealAnalysisService(), [service]);
  return <MealAnalysisContext.Provider value={value}>{children}</MealAnalysisContext.Provider>;
}

export function useMealAnalysis() {
  const service = useContext(MealAnalysisContext);
  if (!service) throw new Error('useMealAnalysis must be used inside <MealAnalysisProvider>');
  return service;
}
