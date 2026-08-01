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
import { COMPARE_ROWS, COMPARE_VERDICT, EXPLORE_CATEGORIES, POPULAR_FOODS } from '../data/content';
import { colors, radius } from '../theme';
import { useAppNavigation } from '../navigation/types';

/** Search, browse by kind, and a side-by-side comparison of two foods. */
export function ExploreScreen() {
  const navigation = useAppNavigation();
  const [comparing, setComparing] = useState(false);

  return (
    <Screen tabs>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('Home')} />
        <Display size={26}>Explore</Display>
      </View>

      <Field shape="pill" placeholder="Search meals, ingredients, recipes…" />

      {!comparing ? (
        <>
          <View>
            <SectionLabel style={{ marginBottom: 8 }}>Browse by kind</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {EXPLORE_CATEGORIES.map((category) => (
                <Card
                  key={category.name}
                  style={{
                    flexGrow: 1,
                    flexBasis: '46%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    padding: 14,
                    borderRadius: radius.tile,
                  }}
                >
                  <Dot color={category.dot} />
                  <Text weight="semibold" size={13.5} style={{ flex: 1 }}>
                    {category.name}
                  </Text>
                </Card>
              ))}
            </View>
          </View>

          <View>
            <SectionLabel style={{ marginBottom: 8 }}>Popular near you</SectionLabel>
            <View style={{ gap: 8 }}>
              {POPULAR_FOODS.map((food) => (
                <Card
                  key={food.name}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: radius.tileSm,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text weight="semibold" size={14.5}>
                      {food.name}
                    </Text>
                    <Text size={12.5} color={colors.muted} style={{ marginTop: 1 }}>
                      {food.note}
                    </Text>
                  </View>
                  <Pill
                    label={food.tag}
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
                Compare two foods →{' '}
                <Text weight="medium" size={14} color={colors.faint}>
                  e.g. feta vs labneh
                </Text>
              </Text>
            </Card>
          </Pressable>
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text weight="semibold" size={16}>
              Feta vs Labneh
            </Text>
            <TextButton
              label="‹ Back to search"
              size={13.5}
              color={colors.muted}
              onPress={() => setComparing(false)}
            />
          </View>

          <Card style={{ overflow: 'hidden', borderRadius: radius.cardLg }}>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: colors.sunken,
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
            >
              <View style={{ flex: 1 }} />
              <Text weight="bold" size={12.5} color={colors.muted} style={{ flex: 1 }}>
                Feta
              </Text>
              <Text weight="bold" size={12.5} color={colors.muted} style={{ flex: 1 }}>
                Labneh
              </Text>
            </View>
            {COMPARE_ROWS.map((row, index) => (
              <View
                key={row.key}
                style={{
                  flexDirection: 'row',
                  paddingVertical: 13,
                  paddingHorizontal: 16,
                  borderBottomWidth: index === COMPARE_ROWS.length - 1 ? 0 : 1,
                  borderBottomColor: colors.sunken,
                }}
              >
                <Text weight="semibold" size={13} color={colors.faint} lineHeight={19} style={{ flex: 1 }}>
                  {row.key}
                </Text>
                <Text size={13} color={colors.inkSoft} lineHeight={19} style={{ flex: 1 }}>
                  {row.a}
                </Text>
                <Text size={13} color={colors.inkSoft} lineHeight={19} style={{ flex: 1 }}>
                  {row.b}
                </Text>
              </View>
            ))}
          </Card>

          <TintCard style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.tile }}>
            <Text size={13.5} color={colors.greenDeep} lineHeight={20}>
              {COMPARE_VERDICT}
            </Text>
          </TintCard>
        </>
      )}
    </Screen>
  );
}
