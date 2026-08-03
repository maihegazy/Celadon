import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Card,
  Display,
  Dot,
  Field,
  Pill,
  Screen,
  SectionLabel,
  Text,
  TextButton,
  TintCard,
} from '../components';
import { BackChevron } from '../components/Buttons';
import { COMPARE_ROWS, EXPLORE_CATEGORIES, POPULAR_FOODS } from '../data/content';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';
import { useAppNavigation } from '../navigation/types';

/** Search, browse by kind, and a side-by-side comparison of two foods. */
export function ExploreScreen() {
  const navigation = useAppNavigation();
  const [comparing, setComparing] = useState(false);
  const { t, row } = useI18n();

  return (
    <Screen tabs>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('Home')} />
        <Display size={26}>{t('explore.title')}</Display>
      </View>

      <Field shape="pill" placeholder={t('explore.searchPlaceholder')} />

      {!comparing ? (
        <>
          <View>
            <SectionLabel style={{ marginBottom: 8 }}>{t('explore.browse')}</SectionLabel>
            <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 10 }}>
              {EXPLORE_CATEGORIES.map((category) => (
                <Card
                  key={category.name}
                  style={{
                    flexGrow: 1,
                    flexBasis: '46%',
                    flexDirection: row,
                    alignItems: 'center',
                    gap: 10,
                    padding: 14,
                    borderRadius: radius.tile,
                  }}
                >
                  <Dot color={category.dot} />
                  <Text weight="semibold" size={13.5} style={{ flex: 1 }}>
                    {t(category.name)}
                  </Text>
                </Card>
              ))}
            </View>
          </View>

          <View>
            <SectionLabel style={{ marginBottom: 8 }}>{t('explore.popular')}</SectionLabel>
            <View style={{ gap: 8 }}>
              {POPULAR_FOODS.map((food) => (
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
                  <View style={{ flex: 1 }}>
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
                    background={food.tone === 'good' ? colors.greenLight : colors.redLight}
                    color={food.tone === 'good' ? colors.green : colors.red}
                    style={{ borderRadius: radius.thumbSm, paddingHorizontal: 9, paddingVertical: 3 }}
                  />
                </Card>
              ))}
            </View>
          </View>

          <Pressable accessibilityRole="button" onPress={() => setComparing(true)}>
            <Card style={{ padding: 15 }}>
              <Text weight="semibold" size={14} color={colors.green}>
                {t('explore.compare')}{' '}
                <Text weight="medium" size={14} color={colors.faint}>
                  {t('explore.compareHint')}
                </Text>
              </Text>
            </Card>
          </Pressable>
        </>
      ) : (
        <>
          <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'center' }}>
            <Text weight="semibold" size={16}>
              {t('explore.compareTitle')}
            </Text>
            <TextButton
              label={t('explore.backToSearch')}
              size={13.5}
              color={colors.muted}
              onPress={() => setComparing(false)}
            />
          </View>

          <Card style={{ overflow: 'hidden', borderRadius: radius.cardLg }}>
            <View
              style={{
                flexDirection: row,
                backgroundColor: colors.sunken,
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
            >
              <View style={{ flex: 1 }} />
              <Text weight="bold" size={12.5} color={colors.muted} style={{ flex: 1 }}>
                {t('compare.feta')}
              </Text>
              <Text weight="bold" size={12.5} color={colors.muted} style={{ flex: 1 }}>
                {t('compare.labneh')}
              </Text>
            </View>
            {COMPARE_ROWS.map((entry, index) => (
              <View
                key={entry.key}
                style={{
                  flexDirection: row,
                  paddingVertical: 13,
                  paddingHorizontal: 16,
                  borderBottomWidth: index === COMPARE_ROWS.length - 1 ? 0 : 1,
                  borderBottomColor: colors.sunken,
                }}
              >
                <Text weight="semibold" size={13} color={colors.faint} lineHeight={19} style={{ flex: 1 }}>
                  {t(entry.key)}
                </Text>
                <Text size={13} color={colors.inkSoft} lineHeight={19} style={{ flex: 1 }}>
                  {t(entry.a)}
                </Text>
                <Text size={13} color={colors.inkSoft} lineHeight={19} style={{ flex: 1 }}>
                  {t(entry.b)}
                </Text>
              </View>
            ))}
          </Card>

          <TintCard style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.tile }}>
            <Text size={13.5} color={colors.greenDeep} lineHeight={20}>
              {t('explore.compareVerdict')}
            </Text>
          </TintCard>
        </>
      )}
    </Screen>
  );
}
