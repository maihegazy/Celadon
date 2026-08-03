import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../services/auth';
import { useProfileRepository, StoredProfile } from '../services/profile';
import { assessmentSlice, useAppState } from './AppState';

/**
 * Keeps the health assessment in step with the signed-in account.
 *
 * On sign-in it loads the stored answers so a returning user finds their plan
 * as they left it. If the account has no profile yet — the case straight after
 * sign-up, when the answers were given before the account existed — the
 * answers held in memory are written up instead.
 */
export function useProfileSync() {
  const { session, status } = useAuth();
  const repository = useProfileRepository();
  const { state, dispatch } = useAppState();

  const userId = session?.user.id ?? null;
  // False while a signed-in account's stored answers are still being fetched.
  const [ready, setReady] = useState(false);
  // Guards against re-running for a user we've already reconciled.
  const syncedFor = useRef<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (status === 'signedOut') {
      setReady(true);
      return;
    }
    if (status !== 'signedIn' || !userId || syncedFor.current === userId) return;
    syncedFor.current = userId;
    setReady(false);

    let active = true;
    (async () => {
      try {
        const stored = await repository.load(userId);
        if (!active) return;

        if (stored?.onboardingComplete) {
          dispatch({ type: 'hydrate', profile: stored });
        } else if (stateRef.current.onboardingComplete) {
          // Nothing saved yet — push up whatever the assessment collected.
          await repository.save(userId, assessmentSlice(stateRef.current) as StoredProfile);
        }
      } catch {
        // Offline or a transient failure: the in-memory answers still work,
        // and the next save will reconcile.
      } finally {
        if (active) setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [dispatch, repository, status, userId]);

  // Forget the reconciliation once the account signs out.
  useEffect(() => {
    if (status === 'signedOut') syncedFor.current = null;
  }, [status]);

  /** Writes the current answers up. Called when the assessment is completed. */
  const saveProfile = useCallback(async () => {
    if (!userId) return;
    try {
      await repository.save(userId, assessmentSlice(stateRef.current) as StoredProfile);
    } catch {
      // Saving is best-effort; the answers are still live on the device.
    }
  }, [repository, userId]);

  return { saveProfile, ready };
}
