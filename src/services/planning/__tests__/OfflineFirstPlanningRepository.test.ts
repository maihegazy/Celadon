import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalPlanningRepository } from '../LocalPlanningRepository';
import { OfflineFirstPlanningRepository } from '../OfflineFirstPlanningRepository';
import { GroceryItemRecord, PlanningRepository, WeekPlanRecord } from '../types';

/**
 * The shopping-list outbox: ticking off groceries in the shop — exactly
 * where reception is worst — must always land, exactly once, in order.
 */

const USER = 'user-1';
const WEEK = '2026-08-02';

const item = (id: string): GroceryItemRecord => ({
  id,
  category: 'produce',
  nameEn: 'Molokhia',
  nameAr: 'ملوخية',
  quantityEn: 'pack',
  quantityAr: 'باقة',
  position: 0,
  checked: false,
  dismissed: false,
  isCustom: false,
});

const week = (): WeekPlanRecord => ({
  planId: 'plan-1',
  listId: 'list-1',
  weekStart: WEEK,
  meals: [
    {
      id: 'meal-1',
      scheduledOn: WEEK,
      slot: 'lunch',
      position: 0,
      nameEn: 'Salmon bowl',
      nameAr: 'سلطة السلمون',
      completed: false,
    },
  ],
  items: [item('g1'), item('g2')],
});

class FakeRemote implements PlanningRepository {
  online = true;
  stored: WeekPlanRecord | null = null;
  log: string[] = [];

  private guard(op: string) {
    if (!this.online) throw new Error('offline');
    this.log.push(op);
  }

  async loadWeek(): Promise<WeekPlanRecord | null> {
    this.guard('loadWeek');
    return this.stored;
  }

  async ensureWeek(_userId: string, value: WeekPlanRecord): Promise<void> {
    this.guard('ensureWeek');
    if (!this.stored) this.stored = value;
  }

  async setMealCompleted(_userId: string, mealId: string, completed: boolean): Promise<void> {
    this.guard(`meal:${mealId}:${completed}`);
  }

  async setItemChecked(_userId: string, itemId: string, checked: boolean): Promise<void> {
    this.guard(`check:${itemId}:${checked}`);
  }

  async dismissItem(_userId: string, itemId: string): Promise<void> {
    this.guard(`dismiss:${itemId}`);
  }

  async addItem(_userId: string, _listId: string, value: GroceryItemRecord): Promise<void> {
    this.guard(`add:${value.id}`);
  }
}

describe('OfflineFirstPlanningRepository', () => {
  let remote: FakeRemote;
  let repository: OfflineFirstPlanningRepository;

  beforeEach(async () => {
    await AsyncStorage.clear();
    remote = new FakeRemote();
    repository = new OfflineFirstPlanningRepository(remote, new LocalPlanningRepository());
  });

  it('coalesces checkbox flapping per item, keeping the final state', async () => {
    remote.online = false;
    await repository.ensureWeek(USER, week());
    await repository.setItemChecked(USER, 'g1', true);
    await repository.setItemChecked(USER, 'g1', false);
    await repository.setItemChecked(USER, 'g1', true);
    await repository.setItemChecked(USER, 'g2', true);

    remote.online = true;
    await repository.flush(USER);

    // One op per item — the last state of g1, and g2's only toggle —
    // behind the week's creation.
    expect(remote.log).toEqual(['ensureWeek', 'check:g1:true', 'check:g2:true']);
  });

  it('keeps the materialised week ahead of the ticks that reference it', async () => {
    remote.online = false;
    await repository.ensureWeek(USER, week());
    await repository.setMealCompleted(USER, 'meal-1', true);
    await repository.dismissItem(USER, 'g2');

    remote.online = true;
    await repository.flush(USER);

    expect(remote.log[0]).toBe('ensureWeek');
    expect(remote.log.slice(1)).toEqual(['meal:meal-1:true', 'dismiss:g2']);
    expect(remote.stored).not.toBeNull();
  });

  it('answers reads from the device while the backend is unreachable', async () => {
    remote.online = false;
    await repository.ensureWeek(USER, week());
    await repository.setItemChecked(USER, 'g1', true);

    const stored = await repository.loadWeek(USER, WEEK);
    expect(stored?.items.find((i) => i.id === 'g1')?.checked).toBe(true);
  });
});
