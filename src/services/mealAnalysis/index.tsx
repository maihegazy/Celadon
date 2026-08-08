import React, { createContext, useContext, useMemo } from 'react';
import { isSupabaseConfigured, supabase } from '../supabase';
import { RemoteMealAnalysisService } from './RemoteMealAnalysisService';
import { StubMealAnalysisService } from './StubMealAnalysisService';
import type { MealAnalysisService } from './types';

export * from './types';
export { StubMealAnalysisService } from './StubMealAnalysisService';
export { RemoteMealAnalysisService } from './RemoteMealAnalysisService';

const MealAnalysisContext = createContext<MealAnalysisService | null>(null);

/**
 * Chooses the implementation once, at the root.
 *
 * Priority: an explicit `EXPO_PUBLIC_MEAL_ANALYSIS_URL` (with optional
 * `EXPO_PUBLIC_MEAL_ANALYSIS_TOKEN`); otherwise the project's analyze-meal
 * edge function when Supabase is configured, authenticated as the signed-in
 * user; otherwise the local stub, which keeps the demo walkable offline.
 */
export function createDefaultMealAnalysisService(): MealAnalysisService {
  const baseUrl = process.env.EXPO_PUBLIC_MEAL_ANALYSIS_URL;
  if (baseUrl) {
    return new RemoteMealAnalysisService({
      baseUrl: baseUrl.replace(/\/$/, ''),
      token: process.env.EXPO_PUBLIC_MEAL_ANALYSIS_TOKEN,
    });
  }
  if (isSupabaseConfigured) {
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;
    return new RemoteMealAnalysisService({
      baseUrl: `${(process.env.EXPO_PUBLIC_SUPABASE_URL as string).replace(/\/$/, '')}/functions/v1/analyze-meal`,
      headers: { apikey: anonKey },
      getToken: async () => {
        const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
        return data.session?.access_token ?? null;
      },
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
