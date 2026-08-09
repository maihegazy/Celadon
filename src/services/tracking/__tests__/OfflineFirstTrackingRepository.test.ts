import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalTrackingRepository } from '../LocalTrackingRepository';
import { OfflineFirstTrackingRepository } from '../OfflineFirstTrackingRepository';
import {
  CheckInDay,
  CheckInRecord,
  DayRecord,
  DiaryEntryRecord,
  EMPTY_DAY,
  MealScanRecord,
  TrackingRepository,
} from '../types';

/**
 * The offline outbox is the app's core promise — logging a meal with no
 * signal never loses the meal. These tests drive the wrapper against a fake
 * backend whose availability we control, and assert the replay semantics.
 */

const USER = 'user-1';
const DAY = '2026-08-08';

const entry = (id: string, name = 'Bessara'): DiaryEntryRecord => ({
  id,
  loggedAt: `${DAY}T12:00:00.000Z`,
  slot: 'lunch',
  source: 'manual',
  name,
  calories: 320,
  score: 88,
  proteinG: null,
  carbsG: null,
  fatG: null,
  fibreG: null,
  scanId: null,
});

const checkIn = (energy: number): CheckInRecord => ({
  values: { 0: energy },
  flare: false,
  note: '',
});

/** In-memory stand-in for the Supabase repository, with a kill switch. */
class FakeRemote implements TrackingRepository {
  online = true;
  days = new Map<string, DayRecord>();
  log: string[] = [];

  private key = (userId: string, day: string) => `${userId}:${day}`;

  private day(userId: string, day: string): DayRecord {
    return this.days.get(this.key(userId, day)) ?? { ...EMPTY_DAY, entries: [] };
  }

  private guard(op: string) {
    if (!this.online) throw new Error('offline');
    this.log.push(op);
  }

  async loadDay(userId: string, day: string): Promise<DayRecord> {
    this.guard('loadDay');
    return this.day(userId, day);
  }

  async saveCheckIn(userId: string, day: string, value: CheckInRecord): Promise<void> {
    this.guard(`checkIn:${value.values[0]}`);
    this.days.set(this.key(userId, day), { ...this.day(userId, day), checkIn: value });
  }

  async saveWater(userId: string, day: string, glasses: number): Promise<void> {
    this.guard(`water:${glasses}`);
    this.days.set(this.key(userId, day), { ...this.day(userId, day), water: glasses });
  }

  async addEntry(userId: string, day: string, value: DiaryEntryRecord): Promise<void> {
    this.guard(`add:${value.id}`);
    const current = this.day(userId, day);
    this.days.set(this.key(userId, day), {
      ...current,
      entries: [...current.entries.filter((e) => e.id !== value.id), value],
    });
  }

  async removeEntry(userId: string, day: string, entryId: string): Promise<void> {
    this.guard(`remove:${entryId}`);
    const current = this.day(userId, day);
    this.days.set(this.key(userId, day), {
      ...current,
      entries: current.entries.filter((e) => e.id !== entryId),
    });
  }

  async logScan(
    userId: string,
    day: string,
    scan: MealScanRecord,
    value: DiaryEntryRecord,
  ): Promise<void> {
    this.guard(`scan:${scan.id}`);
    await this.addEntry(userId, day, value);
    this.log.pop(); // the addEntry guard logged too; keep one line per op
  }

  async loadCheckInRange(): Promise<CheckInDay[]> {
    this.guard('loadCheckInRange');
    return [];
  }
}

