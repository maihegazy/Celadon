import type { TranslationKey } from '../../i18n';

/**
 * Authentication contract.
 *
 * Screens talk to this interface only, so the Supabase-backed implementation
 * and the local one used when no backend is configured are interchangeable.
 */

export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthSession = {
  user: AuthUser;
} | null;

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

/**
 * Failures carry a translation key rather than a message, so the reason
 * reaches the user in their own language instead of the provider's English.
 */
export type AuthFailure = { ok: false; messageKey: TranslationKey };

export type AuthResult = { ok: true } | AuthFailure;

export type SignUpResult =
  | { ok: true; needsEmailConfirmation: boolean }
  | AuthFailure;

export interface AuthService {
  /** False when no backend is configured — the UI says so rather than pretending. */
  readonly isConfigured: boolean;
  /** True when this build can offer the social buttons. */
  readonly supportsOAuth: boolean;

  getSession(): Promise<AuthSession>;
  /** Subscribe to sign-in/sign-out; returns an unsubscribe function. */
  onSessionChange(listener: (session: AuthSession) => void): () => void;

  signUp(email: string, password: string): Promise<SignUpResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<AuthResult>;

  signInWithApple(): Promise<AuthResult>;
  signInWithGoogle(): Promise<AuthResult>;

  /** Erases the account and every row belonging to it. */
  deleteAccount(): Promise<AuthResult>;
}

/** Client-side checks, so obvious mistakes never reach the network. */
export function validateCredentials(email: string, password: string): AuthFailure | null {
  if (!email.trim()) return { ok: false, messageKey: 'auth.error.emailRequired' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { ok: false, messageKey: 'auth.error.invalidEmail' };
  }
  if (password.length < 8) return { ok: false, messageKey: 'auth.error.weakPassword' };
  return null;
}

export function validateEmail(email: string): AuthFailure | null {
  if (!email.trim()) return { ok: false, messageKey: 'auth.error.emailRequired' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { ok: false, messageKey: 'auth.error.invalidEmail' };
  }
  return null;
}
