import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalReintroductionRepository } from './LocalReintroductionRepository';
import {
  ReintroductionCheckRecord,
  ReintroductionPatch,
  ReintroductionRecord,
  ReintroductionRepository,
  ReintroductionState,
} from './types';

/**
 * Offline-first wrapper, same contract as tracking and planning: writes land
 * in the on-device cache first, failures join a persistent outbox replayed
 * in order on the next flush or read.
 */

type Op =
  | { kind: 'seed'; items: ReintroductionRecord[] }
  | { kind: 'update'; id: string; patch: ReintroductionPatch }
  | { kind: 'addCheck'; check: ReintroductionCheckRecord };

const outboxKey = (userId: string) => `celadon.reintro.outbox.${userId}`;

/** Successive updates to the same trial merge — only the net patch matters. */
function enqueue(queue: Op[], op: Op): Op[] {
  if (op.kind === 'update') {
    const prior = queue.find((q): q is Extract<Op, { kind: 'update' }> => q.kind === 'update' && q.id === op.id);
    const merged: Op = prior ? { kind: 'update', id: op.id, patch: { ...prior.patch, ...op.patch } } : op;
    return [...queue.filter((q) => !(q.kind === 'update' && q.id === op.id)), merged];
  }
  return [...queue, op];
}

export class OfflineFirstReintroductionRepository implements ReintroductionRepository {
  private flushing: Promise<void> | null = null;

  constructor(
    private remote: ReintroductionRepository,
    private cache: LocalReintroductionRepository,
  ) {}

  async load(userId: string): Promise<ReintroductionState> {
    await this.flush(userId);
    try {
      const state = await this.remote.load(userId);
      if (await this.hasPending(userId)) return this.cache.load(userId);
      if (state.items.length > 0) await this.cache.replace(userId, state);
      return state;
    } catch {
      return this.cache.load(userId);
    }
  }

  async seed(userId: string, items: ReintroductionRecord[]): Promise<void> {
    await this.cache.seed(userId, items);
    await this.push(userId, { kind: 'seed', items });
  }

  async update(userId: string, id: string, patch: ReintroductionPatch): Promise<void> {
    await this.cache.update(userId, id, patch);
    await this.push(userId, { kind: 'update', id, patch });
  }

  async addCheck(userId: string, check: ReintroductionCheckRecord): Promise<void> {
    await this.cache.addCheck(userId, check);
    await this.push(userId, { kind: 'addCheck', check });
  }

  async flush(userId: string): Promise<void> {
    if (!this.flushing) {
      this.flushing = this.drain(userId).finally(() => {
        this.flushing = null;
      });
    }
    return this.flushing;
  }

  private async drain(userId: string): Promise<void> {
    let queue = await this.readOutbox(userId);
    while (queue.length > 0) {
      try {
        await this.send(userId, queue[0]);
      } catch {
        return; // Still offline — order preserved for the next attempt.
      }
      queue = queue.slice(1);
      await this.writeOutbox(userId, queue);
    }
  }

  private async push(userId: string, op: Op): Promise<void> {
    if (await this.hasPending(userId)) {
      await this.writeOutbox(userId, enqueue(await this.readOutbox(userId), op));
      await this.flush(userId);
      return;
    }
    try {
      await this.send(userId, op);
    } catch {
      await this.writeOutbox(userId, enqueue(await this.readOutbox(userId), op));
    }
  }

  private send(userId: string, op: Op): Promise<void> {
    switch (op.kind) {
      case 'seed':
        return this.remote.seed(userId, op.items);
      case 'update':
        return this.remote.update(userId, op.id, op.patch);
      case 'addCheck':
        return this.remote.addCheck(userId, op.check);
    }
  }

  private async hasPending(userId: string): Promise<boolean> {
    return (await this.readOutbox(userId)).length > 0;
  }

  private async readOutbox(userId: string): Promise<Op[]> {
    const raw = await AsyncStorage.getItem(outboxKey(userId));
    return raw ? (JSON.parse(raw) as Op[]) : [];
  }

  private async writeOutbox(userId: string, queue: Op[]): Promise<void> {
    if (queue.length === 0) await AsyncStorage.removeItem(outboxKey(userId));
    else await AsyncStorage.setItem(outboxKey(userId), JSON.stringify(queue));
  }
}
