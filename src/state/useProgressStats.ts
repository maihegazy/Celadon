import { useAppState } from './AppState';
import { calmScore, useCheckInHistory } from './useCheckInHistory';
import { useI18n } from '../i18n';

export const TREND_DAYS = 14;
/** A day is "calm" when its check-in averages comfortably positive. */
const CALM_THRESHOLD = 70;

export type StatCard = { name: string; value: string; delta: string | null };

/**
 * The four summary numbers Progress and the doctor report share, plus the
 * per-day calm scores that draw the trend chart — all derived from the
 * person's own check-ins and plan, never invented. Values are '—' until
 * there is data to stand behind.
 */
export function useProgressStats(): {
  /** One slot per day, oldest first; null where no check-in was made. */
  scores: (number | null)[];
  statCards: StatCard[];
  /** True once at least one check-in exists in the charted window. */
  hasData: boolean;
} {
  const { state } = useAppState();
  const { t, n } = useI18n();

  // Four weeks: the last two draw the chart, the two before anchor deltas.
  const history = useCheckInHistory(TREND_DAYS * 2);
  const recent = history?.slice(TREND_DAYS) ?? [];
  const prior = history?.slice(0, TREND_DAYS) ?? [];

  const scores = recent.map((checkIn) => (checkIn ? calmScore(checkIn) : null));
  const recentScores = scores.filter((score): score is number => score !== null);
  const priorScores = prior
    .filter((checkIn): checkIn is NonNullable<typeof checkIn> => checkIn !== null)
    .map(calmScore);

  const average = (values: number[]) =>
    values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : null;

  const avgScore = average(recentScores);
  const priorAvg = average(priorScores);
  const calmDays = recentScores.filter((score) => score >= CALM_THRESHOLD).length;
  const priorCalmDays = priorScores.filter((score) => score >= CALM_THRESHOLD).length;

  const completedMeals = state.planMeals.filter((meal) => meal.completed).length;
  const adherence = state.planMeals.length
    ? Math.round((completedMeals / state.planMeals.length) * 100)
    : null;

  const signed = (value: number) => (value >= 0 ? `+${n(value)}` : `−${n(Math.abs(value))}`);
  const delta = (current: number | null, previous: number | null) =>
    current !== null && previous !== null
      ? t('stat.delta.vsPrior', { value: signed(current - previous) })
      : null;

  return {
    scores,
    hasData: recentScores.length > 0,
    statCards: [
      {
        name: t('stat.avgScore'),
        value: avgScore !== null ? n(avgScore) : '—',
        delta: delta(avgScore, priorAvg),
      },
      { name: t('stat.adherence'), value: adherence !== null ? `${n(adherence)}%` : '—', delta: null },
      {
        name: t('stat.calmDays'),
        value: n(calmDays),
        delta: priorScores.length ? delta(calmDays, priorCalmDays) : null,
      },
      {
        name: t('stat.checkIns'),
        value: `${n(recentScores.length)} / ${n(TREND_DAYS)}`,
        delta: null,
      },
    ],
  };
}
