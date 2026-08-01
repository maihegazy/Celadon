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
import { REPORT_PATTERNS, STAT_CARDS, toneColors } from '../data/content';
import { colors, radius } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * The export a user can hand to their care team. Everything is labelled as
 * self-reported or photo-estimated, and framed as context — never a finding.
 */
export function DoctorReportScreen() {
  const navigation = useAppNavigation();

  return (
    <Screen tabs>
      <ScreenHeader
        title="Doctor report"
        subtitle="July 1 – 31 · prepared for your care team"
        onBack={() => navigation.navigate('Progress')}
        align="top"
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {STAT_CARDS.map((stat) => (
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
          Patterns observed
        </Text>
        <View style={{ gap: 10 }}>
          {REPORT_PATTERNS.map((pattern) => (
            <View key={pattern.text} style={{ flexDirection: 'row', gap: 12 }}>
              <Dot color={toneColors[pattern.tone].dot} style={{ marginTop: 4 }} />
              <Text size={13.5} color={colors.inkSoft} lineHeight={20} style={{ flex: 1 }}>
                {pattern.text}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ padding: 18, borderRadius: radius.cardLg }}>
        <Text weight="semibold" size={15} style={{ marginBottom: 6 }}>
          Food pattern
        </Text>
        <Text size={13.5} color={colors.muted} lineHeight={21}>
          24 of 31 days followed an anti-inflammatory pattern. Most frequent supportive foods: salmon, olive oil,
          molokhia, walnuts. Flagged foods appeared in 9 meals, mostly tomatoes.
        </Text>
      </Card>

      <NoteCard style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
        <Text size={12.5} color={colors.muted} lineHeight={19}>
          Self-reported data and photo-based estimates, shared as observations for clinical context — not a
          diagnosis.
        </Text>
      </NoteCard>

      <PrimaryButton label="Share as PDF" />
      <OutlineButton label="Email to my nutritionist" size={14.5} />
    </Screen>
  );
}
