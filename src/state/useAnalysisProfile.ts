import { useMemo } from 'react';
import { AVOIDS, CONDITIONS, CUISINES } from '../data/assessment';
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
      avoids: picked(AVOIDS, state.avoids),
      conditions: picked(CONDITIONS, state.conditions),
      cuisines: picked(CUISINES, state.cuisines),
    }),
    [state.avoids, state.conditions, state.cuisines],
  );
}
