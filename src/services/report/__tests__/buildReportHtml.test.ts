import {
  buildReportHtml,
  buildReportText,
  ReportContent,
} from '../buildReportHtml';

const content = (overrides: Partial<ReportContent> = {}): ReportContent => ({
  title: 'Doctor report',
  period: '27 Jul – 9 Aug · prepared for your care team',
  isRTL: false,
  stats: [
    { name: 'Avg Celadon Score', value: '82', delta: '+4 vs the two weeks before' },
    { name: 'Check-ins', value: '11 / 14', delta: null },
  ],
  trendTitle: 'Daily calm score, last 14 days',
  bars: [
    { value: 80, color: '#4a7a63' },
    { value: null, color: '#e7e2d8' },
    { value: 40, color: '#c9a35a' },
  ],
  patternsTitle: 'Patterns observed',
  patterns: [{ color: '#c9a35a', text: 'Joint pain logged 2× within a day of nightshades.' }],
  foodPatternTitle: 'Food pattern',
  foodPatternBody: '24 of 31 days followed an anti-inflammatory pattern.',
  disclaimer: 'Self-reported data. Not a diagnosis.',
  ...overrides,
});

describe('buildReportHtml', () => {
  it('renders every section of the report', () => {
    const html = buildReportHtml(content());
    expect(html).toContain('Doctor report');
    expect(html).toContain('27 Jul – 9 Aug');
    expect(html).toContain('Avg Celadon Score');
    expect(html).toContain('+4 vs the two weeks before');
    expect(html).toContain('Daily calm score, last 14 days');
    expect(html).toContain('Patterns observed');
    expect(html).toContain('nightshades');
    expect(html).toContain('Not a diagnosis.');
  });

  it('draws one bar per day, keeping slots for missed check-ins', () => {
    const html = buildReportHtml(content());
    expect(html.match(/class="bar"/g)).toHaveLength(3);
    // The missed day renders as a 3px stub rather than disappearing.
    expect(html).toContain('height:3px');
  });

  it('sets document direction from the language', () => {
    expect(buildReportHtml(content())).toContain('<html dir="ltr" lang="en">');
    expect(buildReportHtml(content({ isRTL: true }))).toContain('<html dir="rtl" lang="ar">');
  });

  it('escapes markup in user-influenced strings', () => {
    const html = buildReportHtml(
      content({ title: '<script>alert(1)</script>', period: 'a & b' }),
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('a &amp; b');
  });
});

describe('buildReportText', () => {
  it('lists stats with deltas and skips markup entirely', () => {
    const text = buildReportText(content());
    expect(text).toContain('Avg Celadon Score: 82 (+4 vs the two weeks before)');
    expect(text).toContain('Check-ins: 11 / 14');
    expect(text).toContain('• Joint pain logged 2× within a day of nightshades.');
    expect(text).not.toContain('<');
  });
});
