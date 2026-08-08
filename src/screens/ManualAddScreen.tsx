import React from 'react';
import { Pressable, View } from 'react-native';
import {
  Card,
  Display,
  Field,
  Pill,
  Screen,
  SectionLabel,
  SmallButton,
  Text,
} from '../components';
import { BackChevron } from '../components/Buttons';
import { MANUAL_FOODS } from '../data/content';
import { useTracking } from '../state/TrackingSync';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';
import { useAppNavigation } from '../navigation/types';

const toneBackground = {
  good: { bg: colors.greenLight, fg: colors.green },
  flag: { bg: colors.amberLight, fg: colors.amber },
  limit: { bg: colors.redLight, fg: colors.red },
};

/** Manual entry — the path when there's no photo, or no appetite for one. */
export function ManualAddScreen() {
  const navigation = useAppNavigation();
  const { addFood } = useTracking();
  const { t, row } = useI18n();

  const add = (nameKey: (typeof MANUAL_FOODS)[number]['name']) => {
    // Stored as the text the user saw — the diary table keeps plain names.
    addFood({ name: t(nameKey) });
    navigation.navigate('Diary');
  };

  return (
    <Screen tabs>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('Diary')} />
        <Display size={26}>{t('manual.title')}</Display>
      </View>

      <Field shape="pill" placeholder={t('manual.searchPlaceholder')} />

      <View>
        <SectionLabel style={{ marginBottom: 8 }}>{t('manual.recent')}</SectionLabel>
        <View style={{ gap: 8 }}>
          {MANUAL_FOODS.map((food) => {
            const tone = toneBackground[food.tone];
            return (
              <Card
                key={food.name}
                style={{
                  flexDirection: row,
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: radius.tileSm,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text weight="semibold" size={14.5}>
                    {t(food.name)}
                  </Text>
                  <Text size={12.5} color={colors.muted} style={{ marginTop: 1 }}>
                    {t(food.note)}
                  </Text>
                </View>
                <Pill
                  label={t(food.tag)}
                  size={11}
                  background={tone.bg}
                  color={tone.fg}
                  style={{ borderRadius: radius.thumbSm, paddingHorizontal: 9, paddingVertical: 3 }}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('manual.a11y.add', { food: t(food.name) })}
                  onPress={() => add(food.name)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.greenLight,
                      borderRadius: 14,
                      paddingVertical: 7,
                      paddingHorizontal: 13,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text weight="bold" size={12.5} color={colors.green}>
                    {t('manual.add')}
                  </Text>
                </Pressable>
              </Card>
            );
          })}
        </View>
      </View>

      <Card style={{ flexDirection: row, alignItems: 'center', gap: 12, padding: 16 }}>
        <View style={{ flex: 1 }}>
          <Text weight="semibold" size={14}>
            {t('manual.faster.title')}
          </Text>
          <Text size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
            {t('manual.faster.body')}
          </Text>
        </View>
        <SmallButton
          label={t('manual.faster.cta')}
          style={{ borderRadius: 18, paddingHorizontal: 16 }}
          onPress={() => navigation.navigate('Scan')}
        />
      </Card>
    </Screen>
  );
}
