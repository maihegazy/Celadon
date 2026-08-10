import React, { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  Card,
  Dot,
  NoteCard,
  OutlineButton,
  PrimaryButton,
  Screen,
  ScreenHeader,
  Text,
} from '../components';
import { REPORT_PATTERNS, toneColors, trendColor } from '../data/content';
import { TREND_DAYS, useProgressStats } from '../state/useProgressStats';
import {
  buildReportHtml,
  buildReportText,
  ReportContent,
} from '../services/report/buildReportHtml';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * The export a user can hand to their care team. Everything is labelled as
 * self-reported or photo-estimated, and framed as context — never a finding.
 */
export function DoctorReportScreen() {
  const navigation = useAppNavigation();
  const { t, lang, isRTL, row } = useI18n();
  const { statCards, scores } = useProgressStats();
  const [busy, setBusy] = useState(false);

  const formatDay = (date: Date) =>
    date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
  const today = new Date();
  const windowStart = new Date(today);
  windowStart.setDate(today.getDate() - (TREND_DAYS - 1));
  const period = t('report.period', { from: formatDay(windowStart), to: formatDay(today) });

  const reportContent = (): ReportContent => ({
    title: t('report.title'),
    period,
    isRTL,
    stats: statCards,
    trendTitle: t('report.trend', { count: TREND_DAYS }),
    bars: scores.map((score) => ({
      value: score,
      color: score === null ? colors.line : trendColor(score),
    })),
    patternsTitle: t('report.patterns'),
    patterns: REPORT_PATTERNS.map((entry) => ({
      color: toneColors[entry.tone].dot,
      text: t(entry.text),
    })),
    foodPatternTitle: t('report.foodPattern'),
    foodPatternBody: t('report.foodPattern.body'),
    disclaimer: t('report.disclaimer'),
  });

  const sharePdf = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const html = buildReportHtml(reportContent());
      if (Platform.OS === 'web') {
        // The browser's print dialog offers "save as PDF" itself.
        await Print.printAsync({ html });
        return;
      }
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: t('report.title'),
        });
      }
    } catch {
      // Cancelled the share sheet, or printing is unavailable — nothing to undo.
    } finally {
      setBusy(false);
    }
  };

  const emailReport = () => {
    const subject = encodeURIComponent(t('report.emailSubject'));
    const body = encodeURIComponent(buildReportText(reportContent()));
    Linking.openURL(`mailto:?subject=${subject}&body=${body}`).catch(() => {});
  };

  return (
    <Screen tabs>
      <ScreenHeader
        title={t('report.title')}
        subtitle={period}
        onBack={() => navigation.navigate('Progress')}
        align="top"
      />

      <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 10 }}>
        {statCards.map((stat) => (
          <Card key={stat.name} style={{ flexGrow: 1, flexBasis: '47%', paddingVertical: 14, paddingHorizontal: 16 }}>
            <Text weight="bold" size={20} color={colors.greenDeep}>
              {stat.value}
            </Text>
            <Text size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
              {stat.name}
            </Text>
          </Card>
        ))}
      </View>

      <Card style={{ padding: 18, borderRadius: radius.cardLg }}>
        <Text weight="semibold" size={15} style={{ marginBottom: 10 }}>
          {t('report.patterns')}
        </Text>
        <View style={{ gap: 10 }}>
          {REPORT_PATTERNS.map((pattern) => (
            <View key={pattern.text} style={{ flexDirection: row, gap: 12 }}>
              <Dot color={toneColors[pattern.tone].dot} style={{ marginTop: 4 }} />
              <Text size={13.5} color={colors.inkSoft} lineHeight={20} style={{ flex: 1 }}>
                {t(pattern.text)}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ padding: 18, borderRadius: radius.cardLg }}>
        <Text weight="semibold" size={15} style={{ marginBottom: 6 }}>
          {t('report.foodPattern')}
        </Text>
        <Text size={13.5} color={colors.muted} lineHeight={21}>
          {t('report.foodPattern.body')}
        </Text>
      </Card>

      <NoteCard style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
        <Text size={12.5} color={colors.muted} lineHeight={19}>
          {t('report.disclaimer')}
        </Text>
      </NoteCard>

      <PrimaryButton
        label={busy ? t('report.generating') : t('report.sharePdf')}
        onPress={sharePdf}
      />
      <OutlineButton label={t('report.email')} size={14.5} onPress={emailReport} />
    </Screen>
  );
}
