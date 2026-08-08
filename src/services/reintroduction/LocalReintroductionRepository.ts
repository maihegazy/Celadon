import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ReintroductionCheckRecord,
  ReintroductionPatch,
  ReintroductionRecord,
  ReintroductionRepository,
  ReintroductionState,
} from './types';

/**
 * Device-only store — the whole store when no backend is configured, and the
 * cache underneath `OfflineFirstReintroductionRepository` when one is.
 */
export class LocalReintroductionRepository implements ReintroductionRepository {
  private key = (userId: string) => `celadon.reintro.${userId}`;

  async load(userId: string): Promise<ReintroductionState> {
    const raw = await AsyncStorage.getItem(this.key(userId));
    return raw ? (JSON.parse(raw) as ReintroductionState) : { items: [], checks: [] };
  }

  async replace(userId: string, state: ReintroductionState): Promise<void> {
    await AsyncStorage.setItem(this.key(userId), JSON.stringify(state));
  }

  async seed(userId: string, items: ReintroductionRecord[]): Promise<void> {
    const current = await this.load(userId);
    if (current.items.length > 0) return;
    await this.replace(userId, { items, checks: [] });
  }

  async update(userId: string, id: string, patch: ReintroductionPatch): Promise<void> {
    const current = await this.load(userId);
    await this.replace(userId, {
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  async addCheck(userId: string, check: ReintroductionCheckRecord): Promise<void> {
    const current = await this.load(userId);
    await this.replace(userId, {
      ...current,
      checks: [...current.checks.filter((c) => c.id !== check.id), check],
    });
  }
}