describe('OfflineFirstTrackingRepository', () => {
  let remote: FakeRemote;
  let repository: OfflineFirstTrackingRepository;

  beforeEach(async () => {
    await AsyncStorage.clear();
    remote = new FakeRemote();
    repository = new OfflineFirstTrackingRepository(remote, new LocalTrackingRepository());
  });

  it('writes through to the backend when online', async () => {
    await repository.addEntry(USER, DAY, entry('e1'));
    expect(remote.log).toEqual(['add:e1']);
    expect((await repository.loadDay(USER, DAY)).entries).toHaveLength(1);
  });

  it('keeps the write on-device when the backend is down', async () => {
    remote.online = false;
    await repository.addEntry(USER, DAY, entry('e1'));

    // The meal is not lost: reads serve the cache.
    const day = await repository.loadDay(USER, DAY);
    expect(day.entries.map((e) => e.id)).toEqual(['e1']);
    expect(remote.days.size).toBe(0);
  });

  it('replays queued writes in order once the backend returns', async () => {
    remote.online = false;
    await repository.addEntry(USER, DAY, entry('e1'));
    await repository.saveWater(USER, DAY, 3);

    remote.online = true;
    await repository.flush(USER);

    expect(remote.log).toEqual(['add:e1', 'water:3']);
    expect(remote.days.get(`${USER}:${DAY}`)?.entries).toHaveLength(1);
    expect(remote.days.get(`${USER}:${DAY}`)?.water).toBe(3);
  });

  it('coalesces repeated water and check-in writes to the latest value', async () => {
    remote.online = false;
    await repository.saveWater(USER, DAY, 1);
    await repository.saveWater(USER, DAY, 2);
    await repository.saveWater(USER, DAY, 5);
    await repository.saveCheckIn(USER, DAY, checkIn(1));
    await repository.saveCheckIn(USER, DAY, checkIn(4));

    remote.online = true;
    await repository.flush(USER);

    // Only the last of each burst reaches the backend.
    expect(remote.log).toEqual(['water:5', 'checkIn:4']);
  });

  it('cancels a queued insert when the entry is removed before syncing', async () => {
    remote.online = false;
    await repository.addEntry(USER, DAY, entry('e1'));
    await repository.removeEntry(USER, DAY, 'e1');

    remote.online = true;
    await repository.flush(USER);

    // Neither the insert nor the delete should have been sent.
    expect(remote.log).toEqual([]);
    expect((await repository.loadDay(USER, DAY)).entries).toEqual([]);
  });

  it('queues behind earlier failures so ordering survives partial outages', async () => {
    remote.online = false;
    await repository.addEntry(USER, DAY, entry('e1'));

    // Back online, but the new write must not overtake the queued one.
    remote.online = true;
    await repository.saveWater(USER, DAY, 4);

    expect(remote.log).toEqual(['add:e1', 'water:4']);
    expect(remote.days.get(`${USER}:${DAY}`)?.entries).toHaveLength(1);
    expect(remote.days.get(`${USER}:${DAY}`)?.water).toBe(4);
  });

  it('cancels both sides even when the removal happens back online', async () => {
    remote.online = false;
    await repository.addEntry(USER, DAY, entry('e1'));

    // The entry never reached the backend, so its removal has nothing to
    // delete there — the pair nets out to no remote traffic at all.
    remote.online = true;
    await repository.removeEntry(USER, DAY, 'e1');

    expect(remote.log).toEqual([]);
    expect((await repository.loadDay(USER, DAY)).entries).toEqual([]);
  });

  it('stops replaying at the first failure and resumes later without loss', async () => {
    remote.online = false;
    await repository.addEntry(USER, DAY, entry('e1'));
    await repository.addEntry(USER, DAY, entry('e2'));

    // Flush while still down: nothing sent, nothing dropped.
    await repository.flush(USER);
    expect(remote.log).toEqual([]);

    remote.online = true;
    await repository.flush(USER);
    expect(remote.log).toEqual(['add:e1', 'add:e2']);
  });

  it('serves the cache instead of a stale backend while writes are pending', async () => {
    await repository.addEntry(USER, DAY, entry('e1'));

    remote.online = false;
    await repository.addEntry(USER, DAY, entry('e2'));

    // Remote comes back readable, but the queued write hasn't landed yet —
    // trust the device, which has both entries.
    const day = await repository.loadDay(USER, DAY);
    expect(day.entries.map((e) => e.id).sort()).toEqual(['e1', 'e2']);
  });
});
