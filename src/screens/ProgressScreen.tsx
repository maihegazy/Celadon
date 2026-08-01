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
import { PATTERNS, STAT_CARDS, toneColors, trendColor, TREND_VALUES, WEEKLY_INSIGHT } from '../data/content';
import { useAppState } from '../state/AppState';
import { colors, radius, tracking } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Trends and observations. Correlations are always framed as things worth
 * watching — never as findings, and never as advice.
 */
export function ProgressScreen() {
  const navigation = useAppNavigation();
  const { state, set } = useAppState();

  return (
    <Screen tabs>
      <Display size={26} style={{ paddingTop: 6 }}>
        Your progress
      </Display>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {STAT_CARDS.map((stat) => (
          <Card key={stat.name} style={{ flexGrow: 1, flexBasis: '47%', paddingVertical: 14, paddingHorizontal: 16 }}>
            <Text weight="bold" size={20} color={colors.greenDeep}>
              {stat.value}
            </Text>
            <Text size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
              {stat.name}
            </Text>
            <Text
              weight="semibold"
              size={11.5}
              color={stat.tone === 'good' ? colors.green : colors.faint}
              style={{ marginTop: 4 }}
            >
              {stat.delta}
            </Text>
          </Card>
        ))}
      </View>

      <Card style={{ padding: 18, borderRadius: radius.cardLg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <Text weight="semibold" size={15}>
            Calm days
          </Text>
          <Text size={12.5} color={colors.faint}>
            last 14 days
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 90 }}>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text size={11} color={colors.faint}>
            Jul 18
          </Text>
          <Text size={11} color={colors.faint}>
            Jul 31
          </Text>
        </View>
        <Text size={13.5} color={colors.muted} lineHeight={20} style={{ marginTop: 12 }}>
          11 of 14 days felt calm — your best two weeks since you started. Amber bars are flare days.
        </Text>
      </Card>

      <FeatureCard style={{ padding: 18 }}>
        <Text
          weight="semibold"
          size={12}
          color={colors.greenPale}
          style={{ letterSpacing: tracking(12, 0.08), textTransform: 'uppercase' }}
        >
          This week's insight
        </Text>
        <Text weight="serif" size={18} color={colors.white} lineHeight={25} style={{ marginTop: 6 }}>
          {WEEKLY_INSIGHT}
        </Text>
        <Text size={13} color={colors.greenPale} style={{ marginTop: 8 }}>
          An observation, not a conclusion — worth watching together.
        </Text>
      </FeatureCard>

      <Card style={{ padding: 18, borderRadius: radius.cardLg }}>
        <Text weight="semibold" size={15} style={{ marginBottom: 10 }}>
          Patterns we're noticing
        </Text>
        <View style={{ gap: 10 }}>
          {PATTERNS.map((pattern) => (
            <View key={pattern.text} style={{ flexDirection: 'row', gap: 12 }}>
              <Dot color={toneColors[pattern.tone].dot} style={{ marginTop: 4 }} />
              <Text size={13.5} color={colors.inkSoft} lineHeight={20} style={{ flex: 1 }}>
                <EmphasisedText text={pattern.text} />
              </Text>
            </View>
          ))}
        </View>
        <NoteCard style={{ marginTop: 12, padding: 12 }}>
          <Text size={12.5} color={colors.muted} lineHeight={19}>
            Patterns are hints, not verdicts. Share this view with your nutritionist or doctor from the export button.
          </Text>
        </NoteCard>
      </Card>

      {state.weightVisible ? (
        <Card style={{ padding: 18, borderRadius: radius.cardLg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text weight="semibold" size={15}>
              Weight
            </Text>
            <TextButton label="Hide" size={12.5} color={colors.faint} onPress={() => set({ weightVisible: false })} />
          </View>
          <Text weight="bold" size={22} color={colors.greenDeep} style={{ marginTop: 6 }}>
            72.4 kg{' '}
            <Strong weight="semibold" size={12.5} color={colors.green}>
              −0.6 this month
            </Strong>
          </Text>
          <Text size={12.5} color={colors.faint} style={{ marginTop: 4 }}>
            Slow and steady — exactly right.
          </Text>
        </Card>
      ) : (
        <EmptyCard style={{ padding: 14, alignItems: 'center' }}>
          <TextButton
            label="Weight tracking is off — tap to show it"
            size={13.5}
            color={colors.faint}
            onPress={() => set({ weightVisible: true })}
          />
        </EmptyCard>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <OutlineButton
          label="Daily check-in →"
          size={14}
          background={colors.surface}
          borderColor={colors.line}
          style={{ flex: 1, borderWidth: 1, borderRadius: radius.tile, paddingVertical: 14 }}
          onPress={() => navigation.navigate('CheckIn')}
        />
        <OutlineButton
          label="Export for your doctor"
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
