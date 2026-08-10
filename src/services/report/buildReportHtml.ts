/**
 * Renders the doctor report as a self-contained HTML document for
 * expo-print. Pure string-building — no React, no I/O — so it unit-tests
 * without a device. All copy arrives pre-translated; the builder only
 * handles layout and direction.
 */

export type ReportStat = { name: string; value: string; delta: string | null };

export type ReportBar = {
  /** 0–100 calm score, or null where no check-in was made that day. */
  value: number | null;
  color: string;
};

export type ReportContent = {
  title: string;
  period: string;
  isRTL: boolean;
  stats: ReportStat[];
  trendTitle: string;
  /** One slot per day, oldest first. */
  bars: ReportBar[];
  patternsTitle: string;
  patterns: { color: string; text: string }[];
  foodPatternTitle: string;
  foodPatternBody: string;
  disclaimer: string;
};

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (ch) => ESCAPES[ch]);

const statCell = (stat: ReportStat): string => `
  <div class="stat">
    <div class="stat-value">${escapeHtml(stat.value)}</div>
    <div class="stat-name">${escapeHtml(stat.name)}</div>
    ${stat.delta ? `<div class="stat-delta">${escapeHtml(stat.delta)}</div>` : ''}
  </div>`;

const bar = ({ value, color }: ReportBar): string => {
  // A missed day keeps its slot so the timeline stays honest.
  const height = value === null ? 3 : Math.max(4, Math.round((value / 100) * 72));
  return `<div class="bar" style="height:${height}px;background:${escapeHtml(color)}"></div>`;
};

const pattern = (entry: { color: string; text: string }): string => `
  <div class="pattern">
    <span class="pattern-dot" style="background:${escapeHtml(entry.color)}"></span>
    <span>${escapeHtml(entry.text)}</span>
  </div>`;

export function buildReportHtml(content: ReportContent): string {
  const dir = content.isRTL ? 'rtl' : 'ltr';
  const align = content.isRTL ? 'right' : 'left';
  return `<!DOCTYPE html>
<html dir="${dir}" lang="${content.isRTL ? 'ar' : 'en'}">
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, 'Segoe UI', Roboto, 'Noto Sans Arabic', sans-serif;
         color: #2f3a33; margin: 32px; text-align: ${align}; }
  h1 { font-size: 22px; color: #37564a; margin: 0 0 4px; }
  .period { font-size: 12px; color: #8a897f; margin-bottom: 24px; }
  .stats { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
  .stat { flex: 1 1 40%; border: 1px solid #e7e2d8; border-radius: 10px; padding: 12px 14px; }
  .stat-value { font-size: 20px; font-weight: 700; color: #37564a; }
  .stat-name { font-size: 11px; color: #8a897f; margin-top: 2px; }
  .stat-delta { font-size: 10px; color: #6f8d7d; margin-top: 2px; }
  h2 { font-size: 13px; margin: 0 0 10px; }
  .section { border: 1px solid #e7e2d8; border-radius: 12px; padding: 16px; margin-bottom: 14px; }
  .chart { display: flex; align-items: flex-end; gap: 4px; height: 76px; }
  .bar { flex: 1; border-radius: 2px 2px 0 0; }
  .pattern { display: flex; gap: 10px; font-size: 12px; line-height: 1.5; margin-bottom: 8px; }
  .pattern-dot { width: 8px; height: 8px; border-radius: 4px; margin-top: 5px; flex: none; }
  .body-text { font-size: 12px; line-height: 1.6; color: #5c6a60; margin: 0; }
  .disclaimer { font-size: 10px; line-height: 1.6; color: #8a897f; margin-top: 20px; }
</style>
</head>
<body>
  <h1>${escapeHtml(content.title)}</h1>
  <div class="period">${escapeHtml(content.period)}</div>

  <div class="stats">${content.stats.map(statCell).join('')}</div>

  <div class="section">
    <h2>${escapeHtml(content.trendTitle)}</h2>
    <div class="chart">${content.bars.map(bar).join('')}</div>
  </div>

  <div class="section">
    <h2>${escapeHtml(content.patternsTitle)}</h2>
    ${content.patterns.map(pattern).join('')}
  </div>

  <div class="section">
    <h2>${escapeHtml(content.foodPatternTitle)}</h2>
    <p class="body-text">${escapeHtml(content.foodPatternBody)}</p>
  </div>

  <div class="disclaimer">${escapeHtml(content.disclaimer)}</div>
</body>
</html>`;
}

/** The same report as plain text — the body of the "email my care team" draft. */
export function buildReportText(content: ReportContent): string {
  const lines = [
    content.title,
    content.period,
    '',
    ...content.stats.map((stat) =>
      stat.delta ? `${stat.name}: ${stat.value} (${stat.delta})` : `${stat.name}: ${stat.value}`,
    ),
    '',
    content.patternsTitle,
    ...content.patterns.map((entry) => `• ${entry.text}`),
    '',
    content.foodPatternTitle,
    content.foodPatternBody,
    '',
    content.disclaimer,
  ];
  return lines.join('\n');
}
