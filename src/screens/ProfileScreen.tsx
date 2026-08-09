import React from 'react';
import { Pressable, View } from 'react-native';
import { Card, Display, LeafMark, NoteCard, Screen, SectionLabel, Text, TextButton } from '../components';
import { AVOIDS, COUNTRIES, GOALS } from '../data/assessment';
import { useAuth } from '../services/auth';
import { useContent } from '../services/content';
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
  const { state, dispatch } = useAppState();
  const { savedSlugs } = useContent();
  const { service, session } = useAuth();

  const signOut = async () => {
    await service.signOut();
    // Clear this session's answers; they're restored from the account on the
    // next sign-in.
    dispatch({ type: 'signOut' });
  };
  const { t, n, lang, row, chevronForward } = useI18n();

  const goStep = (step: number) => () =>
    navigation.navigate('Onboarding', { step, returnTo: 'Profile' as keyof RootStackParamList });

  // "Egypt · joined August 2026" — the location is the assessment answer, the
  // date comes from the account itself.
  const joinedAt = session?.user.createdAt ? new Date(session.user.createdAt) : null;
  const meta = [
    t(COUNTRIES[state.country] ?? COUNTRIES[COUNTRIES.length - 1]),
    joinedAt
      ? t('profile.joined', {
          date: joinedAt.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
            month: 'long',
            year: 'numeric',
          }),
        })
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const avoidLabels = AVOIDS.filter((_, index) => state.avoids[index]).map((key) => t(key));
  const restrictionsValue =
    avoidLabels.length === 0
      ? t('profile.restrictions.none')
      : avoidLabels.length <= 2
        ? avoidLabels.join(t('common.listSeparator'))
        : `${avoidLabels.slice(0, 2).join(t('common.listSeparator'))} +${n(avoidLabels.length - 2)}`;

  const sections: { name: string; rows: { name: string; value?: string; onPress?: () => void }[] }[] = [
    {
      name: t('profile.section.health'),
      rows: [
        { name: t('profile.about'), value: state.displayName || undefined, onPress: goStep(1) },
        { name: t('profile.healthProfile'), value: t(GOALS[state.goal] ?? GOALS[0]), onPress: goStep(2) },
        { name: t('profile.conditions'), onPress: goStep(3) },
        { name: t('profile.restrictions'), value: restrictionsValue, onPress: goStep(5) },
      ],
    },
    {
      name: t('profile.section.food'),
      rows: [
        { name: t('profile.savedRecipes'), value: n(savedSlugs.length), onPress: () => navigation.navigate('Recipes', { filter: 5 }) },
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
        { name: t('profile.subscription'), value: t('profile.subscription.value'), onPress: () => navigation.navigate('TrialEnding') },
      ],
    },
    {
      name: t('profile.section.privacy'),
      rows: [
        { name: t('profile.privacy'), onPress: () => navigation.navigate('Legal', { tab: 0 }) },
        { name: t('profile.disclaimer'), onPress: () => navigation.navigate('Legal', { tab: 2 }) },
      ],
    },
  ];

  sections[2].rows.push({ name: t('auth.signOut'), onPress: signOut });

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
          {state.displayName.trim() ? (
            <Text weight="semibold" size={20} color={colors.green}>
              {state.displayName.trim().charAt(0).toUpperCase()}
            </Text>
          ) : (
            <LeafMark size={24} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Display size={24}>{state.displayName.trim() || t('profile.name')}</Display>
          <Text size={13} color={colors.faint} style={{ marginTop: 1 }}>
            {meta}
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
