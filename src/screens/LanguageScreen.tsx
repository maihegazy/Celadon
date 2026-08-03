import React from 'react';
import { View } from 'react-native';
import { Display, NoteCard, OptionCard, RadioDot, Screen, Text } from '../components';
import { BackChevron } from '../components/Buttons';
import { LANGUAGES, useI18n } from '../i18n';
import { colors } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Language picker.
 *
 * Switching is immediate — every screen re-renders in the new language and the
 * layout mirrors with it. Nothing the user has logged is touched.
 */
export function LanguageScreen() {
  const navigation = useAppNavigation();
  const { t, lang, setLanguage, row } = useI18n();

  return (
    <Screen tabs gap={14}>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('Profile')} />
        <Display size={26}>{t('language.title')}</Display>
      </View>

      <Text size={14} color={colors.muted} lineHeight={22}>
        {t('language.subtitle')}
      </Text>

      <View style={{ gap: 10 }}>
        {LANGUAGES.map((option) => {
          const selected = lang === option.code;
          return (
            <OptionCard
              key={option.code}
              selected={selected}
              onPress={() => setLanguage(option.code)}
              padding={0}
              style={{
                flexDirection: row,
                alignItems: 'center',
                gap: 12,
                paddingVertical: 16,
                paddingHorizontal: 16,
              }}
            >
              <RadioDot selected={selected} />
              <View style={{ flex: 1 }}>
                <Text weight="semibold" size={15.5}>
                  {t(option.nativeKey)}
                </Text>
                <Text size={13} color={colors.muted} style={{ marginTop: 2 }}>
                  {/* The endonym is already the title — only name it again when it differs. */}
                  {t(option.nameKey) === t(option.nativeKey)
                    ? t(option.noteKey)
                    : `${t(option.nameKey)} · ${t(option.noteKey)}`}
                </Text>
              </View>
            </OptionCard>
          );
        })}
      </View>

      <NoteCard style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
        <Text size={12.5} color={colors.muted} lineHeight={20}>
          {t('language.note')}
        </Text>
      </NoteCard>
    </Screen>
  );
}
