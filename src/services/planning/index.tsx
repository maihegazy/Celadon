import React, { createContext, useContext, useMemo } from 'react';
import { isSupabaseConfigured } from '../supabase';
import { LocalPlanningRepository } from './LocalPlanningRepository';
import { OfflineFirstPlanningRepository } from './OfflineFirstPlanningRepository';
import { SupabasePlanningRepository } from './SupabasePlanningRepository';
import { PlanningRepository } from './types';

export * from './types';
export { buildGroceryItems } from './seed';
export { buildGroceryItemsFromPlan } from './groceries';
export { generateWeekMeals } from './generator';
export type { GeneratorProfile } from './generator';
export { LocalPlanningRepository } from './LocalPlanningRepository';
export { OfflineFirstPlanningRepository } from './OfflineFirstPlanningRepository';
export { SupabasePlanningRepository } from './SupabasePlanningRepository';

export function createDefaultPlanningRepository(): PlanningRepository {
  return isSupabaseConfigured
    ? new OfflineFirstPlanningRepository(new SupabasePlanningRepository(), new LocalPlanningRepository())
    : new LocalPlanningRepository();
}

const PlanningContext = createContext<PlanningRepository | null>(null);

export function PlanningProvider({
  children,
  repository,
}: {
  children: React.ReactNode;
  repository?: PlanningRepository;
}) {
  const value = useMemo(() => repository ?? createDefaultPlanningRepository(), [repository]);
  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>;
}

export function usePlanningRepository() {
  const ctx = useContext(PlanningContext);
  if (!ctx) throw new Error('usePlanningRepository must be used inside <PlanningProvider>');
  return ctx;
}
