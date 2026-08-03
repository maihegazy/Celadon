import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured } from '../supabase';
import { LocalAuthService } from './LocalAuthService';
import { SupabaseAuthService } from './SupabaseAuthService';
import type { AuthService, AuthSession, AuthStatus } from './types';

export * from './types';
export { SupabaseAuthService } from './SupabaseAuthService';
export { LocalAuthService } from './LocalAuthService';

/** Supabase when it's configured, the device-only stand-in otherwise. */
export function createDefaultAuthService(): AuthService {
  return isSupabaseConfigured ? new SupabaseAuthService() : new LocalAuthService();
}

type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession;
  service: AuthService;
  /** Whether a real backend is behind this build. */
  isConfigured: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  service,
}: {
  children: React.ReactNode;
  /** Injected in tests. */
  service?: AuthService;
}) {
  const auth = useMemo(() => service ?? createDefaultAuthService(), [service]);
  const [session, setSession] = useState<AuthSession>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let active = true;

    auth
      .getSession()
      .then((restored) => {
        if (!active) return;
        setSession(restored);
        setStatus(restored ? 'signedIn' : 'signedOut');
      })
      .catch(() => {
        // A failed restore means "not signed in", not a broken app.
        if (active) setStatus('signedOut');
      });

    const unsubscribe = auth.onSessionChange((next) => {
      if (!active) return;
      setSession(next);
      setStatus(next ? 'signedIn' : 'signedOut');
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, service: auth, isConfigured: auth.isConfigured }),
    [auth, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Convenience wrapper that tracks in-flight state for a single action. */
export function useAuthAction() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    setBusy(true);
    try {
      return await action();
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, run };
}
