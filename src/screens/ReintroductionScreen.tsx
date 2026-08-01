import React from 'react';
import { View } from 'react-native';
import {
  Card,
  Display,
  Dot,
  OutlineButton,
  PrimaryButton,
  Screen,
  SegmentBar,
  Text,
} from '../components';
import { BackChevron } from '../components/Buttons';
import { REINTRO_ACTIVE, REINTRO_ITEMS, toneColors } from '../data/content';
import { colors, radius, tracking } from '../theme';
import { useAppNavigation } from '../navigation/types';

const queuedTone = { dot: colors.border, text: colors.faint };

/**
 * Reintroduction tracker — one food at a time, five days each, and pausing is
 * always an acceptable answer.
 */
export function ReintroductionScreen() {
  const navigation = useAppNavigation();

  return (
    <Screen tabs>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('CheckIn')} />
        <Display size={26}>Reintroduction</Display>
      </View>

      <Text size={14} color={colors.muted} lineHeight={22}>
        One food at a time, five days each. If your body stays calm, it goes back on the menu. Go at your own pace
        — pausing is always fine.
      </Text>

      <Card style={{ padding: 18, borderColor: colors.amber, borderWidth: 1.5, borderRadius: radius.cardLg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            weight="bold"
            size={12}
            color={colors.amber}
            style={{ letterSpacing: tracking(12, 0.07), textTransform: 'uppercase' }}
          >
            Testing now
          </Text>
          <Text weight="semibold" size={12.5} color={colors.faint}>
            Day {REINTRO_ACTIVE.day} of {REINTRO_ACTIVE.days}
          </Text>
        </View>
        <Display size={22} style={{ marginTop: 6 }}>
          {REINTRO_ACTIVE.name}
        </Display>
        <View style={{ marginTop: 12 }}>
          <SegmentBar total={REINTRO_ACTIVE.days} filled={REINTRO_ACTIVE.day} />
        </View>
        <Text size={13.5} color={colors.muted} lineHeight={20} style={{ marginTop: 10 }}>
          {REINTRO_ACTIVE.note}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <PrimaryButton
            label="Feeling fine today"
            size={13.5}
            style={{ flex: 1, paddingVertical: 11, borderRadius: 20 }}
          />
          <OutlineButton
            label="I had symptoms"
            size={13.5}
            color={colors.red}
            background={colors.redLight}
            borderColor={colors.redLight}
            style={{ flex: 1, paddingVertical: 11, borderRadius: 20 }}
          />
        </View>
      </Card>

      <View style={{ gap: 8 }}>
        {REINTRO_ITEMS.map((item) => {
          const tone = item.tone === 'queued' ? queuedTone : toneColors[item.tone];
          return (
            <Card
              key={item.name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: radius.tile,
                opacity: item.dim ? 0.55 : 1,
              }}
            >
              <Dot color={tone.dot} />
              <View style={{ flex: 1 }}>
                <Text weight="semibold" size={14.5}>
                  {item.name}
                </Text>
                <Text size={12.5} color={colors.muted} style={{ marginTop: 1 }}>
                  {item.status}
                </Text>
              </View>
              <Text weight="bold" size={12} color={tone.text}>
                {item.tag}
              </Text>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
