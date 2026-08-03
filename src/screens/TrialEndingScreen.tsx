import React from 'react';
import { View } from 'react-native';
import { Card, Display, OutlineButton, PrimaryButton, Screen, Text, TintCard } from '../components';
import { BackChevron } from '../components/Buttons';
import { useI18n } from '../i18n';
import type { TranslationKey } from '../i18n';
import { colors, radius, tracking } from '../theme';
import { useAppNavigation } from '../navigation/types';

const FREE_FEATURES: TranslationKey[] = ['trial.free.1', 'trial.free.2', 'trial.free.3'];
const PREMIUM_FEATURES: TranslationKey[] = ['trial.premium.1', 'trial.premium.2', 'trial.premium.3'];

/** Trial ending — what happens either way, said before it happens. */
export function TrialEndingScreen() {
  const navigation = useAppNavigation();
  const { t, row } = useI18n();

  return (
    <Screen gap={14} paddingBottom={40}>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('Profile')} />
        <Display size={26} style={{ flex: 1 }}>
          {t('trial.title')}
        </Display>
      </View>

      <Text size={14} color={colors.muted} lineHeight={22}>
        {t('trial.subtitle')}
      </Text>

      <Card style={{ padding: 16 }}>
        <Text
          weight="bold"
          size={12}
          color={colors.faint}
          style={{ letterSpacing: tracking(12, 0.07), textTransform: 'uppercase', marginBottom: 8 }}
        >
          {t('trial.free.label')}
        </Text>
        <View style={{ gap: 8 }}>
          {FREE_FEATURES.map((feature) => (
            <Text key={feature} size={13.5} color={colors.inkSoft} lineHeight={20}>
              · {t(feature)}
            </Text>
          ))}
        </View>
      </Card>

      <TintCard style={{ padding: 16, borderWidth: 1.5, borderColor: colors.green }}>
        <Text
          weight="bold"
          size={12}
          color={colors.green}
          style={{ letterSpacing: tracking(12, 0.07), textTransform: 'uppercase', marginBottom: 8 }}
        >
          {t('trial.premium.label')}
        </Text>
        <View style={{ gap: 8 }}>
          {PREMIUM_FEATURES.map((feature) => (
            <Text key={feature} size={13.5} color={colors.greenDeep} lineHeight={20}>
              · {t(feature)}
            </Text>
          ))}
        </View>
      </TintCard>

      <PrimaryButton label={t('trial.seePlans')} onPress={() => navigation.navigate('Paywall')} />
      <OutlineButton
        label={t('trial.switchFree')}
        size={14.5}
        color={colors.muted}
        onPress={() => navigation.navigate('Profile')}
        style={{ borderRadius: radius.pill }}
      />
    </Screen>
  );
}
