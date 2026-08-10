/**
 * Pattern insights computed from the person's own check-ins — nothing here
 * is invented, and below a minimum of data there are simply no insights.
 * Pure functions over the history array so the rules unit-test directly.
 *
 * Each insight is structured data; the screens decide tone and wording so
 * the copy stays in the dictionaries.
 */

import type { CheckInDay } from '../tracking/types';

/** Fewer check-ins than this and we say "not enough data yet" instead. */
export const MIN_CHECK_INS = 5;

/** The stress scale reads the other way: more is worse. */
const INVERTED_METRIC_INDEX = 3;
/** Index of the "overall" scale — excluded from per-metric comparisons. */
const OVERALL_METRIC_INDEX = 5;
const METRIC_COUNT = 6;
const SCALE_MAX = 4;

/**
 * A day's "calm score", 0–100 — the average of the six check-in scales with
 * stress inverted. Presented as an observation of how the person said they
 * felt; never as a grade.
 */
export function calmScore(checkIn: CheckInDay): number {
  let total = 0;
  let counted = 0;
  for (let metric = 0; metric < METRIC_COUNT; metric++) {
    const value = checkIn.values[metric];
    if (value === undefined) continue;
    total += metric === INVERTED_METRIC_INDEX ? SCALE_MAX - value : value;
    counted += 1;
  }
  if (counted === 0) return 0;
  return Math.round((total / (counted * SCALE_MAX)) * 100);
}

export type Insight =
  | { type: 'trend'; delta: number }
  | { type: 'calmestWeekday'; weekday: number }
  | { type: 'flare'; metric: number; count: number }
  | { type: 'lowestMetric'; metric: number };

export type Coverage = {
  count: number;
  days: number;
  /** Average calm score across logged days, or null with nothing logged. */
  average: number | null;
};

/** Higher is better for every metric once stress is flipped. */
const adjusted = (metric: number, value: number): number =>
  metric === INVERTED_METRIC_INDEX ? SCALE_MAX - value : value;

const average = (values: number[]): number | null =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;

export function computeCoverage(history: (CheckInDay | null)[]): Coverage {
  const checked = history.filter((day): day is CheckInDay => day !== null);
  const avg = average(checked.map(calmScore));
  return {
    count: checked.length,
    days: history.length,
    average: avg === null ? null : Math.round(avg),
  };
}

/**
 * Insights from a window of daily slots (oldest first, null = no check-in).
 * Ordered most-actionable first; screens show the top few.
 */
export function computeInsights(history: (CheckInDay | null)[]): Insight[] {
  const checked = history.filter((day): day is CheckInDay => day !== null);
  if (checked.length < MIN_CHECK_INS) return [];

  const insights: Insight[] = [];

  // Trend: the window's later half against its earlier half.
  const half = Math.floor(history.length / 2);
  const earlyScores = history.slice(0, half).filter(Boolean).map((d) => calmScore(d!));
  const lateScores = history.slice(half).filter(Boolean).map((d) => calmScore(d!));
  const early = average(earlyScores);
  const late = average(lateScores);
  if (early !== null && late !== null && earlyScores.length >= 3 && lateScores.length >= 3) {
    insights.push({ type: 'trend', delta: Math.round(late - early) });
  }

  // Flare days: which area (other than "overall") rated lowest on them.
  const flareDays = checked.filter((day) => day.flare);
  if (flareDays.length >= 2) {
    const metric = lowestAdjustedMetric(flareDays);
    if (metric !== null) insights.push({ type: 'flare', metric, count: flareDays.length });
  }

  // Calmest weekday: needs two-plus samples of that day and a real margin.
  const byWeekday = new Map<number, number[]>();
  for (const day of checked) {
    // Noon dodges any timezone edge on date-only strings.
    const weekday = new Date(`${day.day}T12:00:00`).getDay();
    byWeekday.set(weekday, [...(byWeekday.get(weekday) ?? []), calmScore(day)]);
  }
  const sampled = [...byWeekday.entries()].filter(([, scores]) => scores.length >= 2);
  const overall = average(checked.map(calmScore));
  if (sampled.length >= 2 && overall !== null) {
    const best = sampled
      .map(([weekday, scores]) => ({ weekday, avg: average(scores)! }))
      .sort((a, b) => b.avg - a.avg)[0];
    if (best.avg >= overall + 5) insights.push({ type: 'calmestWeekday', weekday: best.weekday });
  }

  // Lowest-rated area overall, when it clearly trails the rest.
  const lowest = lowestAdjustedMetric(checked, 0.5);
  if (lowest !== null && !insights.some((i) => i.type === 'flare' && i.metric === lowest)) {
    insights.push({ type: 'lowestMetric', metric: lowest });
  }

  return insights;
}

/**
 * The non-"overall" metric with the lowest adjusted average. With `margin`
 * set, it must trail the mean of the other metrics by at least that much —
 * a metric that's merely tied lowest is not a pattern.
 */
function lowestAdjustedMetric(days: CheckInDay[], margin = 0): number | null {
  const sums = new Map<number, { total: number; count: number }>();
  for (const day of days) {
    for (let metric = 0; metric < METRIC_COUNT; metric++) {
      if (metric === OVERALL_METRIC_INDEX) continue;
      const value = day.values[metric];
      if (value === undefined) continue;
      const entry = sums.get(metric) ?? { total: 0, count: 0 };
      entry.total += adjusted(metric, value);
      entry.count += 1;
      sums.set(metric, entry);
    }
  }
  const averages = [...sums.entries()]
    .filter(([, { count }]) => count > 0)
    .map(([metric, { total, count }]) => ({ metric, avg: total / count }));
  if (averages.length < 2) return null;

  averages.sort((a, b) => a.avg - b.avg);
  const [lowest, ...rest] = averages;
  const restMean = average(rest.map((entry) => entry.avg))!;
  return restMean - lowest.avg >= margin ? lowest.metric : null;
}
