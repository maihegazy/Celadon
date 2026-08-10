import { CheckInDay } from '../../tracking/types';
import { computeCoverage, computeInsights, MIN_CHECK_INS } from '../compute';

/** 2026-08-02 is a Sunday, so weekday(index i) === i % 7 with 0 = Sunday. */
const WINDOW_START = '2026-08-02';

const dateAt = (offset: number): string => {
  const date = new Date(`${WINDOW_START}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

/**
 * A check-in where every adjusted scale sits at `level` (0–4) — stress is
 * stored inverted so the calm score comes out at level/4 exactly.
 */
const checkIn = (
  offset: number,
  level: number,
  overrides: Partial<CheckInDay> & { values?: Record<number, number> } = {},
): CheckInDay => ({
  day: dateAt(offset),
  values: overrides.values ?? { 0: level, 1: level, 2: level, 3: 4 - level, 4: level, 5: level },
  flare: overrides.flare ?? false,
  note: '',
});

const window = (days: number, fill: (offset: number) => CheckInDay | null) =>
  Array.from({ length: days }, (_, offset) => fill(offset));

describe('computeInsights', () => {
  it('stays silent below the data threshold', () => {
    const history = window(28, (offset) =>
      offset < MIN_CHECK_INS - 1 ? checkIn(offset, 3) : null,
    );
    expect(computeInsights(history)).toEqual([]);
  });

  it('reports the trend between the window halves', () => {
    const history = window(28, (offset) => checkIn(offset, offset < 14 ? 1 : 3));
    const trend = computeInsights(history).find((i) => i.type === 'trend');
    expect(trend).toEqual({ type: 'trend', delta: 50 });
  });

  it('names the lowest-rated area on flare days', () => {
    // Sleep (index 2) rated 0 on flare days; everything else comfortable.
    const history = window(28, (offset) => {
      if (offset === 3 || offset === 10) {
        return checkIn(offset, 3, { flare: true, values: { 0: 3, 1: 3, 2: 0, 3: 1, 4: 3, 5: 2 } });
      }
      return offset % 2 === 0 ? checkIn(offset, 3) : null;
    });
    const flare = computeInsights(history).find((i) => i.type === 'flare');
    expect(flare).toEqual({ type: 'flare', metric: 2, count: 2 });
  });

  it('needs two flare days before saying anything about flares', () => {
    const history = window(28, (offset) =>
      offset === 3
        ? checkIn(offset, 3, { flare: true, values: { 0: 3, 1: 3, 2: 0, 3: 1, 4: 3, 5: 2 } })
        : checkIn(offset, 3),
    );
    expect(computeInsights(history).find((i) => i.type === 'flare')).toBeUndefined();
  });

  it('finds the calmest weekday when it clearly leads', () => {
    // Fridays (weekday 5) at the top of the scale, everything else middling.
    const history = window(28, (offset) => checkIn(offset, offset % 7 === 5 ? 4 : 2));
    const calmest = computeInsights(history).find((i) => i.type === 'calmestWeekday');
    expect(calmest).toEqual({ type: 'calmestWeekday', weekday: 5 });
  });

  it('flags a consistently lowest-rated metric', () => {
    const history = window(28, (offset) =>
      checkIn(offset, 3, { values: { 0: 3, 1: 3, 2: 1, 3: 1, 4: 3, 5: 3 } }),
    );
    const lowest = computeInsights(history).find((i) => i.type === 'lowestMetric');
    expect(lowest).toEqual({ type: 'lowestMetric', metric: 2 });
  });

  it('does not call a tie a pattern', () => {
    // All metrics adjusted-equal — no area is "lowest".
    const history = window(28, (offset) => checkIn(offset, 2));
    expect(computeInsights(history).find((i) => i.type === 'lowestMetric')).toBeUndefined();
  });
});

describe('computeCoverage', () => {
  it('counts logged days and averages their calm scores', () => {
    const history = window(14, (offset) => (offset % 2 === 0 ? checkIn(offset, 3) : null));
    expect(computeCoverage(history)).toEqual({ count: 7, days: 14, average: 75 });
  });

  it('has no average with nothing logged', () => {
    expect(computeCoverage(window(14, () => null))).toEqual({
      count: 0,
      days: 14,
      average: null,
    });
  });
});
