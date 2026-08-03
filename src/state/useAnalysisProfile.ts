import { useMemo } from 'react';
import { AVOID_SLUGS, CONDITION_SLUGS, CUISINE_SLUGS } from '../data/assessment';
import type { AnalysisProfile } from '../services/mealAnalysis';
import { useAppState } from './AppState';

const picked = (list: string[], map: Record<number, boolean>) => list.filter((_, i) => map[i]);

/**
 * Projects the assessment answers into the slice the analyser needs, so a
 * scan is scored against *this* person's flags rather than a generic protocol.
 */
export function useAnalysisProfile(): AnalysisProfile {
  const { state } = useAppState();
  return useMemo(
    () => ({
      avoids: picked(AVOID_SLUGS, state.avoids),
      conditions: picked(CONDITION_SLUGS, state.conditions),
      cuisines: picked(CUISINE_SLUGS, state.cuisines),
    }),
    [state.avoids, state.conditions, state.cuisines],
  );
}
