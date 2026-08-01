import React from 'react';
import { View } from 'react-native';
import { Card, Display, OutlineButton, PrimaryButton, Screen, Text, TintCard } from '../components';
import { BackChevron } from '../components/Buttons';
import { colors, radius, tracking } from '../theme';
import { useAppNavigation } from '../navigation/types';

const FREE_FEATURES = ['3 photo scans a week', 'One-week meal plan, refreshed weekly', 'Basic Celadon Score'];
const PREMIUM_FEATURES = [
  'Unlimited scanning with full breakdowns',
  'Plans that adapt to flares and check-ins',
  'Pattern detection and doctor reports',
];

/** Trial ending — what happens either way, said before it happens. */
export function TrialEndingScreen() {
  const navigation = useAppNavigation();

  return (
    <Screen gap={14} paddingBottom={40}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('Profile')} />
        <Display size={26} style={{ flex: 1 }}>
          Your trial ends in 5 days
        </Display>
      </View>

      <Text size={14} color={colors.muted} lineHeight={22}>
        No surprises — here's what happens either way. We'll remind you two days before.
      </Text>

      <Card style={{ padding: 16 }}>
        <Text
          weight="bold"
          size={12}
          color={colors.faint}
          style={{ letterSpacing: tracking(12, 0.07), textTransform: 'uppercase', marginBottom: 8 }}
        >
          If you do nothing — Free
        </Text>
        <View style={{ gap: 8 }}>
          {FREE_FEATURES.map((feature) => (
            <Text key={feature} size={13.5} color={colors.inkSoft} lineHeight={20}>
              · {feature}
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
          Keep Premium
        </Text>
        <View style={{ gap: 8 }}>
          {PREMIUM_FEATURES.map((feature) => (
            <Text key={feature} size={13.5} color={colors.greenDeep} lineHeight={20}>
              · {feature}
            </Text>
          ))}
        </View>
      </TintCard>

      <PrimaryButton label="See plans" onPress={() => navigation.navigate('Paywall')} />
      <OutlineButton
        label="Switch to free when it ends"
        size={14.5}
        color={colors.muted}
        onPress={() => navigation.navigate('Profile')}
        style={{ borderRadius: radius.pill }}
      />
    </Screen>
  );
}
