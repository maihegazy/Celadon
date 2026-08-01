import React from 'react';
import { View } from 'react-native';
import { BulletRow, Card, Display, NoteCard, OptionCard, Screen, Text } from '../components';
import { BackChevron } from '../components/Buttons';
import { COMFORT_MODES } from '../data/assessment';
import { ComfortMode, useAppState } from '../state/AppState';
import { colors } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Gentle mode — the eating-disorder-sensitive setting. Switching is silent:
 * no confirmation, no explanation asked for, no "are you sure?".
 */
export function GentleModeScreen() {
  const navigation = useAppNavigation();
  const { state, set } = useAppState();

  return (
    <Screen tabs gap={14}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('Profile')} />
        <Display size={26}>Gentle mode</Display>
      </View>

      <Text size={14} color={colors.muted} lineHeight={22}>
        Built with eating-disorder recovery in mind. If numbers around food feel heavy, Celadon works just as well
        without them.
      </Text>

      <View style={{ gap: 10 }}>
        {COMFORT_MODES.map((mode, i) => (
          <OptionCard
            key={mode.name}
            selected={state.comfort === i}
            onPress={() => set({ comfort: i as ComfortMode, numbersOverride: null })}
          >
            <Text weight="semibold" size={15.5}>
              {mode.name}
            </Text>
            <Text size={13.5} color={colors.muted} lineHeight={20} style={{ marginTop: 3 }}>
              {mode.desc}
            </Text>
          </OptionCard>
        ))}
      </View>

      <Card style={{ padding: 16 }}>
        <Text weight="semibold" size={14.5} style={{ marginBottom: 8 }}>
          What changes in gentle mode
        </Text>
        <View style={{ gap: 9 }}>
          <BulletRow color={colors.green} size={13.5}>
            Calories and macros hidden everywhere
          </BulletRow>
          <BulletRow color={colors.green} size={13.5}>
            No weight goals, prompts or tracking
          </BulletRow>
          <BulletRow color={colors.green} size={13.5}>
            Check-ins focus on how you feel, not what you ate
          </BulletRow>
          <BulletRow color={colors.green} size={13.5}>
            Same plans, same recipes, same care
          </BulletRow>
        </View>
      </Card>

      <NoteCard style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
        <Text size={12.5} color={colors.muted} lineHeight={20}>
          Switch anytime — quietly, no questions asked. If you're in treatment, your care team's guidance comes
          first.
        </Text>
      </NoteCard>
    </Screen>
  );
}
