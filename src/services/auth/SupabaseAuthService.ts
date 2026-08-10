import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { AuthError, Session } from '@supabase/supabase-js';
import type { TranslationKey } from '../../i18n';
import { requireSupabase } from '../supabase';
import {
  AuthResult,
  AuthService,
  AuthSession as CeladonSession,
  SignUpResult,
} from './types';

/** Where the OAuth provider sends the user back to. */
const redirectTo = AuthSession.makeRedirectUri({ scheme: 'celadon', path: 'auth/callback' });

/**
 * Maps provider errors onto our own vocabulary. Supabase messages are English
 * and change between versions, so the UI never shows them directly.
 */
function messageKeyFor(error: AuthError | null): TranslationKey {
  const text = (error?.message ?? '').toLowerCase();
  const status = error?.status ?? 0;

  if (text.includes('invalid login credentials')) return 'auth.error.invalidCredentials';
  if (text.includes('email not confirmed')) return 'auth.error.emailNotConfirmed';
  if (text.includes('already registered') || text.includes('already been registered')) {
    return 'auth.error.emailTaken';
  }
  if (text.includes('password') && text.includes('should be at least')) return 'auth.error.weakPassword';
  if (text.includes('unable to validate email') || text.includes('invalid email')) {
    return 'auth.error.invalidEmail';
  }
  if (status === 429 || text.includes('rate limit') || text.includes('too many')) {
    return 'auth.error.rateLimited';
  }
  if (text.includes('network') || text.includes('fetch') || status === 0) return 'auth.error.network';
  return 'auth.error.generic';
}

const toSession = (session: Session | null): CeladonSession =>
  session?.user
    ? {
        user: {
          id: session.user.id,
          email: session.user.email ?? null,
          createdAt: session.user.created_at ?? null,
        },
      }
    : null;

/**
 * Real authentication, backed by Supabase Auth.
 *
 * Sessions are stored in AsyncStorage by the client and refreshed in the
 * background, so a signed-in user stays signed in across relaunches.
 */
export class SupabaseAuthService implements AuthService {
  readonly isConfigured = true;
  readonly supportsOAuth = true;

  async getSession(): Promise<CeladonSession> {
    const { data } = await requireSupabase().auth.getSession();
    return toSession(data.session);
  }

  onSessionChange(listener: (session: CeladonSession) => void): () => void {
    const { data } = requireSupabase().auth.onAuthStateChange((_event, session) => {
      listener(toSession(session));
    });
    return () => data.subscription.unsubscribe();
  }

  async signUp(email: string, password: string): Promise<SignUpResult> {
    const { data, error } = await requireSupabase().auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) return { ok: false, messageKey: messageKeyFor(error) };

    // With email confirmation switched on, Supabase returns a user but no
    // session — the account isn't usable until the link is clicked.
    return { ok: true, needsEmailConfirmation: !data.session };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { error } = await requireSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return error ? { ok: false, messageKey: messageKeyFor(error) } : { ok: true };
  }

  async signOut(): Promise<void> {
    await requireSupabase().auth.signOut();
  }

  async sendPasswordReset(email: string): Promise<AuthResult> {
    const { error } = await requireSupabase().auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    return error ? { ok: false, messageKey: messageKeyFor(error) } : { ok: true };
  }

  /**
   * Native Sign in with Apple on iOS — required by App Store review whenever
   * a third-party social login is offered. Elsewhere it falls back to the web
   * flow.
   */
  async signInWithApple(): Promise<AuthResult> {
    if (Platform.OS !== 'ios') return this.signInWithProvider('apple');

    try {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) return this.signInWithProvider('apple');

      // A nonce ties Apple's token to this request.
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
        nonce: hashedNonce,
      });
      if (!credential.identityToken) return { ok: false, messageKey: 'auth.error.generic' };

      const { error } = await requireSupabase().auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });
      return error ? { ok: false, messageKey: messageKeyFor(error) } : { ok: true };
    } catch (error) {
      // The user closing the sheet is a choice, not a failure.
      if (isCancellation(error)) return { ok: true };
      return { ok: false, messageKey: 'auth.error.generic' };
    }
  }

  async signInWithGoogle(): Promise<AuthResult> {
    return this.signInWithProvider('google');
  }

  /** Browser-based OAuth: open the provider, then exchange the returned code. */
  private async signInWithProvider(provider: 'apple' | 'google'): Promise<AuthResult> {
    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) return { ok: false, messageKey: messageKeyFor(error) };

    try {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return { ok: true }; // dismissed

      const code = new URL(result.url).searchParams.get('code');
      if (!code) return { ok: false, messageKey: 'auth.error.generic' };

      const exchange = await client.auth.exchangeCodeForSession(code);
      return exchange.error
        ? { ok: false, messageKey: messageKeyFor(exchange.error) }
        : { ok: true };
    } catch {
      return { ok: false, messageKey: 'auth.error.network' };
    }
  }

  /**
   * Deleting a user requires elevated privileges, so it runs in the
   * `delete-account` edge function (see `supabase/functions/`). The function
   * removes the profile row and then the auth user.
   */
  async deleteAccount(): Promise<AuthResult> {
    const client = requireSupabase();
    const { error } = await client.functions.invoke('delete-account');
    if (error) return { ok: false, messageKey: 'auth.error.deleteFailed' };
    await client.auth.signOut();
    return { ok: true };
  }
}

function isCancellation(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED';
}
