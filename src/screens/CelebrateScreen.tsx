import React from 'react';
import { Display, LeafBadge, PrimaryButton, Screen, Text } from '../components';
import { useAppState } from '../state/AppState';
import { useI18n } from '../i18n';
import { colors } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Post-check-in acknowledgement. Calm rather than gamified — no streaks, no
 * confetti, and a different message on flare days.
 */
export function CelebrateScreen() {
  const navigation = useAppNavigation();
  const { state } = useAppState();
  const { t } = useI18n();

  const title = state.flare ? t('celebrate.flareTitle') : t('celebrate.title');
  const body = state.flare ? t('celebrate.flareBody') : t('celebrate.body');

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
        label={t('common.continue')}
        size={15}
        style={{ paddingHorizontal: 40, paddingVertical: 15, marginTop: 8 }}
        onPress={() => navigation.navigate('Home')}
      />
    </Screen>
  );
}
