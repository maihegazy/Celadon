import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthResult,
  AuthService,
  AuthSession,
  SignUpResult,
} from './types';

const SESSION_KEY = 'celadon.localSession';
const ACCOUNTS_KEY = 'celadon.localAccounts';

type StoredAccount = { id: string; email: string; password: string };

/**
 * Device-only stand-in used when no Supabase project is configured.
 *
 * It keeps the sign-up and sign-in journeys walkable — accounts live in
 * AsyncStorage on this device and nowhere else. It is explicitly **not** a
 * security boundary: passwords are stored as given, so this must never run
 * against real user data. `isConfigured` is false so the UI can say as much.
 */
export class LocalAuthService implements AuthService {
  readonly isConfigured = false;
  readonly supportsOAuth = false;

  private listeners = new Set<(session: AuthSession) => void>();

  async getSession(): Promise<AuthSession> {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  }

  onSessionChange(listener: (session: AuthSession) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async signUp(email: string, password: string): Promise<SignUpResult> {
    const accounts = await this.accounts();
    const normalised = email.trim().toLowerCase();
    if (accounts.some((a) => a.email === normalised)) {
      return { ok: false, messageKey: 'auth.error.emailTaken' };
    }
    const account: StoredAccount = { id: `local-${Date.now()}`, email: normalised, password };
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
    await this.startSession(account);
    return { ok: true, needsEmailConfirmation: false };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const accounts = await this.accounts();
    const normalised = email.trim().toLowerCase();
    const match = accounts.find((a) => a.email === normalised && a.password === password);
    if (!match) return { ok: false, messageKey: 'auth.error.invalidCredentials' };
    await this.startSession(match);
    return { ok: true };
  }

  async signOut(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY);
    this.emit(null);
  }

  async sendPasswordReset(): Promise<AuthResult> {
    // There's no mail server here; the screen still shows its "sent" state so
    // the flow can be reviewed.
    return { ok: true };
  }

  async signInWithApple(): Promise<AuthResult> {
    return { ok: false, messageKey: 'auth.error.notConfigured' };
  }

  async signInWithGoogle(): Promise<AuthResult> {
    return { ok: false, messageKey: 'auth.error.notConfigured' };
  }

  async deleteAccount(): Promise<AuthResult> {
    const session = await this.getSession();
    if (session) {
      const accounts = await this.accounts();
      await AsyncStorage.setItem(
        ACCOUNTS_KEY,
        JSON.stringify(accounts.filter((a) => a.id !== session.user.id)),
      );
    }
    await this.signOut();
    return { ok: true };
  }

  private async accounts(): Promise<StoredAccount[]> {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  }

  private async startSession(account: StoredAccount) {
    const session: AuthSession = { user: { id: account.id, email: account.email, createdAt: null } };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.emit(session);
  }

  private emit(session: AuthSession) {
    this.listeners.forEach((listener) => listener(session));
  }
}
