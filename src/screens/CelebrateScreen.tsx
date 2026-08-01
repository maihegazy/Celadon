import React from 'react';
import { Display, LeafBadge, PrimaryButton, Screen, Text } from '../components';
import { useAppState } from '../state/AppState';
import { colors } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Post-check-in acknowledgement. Calm rather than gamified — no streaks, no
 * confetti, and a different message on flare days.
 */
export function CelebrateScreen() {
  const navigation = useAppNavigation();
  const { state } = useAppState();

  const title = state.flare ? 'Thanks for telling us.' : 'Logged — gently done.';
  const body = state.flare
    ? "We've softened the rest of this week and noted the date. Rest is productive too."
    : "That's 12 check-ins this month. Small notices add up to real patterns.";

  return (
    <Screen scroll={false} center padding={40} gap={16} contentStyle={{ alignItems: 'center' }}>
      <LeafBadge size={80} leaf={30} />
      <Display size={27} align="center">
        {title}
      </Display>
      <Text size={14.5} color={colors.muted} lineHeight={23} align="center" style={{ maxWidth: 290 }}>
        {body}
      </Text>
      <PrimaryButton
        label="Continue"
        size={15}
        style={{ paddingHorizontal: 40, paddingVertical: 15, marginTop: 8 }}
        onPress={() => navigation.navigate('Home')}
      />
    </Screen>
  );
}
