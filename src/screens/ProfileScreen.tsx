import React from 'react';
import { Pressable, View } from 'react-native';
import { Card, Display, NoteCard, Screen, SectionLabel, Text, TextButton } from '../components';
import { useAppState } from '../state/AppState';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';
import { RootStackParamList, useAppNavigation } from '../navigation/types';

/**
 * Profile and settings. Every assessment answer stays editable, gentle mode is
 * one row away, and deleting the account is offered plainly rather than buried.
 */
export function ProfileScreen() {
  const navigation = useAppNavigation();
  const { state } = useAppState();
  const { t, n, row, chevronForward } = useI18n();

  const goStep = (step: number) => () =>
    navigation.navigate('Onboarding', { step, returnTo: 'Profile' as keyof RootStackParamList });

  const sections: { name: string; rows: { name: string; value?: string; onPress?: () => void }[] }[] = [
    {
      name: t('profile.section.health'),
      rows: [
        { name: t('profile.healthProfile'), value: t('profile.healthProfile.value'), onPress: goStep(1) },
        { name: t('profile.conditions'), onPress: goStep(2) },
        { name: t('profile.restrictions'), value: t('profile.restrictions.value'), onPress: goStep(4) },
      ],
    },
    {
      name: t('profile.section.food'),
      rows: [
        { name: t('profile.savedRecipes'), value: n(8), onPress: () => navigation.navigate('Recipes', { filter: 5 }) },
        { name: t('profile.favouriteMeals'), value: n(5), onPress: () => navigation.navigate('Recipes', { filter: 0 }) },
      ],
    },
    {
      name: t('profile.section.app'),
      rows: [
        { name: t('profile.language'), value: t('profile.language.value'), onPress: () => navigation.navigate('Language') },
        {
          name: t('profile.gentleMode'),
          value: state.comfort === 1 ? t('profile.on') : t('profile.off'),
          onPress: () => navigation.navigate('GentleMode'),
        },
        { name: t('profile.notifications'), value: t('profile.notifications.value'), onPress: () => navigation.navigate('Notifications') },
        { name: t('profile.devices'), value: t('profile.devices.value') },
        { name: t('profile.subscription'), value: t('profile.subscription.value'), onPress: () => navigation.navigate('TrialEnding') },
      ],
    },
    {
      name: t('profile.section.privacy'),
      rows: [
        { name: t('profile.privacy'), onPress: () => navigation.navigate('Legal', { tab: 0 }) },
        { name: t('profile.disclaimer'), onPress: () => navigation.navigate('Legal', { tab: 2 }) },
        { name: t('profile.help') },
      ],
    },
  ];

  return (
    <Screen tabs>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 14, paddingTop: 6 }}>
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
          <Display size={24}>{t('profile.name')}</Display>
          <Text size={13} color={colors.faint} style={{ marginTop: 1 }}>
            {t('profile.meta')}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('Paywall')}
        style={({ pressed }) => [
          {
            flexDirection: row,
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
            {t('profile.trial.title')}
          </Text>
          <Text size={12.5} color={colors.greenPale} style={{ marginTop: 2 }}>
            {t('profile.trial.note')}
          </Text>
        </View>
        <Text size={18} color={colors.greenPale}>
          {chevronForward}
        </Text>
      </Pressable>

      {sections.map((section) => (
        <View key={section.name}>
          <SectionLabel size={12} style={{ marginBottom: 8 }}>
            {section.name}
          </SectionLabel>
          <Card style={{ overflow: 'hidden' }}>
            {section.rows.map((entry, index) => (
              <Pressable
                key={entry.name}
                accessibilityRole="button"
                onPress={entry.onPress}
                style={({ pressed }) => [
                  {
                    flexDirection: row,
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
                  {entry.name}
                </Text>
                {entry.value ? (
                  <Text size={13} color={colors.faint}>
                    {entry.value}
                  </Text>
                ) : null}
                <Text size={16} color={colors.chevron}>
                  {chevronForward}
                </Text>
              </Pressable>
            ))}
          </Card>
        </View>
      ))}

      <NoteCard style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
        <Text size={12.5} color={colors.muted} lineHeight={20}>
          <Text weight="bold" size={12.5} color={colors.muted}>
            {t('profile.careNote.label')}
          </Text>{' '}
          {t('profile.careNote.body')}
        </Text>
      </NoteCard>

      <TextButton
        label={t('profile.delete')}
        color={colors.red}
        style={{ alignSelf: 'center', padding: 8 }}
        onPress={() => navigation.navigate('DeleteAccount')}
      />
    </Screen>
  );
}
