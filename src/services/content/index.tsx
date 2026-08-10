import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '../auth';
import { isSupabaseConfigured } from '../supabase';
import { BundledContentRepository } from './BundledContentRepository';
import { CachedContentRepository } from './CachedContentRepository';
import { SupabaseContentRepository } from './SupabaseContentRepository';
import { ContentRepository, FoodRecord, RecipeDetail, RecipeSummary } from './types';

export * from './types';
export { BundledContentRepository } from './BundledContentRepository';
export { CachedContentRepository } from './CachedContentRepository';
export { SupabaseContentRepository } from './SupabaseContentRepository';

export function createDefaultContentRepository(): ContentRepository {
  return isSupabaseConfigured
    ? new CachedContentRepository(new SupabaseContentRepository())
    : new BundledContentRepository();
}

type ContentValue = {
  /** The recipe library; never empty once loaded (bundled floor). */
  recipes: RecipeSummary[];
  /** The reference food catalogue, score-descending. */
  foods: FoodRecord[];
  savedSlugs: string[];
  toggleSaved: (slug: string) => void;
  getRecipe: (slug: string) => Promise<RecipeDetail | null>;
};

const ContentContext = createContext<ContentValue | null>(null);

export function ContentProvider({
  children,
  repository,
}: {
  children: React.ReactNode;
  repository?: ContentRepository;
}) {
  const repo = useMemo(() => repository ?? createDefaultContentRepository(), [repository]);
  const { session, status } = useAuth();
  const userId = session?.user.id ?? null;

  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [foods, setFoods] = useState<FoodRecord[]>([]);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);

  // The catalogue is only readable once signed in (RLS), so load then.
  useEffect(() => {
    if (status !== 'signedIn') return;
    let active = true;
    repo
      .listRecipes()
      .then((list) => {
        if (active) setRecipes(list);
      })
      .catch(() => {});
    repo
      .listFoods()
      .then((list) => {
        if (active) setFoods(list);
      })
      .catch(() => {});
    if (userId) {
      repo
        .listSavedSlugs(userId)
        .then((slugs) => {
          if (active) setSavedSlugs(slugs);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [repo, status, userId]);

  useEffect(() => {
    if (status === 'signedOut') setSavedSlugs([]);
  }, [status]);

  const toggleSaved = useCallback(
    (slug: string) => {
      if (!userId) return;
      const saved = !savedSlugs.includes(slug);
      setSavedSlugs((current) => (saved ? [...current, slug] : current.filter((s) => s !== slug)));
      repo.setSaved(userId, slug, saved).catch(() => {});
    },
    [repo, savedSlugs, userId],
  );

  const getRecipe = useCallback((slug: string) => repo.getRecipe(slug), [repo]);

  const value = useMemo<ContentValue>(
    () => ({ recipes, foods, savedSlugs, toggleSaved, getRecipe }),
    [foods, getRecipe, recipes, savedSlugs, toggleSaved],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used inside <ContentProvider>');
  return ctx;
}
