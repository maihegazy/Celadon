import React from 'react';
import { View } from 'react-native';
import {
  Card,
  Display,
  Dot,
  EmptyCard,
  FeatureCard,
  NoteCard,
  OutlineButton,
  Screen,
  Strong,
  Text,
  TextButton,
} from '../components';
import { PATTERNS, STAT_CARDS, toneColors, trendColor, TREND_VALUES } from '../data/content';
import { useAppState } from '../state/AppState';
import { useI18n } from '../i18n';
import { colors, radius, tracking } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Trends and observations. Correlations are always framed as things worth
 * watching — never as findings, and never as advice.
 */
export function ProgressScreen() {
  const navigation = useAppNavigation();
  const { state, set } = useAppState();
  const { t, row } = useI18n();

  return (
    <Screen tabs>
      <Display size={26} style={{ paddingTop: 6 }}>
        {t('progress.title')}
      </Display>

      <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 10 }}>
        {STAT_CARDS.map((stat) => (
          <Card key={stat.name} style={{ flexGrow: 1, flexBasis: '47%', paddingVertical: 14, paddingHorizontal: 16 }}>
            <Text weight="bold" size={20} color={colors.greenDeep}>
              {t(stat.value)}
            </Text>
            <Text size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
              {t(stat.name)}
            </Text>
            <Text
              weight="semibold"
              size={11.5}
              color={stat.tone === 'good' ? colors.green : colors.faint}
              style={{ marginTop: 4 }}
            >
              {t(stat.delta)}
            </Text>
          </Card>
        ))}
      </View>

      <Card style={{ padding: 18, borderRadius: radius.cardLg }}>
        <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <Text weight="semibold" size={15}>
            {t('progress.calmDays')}
          </Text>
          <Text size={12.5} color={colors.faint}>
            {t('progress.last14')}
          </Text>
        </View>
        <View style={{ flexDirection: row, alignItems: 'flex-end', gap: 5, height: 90 }}>
          {TREND_VALUES.map((value, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: `${value}%`,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                borderBottomLeftRadius: 2,
                borderBottomRightRadius: 2,
                backgroundColor: trendColor(value),
              }}
            />
          ))}
        </View>
        <View style={{ flexDirection: row, justifyContent: 'space-between', marginTop: 8 }}>
          <Text size={11} color={colors.faint}>
            {t('progress.chartStart')}
          </Text>
          <Text size={11} color={colors.faint}>
            {t('progress.chartEnd')}
          </Text>
        </View>
        <Text size={13.5} color={colors.muted} lineHeight={20} style={{ marginTop: 12 }}>
          {t('progress.chartNote')}
        </Text>
      </Card>

      <FeatureCard style={{ padding: 18 }}>
        <Text
          weight="semibold"
          size={12}
          color={colors.greenPale}
          style={{ letterSpacing: tracking(12, 0.08), textTransform: 'uppercase' }}
        >
          {t('progress.insight.eyebrow')}
        </Text>
        <Text weight="serif" size={18} color={colors.white} lineHeight={25} style={{ marginTop: 6 }}>
          {t('progress.insight.body')}
        </Text>
        <Text size={13} color={colors.greenPale} style={{ marginTop: 8 }}>
          {t('progress.insight.note')}
        </Text>
      </FeatureCard>

      <Card style={{ padding: 18, borderRadius: radius.cardLg }}>
        <Text weight="semibold" size={15} style={{ marginBottom: 10 }}>
          {t('progress.patterns')}
        </Text>
        <View style={{ gap: 10 }}>
          {PATTERNS.map((pattern) => (
            <View key={pattern.text} style={{ flexDirection: row, gap: 12 }}>
              <Dot color={toneColors[pattern.tone].dot} style={{ marginTop: 4 }} />
              <Text size={13.5} color={colors.inkSoft} lineHeight={20} style={{ flex: 1 }}>
                <EmphasisedText text={t(pattern.text)} />
              </Text>
            </View>
          ))}
        </View>
        <NoteCard style={{ marginTop: 12, padding: 12 }}>
          <Text size={12.5} color={colors.muted} lineHeight={19}>
            {t('progress.patterns.note')}
          </Text>
        </NoteCard>
      </Card>

      {state.weightVisible ? (
        <Card style={{ padding: 18, borderRadius: radius.cardLg }}>
          <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text weight="semibold" size={15}>
              {t('progress.weight')}
            </Text>
            <TextButton label={t('common.hide')} size={12.5} color={colors.faint} onPress={() => set({ weightVisible: false })} />
          </View>
          <Text weight="bold" size={22} color={colors.greenDeep} style={{ marginTop: 6 }}>
            {t('progress.weightValue')}{' '}
            <Strong weight="semibold" size={12.5} color={colors.green}>
              {t('progress.weightDelta')}
            </Strong>
          </Text>
          <Text size={12.5} color={colors.faint} style={{ marginTop: 4 }}>
            {t('progress.weightNote')}
          </Text>
        </Card>
      ) : (
        <EmptyCard style={{ padding: 14, alignItems: 'center' }}>
          <TextButton
            label={t('progress.weightOff')}
            size={13.5}
            color={colors.faint}
            onPress={() => set({ weightVisible: true })}
          />
        </EmptyCard>
      )}

      <View style={{ flexDirection: row, gap: 10 }}>
        <OutlineButton
          label={t('progress.checkInLink')}
          size={14}
          background={colors.surface}
          borderColor={colors.line}
          style={{ flex: 1, borderWidth: 1, borderRadius: radius.tile, paddingVertical: 14 }}
          onPress={() => navigation.navigate('CheckIn')}
        />
        <OutlineButton
          label={t('progress.exportLink')}
          size={14}
          background={colors.surface}
          style={{ flex: 1, borderRadius: radius.tile, paddingVertical: 14 }}
          onPress={() => navigation.navigate('DoctorReport')}
        />
      </View>
    </Screen>
  );
}

/** Renders the `**bold**` runs the pattern copy uses. */
export function EmphasisedText({ text }: { text: string }) {
  const parts = text.split('**');
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <Strong key={i}>{part}</Strong> : part))}
    </>
  );
}
