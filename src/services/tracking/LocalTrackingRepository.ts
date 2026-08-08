import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CheckInRecord,
  DayRecord,
  DiaryEntryRecord,
  EMPTY_DAY,
  MealScanRecord,
  TrackingRepository,
} from './types';

/**
 * Device-only store, one JSON blob per user per day.
 *
 * Used on its own when no backend is configured, and as the read cache /
 * write-through layer under `OfflineFirstTrackingRepository` when one is.
 */
export class LocalTrackingRepository implements TrackingRepository {
  private key = (userId: string, day: string) => `celadon.tracking.${userId}.${day}`;

  async loadDay(userId: string, day: string): Promise<DayRecord> {
    const raw = await AsyncStorage.getItem(this.key(userId, day));
    return raw ? (JSON.parse(raw) as DayRecord) : EMPTY_DAY;
  }

  /** Overwrites the whole day — used to cache what the backend returned. */
  async replaceDay(userId: string, day: string, data: DayRecord): Promise<void> {
    await AsyncStorage.setItem(this.key(userId, day), JSON.stringify(data));
  }

  async saveCheckIn(userId: string, day: string, checkIn: CheckInRecord): Promise<void> {
    await this.update(userId, day, (data) => ({ ...data, checkIn }));
  }

  async saveWater(userId: string, day: string, glasses: number): Promise<void> {
    await this.update(userId, day, (data) => ({ ...data, water: glasses }));
  }

  async addEntry(userId: string, day: string, entry: DiaryEntryRecord): Promise<void> {
    await this.update(userId, day, (data) => ({
      ...data,
      // Keyed on id so a retried write can't duplicate the entry.
      entries: [...data.entries.filter((e) => e.id !== entry.id), entry],
    }));
  }

  async removeEntry(userId: string, day: string, entryId: string): Promise<void> {
    await this.update(userId, day, (data) => ({
      ...data,
      entries: data.entries.filter((e) => e.id !== entryId),
    }));
  }

  async logScan(
    userId: string,
    day: string,
    _scan: MealScanRecord,
    entry: DiaryEntryRecord,
  ): Promise<void> {
    // The diary entry carries everything the app shows; the full scan record
    // is a server-side archive, so on-device only the entry is kept.
    await this.addEntry(userId, day, entry);
  }

  private async update(userId: string, day: string, fn: (data: DayRecord) => DayRecord) {
    const current = await this.loadDay(userId, day);
    await this.replaceDay(userId, day, fn(current));
  }
}
