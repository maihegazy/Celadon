import { CHECK_IN_METRICS, Tone } from '../data/content';
import {
  computeCoverage,
  computeInsights,
  Coverage,
  Insight,
} from '../services/insights/compute';
import { useI18n } from '../i18n';
import { TREND_DAYS } from './useProgressStats';
import { useCheckInHistory } from './useCheckInHistory';

/** Four weeks of history feed the pattern rules. */
const WINDOW_DAYS = TREND_DAYS * 2;

/** A reference Sunday, used only to render localised weekday names. */
const REFERENCE_SUNDAY = '2026-08-02';

export type InsightRow = { key: string; tone: Tone; text: string };

/**
 * The pattern insights both Progress and the doctor report show — computed
 * from the person's own check-ins and worded here so the two screens (and
 * the PDF) stay identical. `rows` is empty until there is enough data.
 */
export function useInsights(): {
  rows: InsightRow[];
  coverage: Coverage | null;
} {
  const { t, n, lang } = useI18n();
  const history = useCheckInHistory(WINDOW_DAYS);

  if (!history) return { rows: [], coverage: null };

  const weekdayName = (weekday: number): string => {
    const date = new Date(`${REFERENCE_SUNDAY}T12:00:00`);
    date.setDate(date.getDate() + weekday);
    return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long' });
  };

  const metricName = (metric: number): string =>
    t(CHECK_IN_METRICS[metric]?.name ?? CHECK_IN_METRICS[0].name);

  const toRow = (insight: Insight): InsightRow => {
    switch (insight.type) {
      case 'trend': {
        if (insight.delta >= 3) {
          return {
            key: 'trend',
            tone: 'good',
            text: t('insight.trendUp', { points: n(insight.delta) }),
          };
        }
        if (insight.delta <= -3) {
          return {
            key: 'trend',
            tone: 'flag',
            text: t('insight.trendDown', { points: n(Math.abs(insight.delta)) }),
          };
        }
        return { key: 'trend', tone: 'mid', text: t('insight.trendSteady') };
      }
      case 'calmestWeekday':
        return {
          key: 'calmestWeekday',
          tone: 'good',
          text: t('insight.calmestDay', { day: weekdayName(insight.weekday) }),
        };
      case 'flare':
        return {
          key: 'flare',
          tone: 'flag',
          text: t('insight.flare', {
            metric: metricName(insight.metric),
            count: n(insight.count),
          }),
        };
      case 'lowestMetric':
        return {
          key: 'lowestMetric',
          tone: 'mid',
          text: t('insight.lowestMetric', { metric: metricName(insight.metric) }),
        };
    }
  };

  return {
    rows: computeInsights(history).map(toRow),
    coverage: computeCoverage(history),
  };
}
