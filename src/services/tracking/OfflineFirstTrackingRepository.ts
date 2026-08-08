import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalTrackingRepository } from './LocalTrackingRepository';
import {
  CheckInRecord,
  DayRecord,
  DiaryEntryRecord,
  MealScanRecord,
  TrackingRepository,
} from './types';

/**
 * Offline-first wrapper: every write lands in the on-device cache immediately,
 * then is pushed to the backend. If the push fails — no signal, backend down —
 * the operation joins a persistent outbox and is retried on the next flush
 * (app foreground, next read, next write). Logging a meal in a kitchen with
 * no reception must never lose the meal.
 */

type Op =
  | { kind: 'checkIn'; day: string; checkIn: CheckInRecord }
  | { kind: 'water'; day: string; glasses: number }
  | { kind: 'addEntry'; day: string; entry: DiaryEntryRecord }
  | { kind: 'removeEntry'; day: string; entryId: string }
  | { kind: 'logScan'; day: string; scan: MealScanRecord; entry: DiaryEntryRecord };

const outboxKey = (userId: string) => `celadon.tracking.outbox.${userId}`;

/**
 * Queue an operation, coalescing where replays would be pointless: only the
 * latest check-in/water value per day matters, and removing an entry whose
 * insert never left the device cancels both.
 */
function enqueue(queue: Op[], op: Op): Op[] {
  if (op.kind === 'checkIn' || op.kind === 'water') {
    return [...queue.filter((q) => !(q.kind === op.kind && q.day === op.day)), op];
  }
  if (op.kind === 'removeEntry') {
    // A plain insert that never left the device is cancelled outright. A
    // queued scan-log is kept (the archive row should still land) and the
    // delete is queued behind it, so the replay nets out to scan-without-entry.
    const pendingAdd = queue.some((q) => q.kind === 'addEntry' && q.entry.id === op.entryId);
    const remaining = queue.filter((q) => !(q.kind === 'addEntry' && q.entry.id === op.entryId));
    return pendingAdd ? remaining : [...remaining, op];
  }
  return [...queue, op];
}

export class OfflineFirstTrackingRepository implements TrackingRepository {
  private flushing: Promise<void> | null = null;

  constructor(
    private remote: TrackingRepository,
    private cache: LocalTrackingRepository,
  ) {}

  async loadDay(userId: string, day: string): Promise<DayRecord> {
    // Push pending writes first so the read doesn't undo them.
    await this.flush(userId);
    try {
      const data = await this.remote.loadDay(userId, day);
      if (await this.hasPending(userId)) {
        // Some writes still couldn't land; the cache is the fresher truth.
        return this.cache.loadDay(userId, day);
      }
      await this.cache.replaceDay(userId, day, data);
      return data;
    } catch {
      return this.cache.loadDay(userId, day);
    }
  }

  async saveCheckIn(userId: string, day: string, checkIn: CheckInRecord): Promise<void> {
    await this.cache.saveCheckIn(userId, day, checkIn);
    await this.push(userId, { kind: 'checkIn', day, checkIn });
  }

  async saveWater(userId: string, day: string, glasses: number): Promise<void> {
    await this.cache.saveWater(userId, day, glasses);
    await this.push(userId, { kind: 'water', day, glasses });
  }

  async addEntry(userId: string, day: string, entry: DiaryEntryRecord): Promise<void> {
    await this.cache.addEntry(userId, day, entry);
    await this.push(userId, { kind: 'addEntry', day, entry });
  }

  async removeEntry(userId: string, day: string, entryId: string): Promise<void> {
    await this.cache.removeEntry(userId, day, entryId);
    await this.push(userId, { kind: 'removeEntry', day, entryId });
  }

  async logScan(
    userId: string,
    day: string,
    scan: MealScanRecord,
    entry: DiaryEntryRecord,
  ): Promise<void> {
    await this.cache.logScan(userId, day, scan, entry);
    await this.push(userId, { kind: 'logScan', day, scan, entry });
  }

  async loadCheckInRange(userId: string, fromDay: string, toDay: string) {
    await this.flush(userId);
    try {
      return await this.remote.loadCheckInRange(userId, fromDay, toDay);
    } catch {
      return this.cache.loadCheckInRange(userId, fromDay, toDay);
    }
  }

  /** Replays the outbox in order, stopping at the first failure. */
  async flush(userId: string): Promise<void> {
    // One flush at a time; concurrent callers share the same attempt.
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
        return; // Still offline — the rest stays queued, order preserved.
      }
      queue = queue.slice(1);
      await this.writeOutbox(userId, queue);
    }
  }

  private async push(userId: string, op: Op): Promise<void> {
    // Behind earlier failures the new op must queue too — order matters
    // (an entry's insert has to land before its delete).
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
      case 'checkIn':
        return this.remote.saveCheckIn(userId, op.day, op.checkIn);
      case 'water':
        return this.remote.saveWater(userId, op.day, op.glasses);
      case 'addEntry':
        return this.remote.addEntry(userId, op.day, op.entry);
      case 'removeEntry':
        return this.remote.removeEntry(userId, op.day, op.entryId);
      case 'logScan':
        return this.remote.logScan(userId, op.day, op.scan, op.entry);
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
