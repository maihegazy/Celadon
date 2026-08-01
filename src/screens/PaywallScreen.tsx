import React from 'react';
import { Pressable, View } from 'react-native';
import { Card, Display, PrimaryButton, Screen, Text, TextButton } from '../components';
import { BackChevron } from '../components/Buttons';
import { PAYWALL_FEATURES, PAYWALL_PLANS } from '../data/content';
import { useAppState } from '../state/AppState';
import { colors, radius } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Subscription. No countdowns, no invented urgency, no health claims — the
 * comparison table and the cancellation terms carry the whole argument.
 */
export function PaywallScreen() {
  const navigation = useAppNavigation();
  const { state, set } = useAppState();
  const selected = PAYWALL_PLANS[state.selectedPlan];

  return (
    <Screen paddingBottom={40}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.goBack()} />
        <Display size={26}>Celadon Premium</Display>
      </View>

      <Text size={14.5} color={colors.muted} lineHeight={22}>
        The full experience — unlimited scanning, adaptive plans and the insights that make patterns visible.
      </Text>

      <Card style={{ overflow: 'hidden', borderRadius: radius.cardLg }}>
        <View
          style={{ flexDirection: 'row', backgroundColor: colors.sunken, paddingVertical: 12, paddingHorizontal: 16 }}
        >
          <View style={{ flex: 1.6 }} />
          <Text weight="bold" size={12} color={colors.muted} style={{ flex: 1 }}>
            Free
          </Text>
          <Text weight="bold" size={12} color={colors.greenDeep} style={{ flex: 1 }}>
            Premium
          </Text>
        </View>
        {PAYWALL_FEATURES.map((feature, index) => (
          <View
            key={feature.name}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderBottomWidth: index === PAYWALL_FEATURES.length - 1 ? 0 : 1,
              borderBottomColor: colors.sunken,
            }}
          >
            <Text weight="medium" size={13} lineHeight={18} style={{ flex: 1.6 }}>
              {feature.name}
            </Text>
            <Text size={13} color={colors.faint} style={{ flex: 1 }}>
              {feature.free}
            </Text>
            <Text weight="semibold" size={13} color={colors.greenDeep} style={{ flex: 1 }}>
              {feature.premium}
            </Text>
          </View>
        ))}
      </Card>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        {PAYWALL_PLANS.map((plan, index) => {
          const active = state.selectedPlan === index;
          return (
            <Pressable
              key={plan.name}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => set({ selectedPlan: index })}
              style={({ pressed }) => [
                {
                  flex: 1,
                  padding: 16,
                  borderRadius: radius.card,
                  borderWidth: 1.5,
                  backgroundColor: active ? colors.greenLight : colors.surface,
                  borderColor: active ? colors.green : colors.border,
                },
                pressed && { opacity: 0.9 },
              ]}
            >
              {plan.save ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -9,
                    right: 12,
                    backgroundColor: colors.amber,
                    borderRadius: 9,
                    paddingVertical: 3,
                    paddingHorizontal: 9,
                  }}
                >
                  <Text weight="bold" size={10.5} color={colors.white}>
                    SAVE 33%
                  </Text>
                </View>
              ) : null}
              <Text weight="semibold" size={13} color={colors.muted}>
                {plan.name}
              </Text>
              <Text weight="bold" size={19} style={{ marginTop: 3 }}>
                {plan.price}
              </Text>
              <Text size={12} color={colors.faint} style={{ marginTop: 2 }}>
                {plan.note}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton label="Start 7-day free trial" />

      <Text size={12.5} color={colors.faint} align="center" lineHeight={20}>
        Free for 7 days, then {selected.billed}. Cancel anytime in one tap — we'll remind you two days before the
        trial ends. Your data stays yours either way.
      </Text>

      <TextButton label="Restore purchases" size={13.5} color={colors.green} style={{ alignSelf: 'center' }} />
    </Screen>
  );
}
