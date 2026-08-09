import React from 'react';
import { View } from 'react-native';
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
import { REPORT_PATTERNS, toneColors } from '../data/content';
import { useProgressStats } from '../state/useProgressStats';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * The export a user can hand to their care team. Everything is labelled as
 * self-reported or photo-estimated, and framed as context — never a finding.
 */
export function DoctorReportScreen() {
  const navigation = useAppNavigation();
  const { t, row } = useI18n();
  const { statCards } = useProgressStats();

  return (
    <Screen tabs>
      <ScreenHeader
        title={t('report.title')}
        subtitle={t('report.subtitle')}
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

      <PrimaryButton label={t('report.sharePdf')} />
      <OutlineButton label={t('report.email')} size={14.5} />
    </Screen>
  );
}
