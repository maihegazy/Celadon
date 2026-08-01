import React from 'react';
import { Pressable, View } from 'react-native';
import { Card, Display, NoteCard, Screen, SectionLabel, Text, TextButton } from '../components';
import { MEDICAL_NOTE } from '../data/content';
import { useAppState } from '../state/AppState';
import { colors, radius } from '../theme';
import { RootStackParamList, useAppNavigation } from '../navigation/types';

/**
 * Profile and settings. Every assessment answer stays editable, gentle mode is
 * one row away, and deleting the account is offered plainly rather than buried.
 */
export function ProfileScreen() {
  const navigation = useAppNavigation();
  const { state } = useAppState();

  const goStep = (step: number) => () =>
    navigation.navigate('Onboarding', { step, returnTo: 'Profile' as keyof RootStackParamList });

  const sections: { name: string; rows: { name: string; value?: string; onPress?: () => void }[] }[] = [
    {
      name: 'Health',
      rows: [
        { name: 'Health profile & goals', value: "Hashimoto's", onPress: goStep(1) },
        { name: 'Conditions', onPress: goStep(2) },
        { name: 'Restrictions & avoids', value: 'Gluten, nightshades', onPress: goStep(4) },
      ],
    },
    {
      name: 'Food',
      rows: [
        { name: 'Saved recipes', value: '8', onPress: () => navigation.navigate('Recipes', { filter: 5 }) },
        { name: 'Favourite meals', value: '5', onPress: () => navigation.navigate('Recipes', { filter: 0 }) },
      ],
    },
    {
      name: 'App',
      rows: [
        { name: 'Language', value: 'English · العربية', onPress: () => navigation.navigate('ArabicPreview') },
        { name: 'Gentle mode', value: state.comfort === 1 ? 'On' : 'Off', onPress: () => navigation.navigate('GentleMode') },
        { name: 'Notifications', value: 'Gentle', onPress: () => navigation.navigate('Notifications') },
        { name: 'Connected devices', value: 'Apple Health' },
        { name: 'Subscription', value: 'Trial · 5 days', onPress: () => navigation.navigate('TrialEnding') },
      ],
    },
    {
      name: 'Privacy & support',
      rows: [
        { name: 'Privacy & data', onPress: () => navigation.navigate('Legal', { tab: 0 }) },
        { name: 'Medical disclaimer', onPress: () => navigation.navigate('Legal', { tab: 2 }) },
        { name: 'Help & support' },
      ],
    },
  ];

  return (
    <Screen tabs>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 6 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.greenLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text weight="semibold" size={20} color={colors.green}>
            M
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Display size={24}>Maya</Display>
          <Text size={13} color={colors.faint} style={{ marginTop: 1 }}>
            Cairo · joined July 2026
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('Paywall')}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: colors.greenDeep,
            borderRadius: radius.card,
            padding: 16,
          },
          pressed && { opacity: 0.9 },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text weight="semibold" size={14.5} color={colors.white}>
            Celadon Premium trial
          </Text>
          <Text size={12.5} color={colors.greenPale} style={{ marginTop: 2 }}>
            5 days left · see plans
          </Text>
        </View>
        <Text size={18} color={colors.greenPale}>
          ›
        </Text>
      </Pressable>

      {sections.map((section) => (
        <View key={section.name}>
          <SectionLabel size={12} style={{ marginBottom: 8 }}>
            {section.name}
          </SectionLabel>
          <Card style={{ overflow: 'hidden' }}>
            {section.rows.map((row, index) => (
              <Pressable
                key={row.name}
                accessibilityRole="button"
                onPress={row.onPress}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderBottomWidth: index === section.rows.length - 1 ? 0 : 1,
                    borderBottomColor: colors.sunken,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text weight="medium" size={14.5} style={{ flex: 1 }}>
                  {row.name}
                </Text>
                {row.value ? (
                  <Text size={13} color={colors.faint}>
                    {row.value}
                  </Text>
                ) : null}
                <Text size={16} color={colors.chevron}>
                  ›
                </Text>
              </Pressable>
            ))}
          </Card>
        </View>
      ))}

      <NoteCard style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
        <Text size={12.5} color={colors.muted} lineHeight={20}>
          <Text weight="bold" size={12.5} color={colors.muted}>
            A note on care:
          </Text>{' '}
          {MEDICAL_NOTE}
        </Text>
      </NoteCard>

      <TextButton
        label="Delete my account"
        color={colors.red}
        style={{ alignSelf: 'center', padding: 8 }}
        onPress={() => navigation.navigate('DeleteAccount')}
      />
    </Screen>
  );
}
