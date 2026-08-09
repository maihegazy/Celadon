import React, { useMemo, useState } from 'react';
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
import { FoodRecord, IngredientTone, useContent } from '../services/content';
import { TranslationKey, useI18n } from '../i18n';
import { colors, radius } from '../theme';
import { useAppNavigation } from '../navigation/types';

const CATEGORY_DOTS: Record<string, string> = {
  greens: colors.green,
  fish: colors.waterBorder,
  spices: colors.amber,
  dairy: colors.plum,
  grains: colors.wheat,
  produce: colors.berry,
  nuts: colors.wheat,
  pantry: colors.greenMid,
  drinks: colors.waterBorder,
  legumes: colors.greenMid,
};

const toneBackground = (tone: IngredientTone) =>
  tone === 'limit' || tone === 'flagged' ? colors.redLight : colors.greenLight;
const toneText = (tone: IngredientTone) =>
  tone === 'limit' || tone === 'flagged' ? colors.red : colors.green;

/** Search, browse by kind, and a side-by-side comparison of two foods. */
export function ExploreScreen() {
  const navigation = useAppNavigation();
  const { foods } = useContent();
  const { t, n, lang, row } = useI18n();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  const localName = (food: FoodRecord) => (lang === 'ar' ? food.nameAr : food.nameEn);
  const localNote = (food: FoodRecord) =>
    lang === 'ar' ? food.noteAr ?? food.noteEn : food.noteEn;

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const food of foods) {
      if (food.category && !seen.includes(food.category)) seen.push(food.category);
    }
    return seen;
  }, [foods]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return foods.filter((food) => {
      if (category && food.category !== category) return false;
      if (!needle) return true;
      return (
        food.nameEn.toLowerCase().includes(needle) ||
        food.nameAr.includes(needle) ||
        (food.noteEn ?? '').toLowerCase().includes(needle)
      );
    });
  }, [category, foods, query]);

  const pair = picked
    .map((slug) => foods.find((food) => food.slug === slug))
    .filter((food): food is FoodRecord => !!food);
  const [a, b] = pair;
  const winner =
    pair.length === 2 ? ((a.score ?? 0) >= (b.score ?? 0) ? a : b) : null;

  const togglePick = (slug: string) => {
    setPicked((current) => {
      if (current.includes(slug)) return current.filter((s) => s !== slug);
      // A third pick replaces the older of the two.
      return current.length === 2 ? [current[1], slug] : [...current, slug];
    });
  };

  const foodRow = (food: FoodRecord) => {
    const selected = comparing && picked.includes(food.slug);
    const card = (
      <Card
        style={{
          flexDirection: row,
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: radius.tileSm,
          ...(selected ? { borderColor: colors.green, borderWidth: 1.5 } : null),
        }}
      >
        <View style={{ flex: 1 }}>
          <Text weight="semibold" size={14.5}>
            {localName(food)}
          </Text>
          {!!localNote(food) && (
            <Text size={12.5} color={colors.muted} style={{ marginTop: 1 }}>
              {localNote(food)}
            </Text>
          )}
        </View>
        <Pill
          label={
            food.score === null
              ? t(`tone.${food.tone}` as TranslationKey)
              : `${t(`tone.${food.tone}` as TranslationKey)} · ${n(food.score)}`
          }
          size={11}
          background={toneBackground(food.tone)}
          color={toneText(food.tone)}
          style={{ borderRadius: radius.thumbSm, paddingHorizontal: 9, paddingVertical: 3 }}
        />
      </Card>
    );
    return comparing ? (
      <Pressable key={food.slug} accessibilityRole="button" onPress={() => togglePick(food.slug)}>
        {card}
      </Pressable>
    ) : (
      <View key={food.slug}>{card}</View>
    );
  };

  const compareRows: { label: TranslationKey; value: (food: FoodRecord) => string }[] = [
    {
      label: 'compare.score',
      value: (food) =>
        food.score === null
          ? t(`tone.${food.tone}` as TranslationKey)
          : `${n(food.score)} — ${t(`tone.${food.tone}` as TranslationKey)}`,
    },
    {
      label: 'compare.calories',
      value: (food) => (food.caloriesPer100g === null ? '—' : n(food.caloriesPer100g)),
    },
    { label: 'compare.character', value: (food) => localNote(food) ?? '—' },
  ];

  return (
    <Screen tabs>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('Home')} />
        <Display size={26}>{t('explore.title')}</Display>
      </View>

      <Field
        shape="pill"
        placeholder={t('explore.searchPlaceholder')}
        value={query}
        onChangeText={setQuery}
      />

      {!comparing ? (
        <>
          <View>
            <SectionLabel style={{ marginBottom: 8 }}>{t('explore.browse')}</SectionLabel>
            <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 10 }}>
              {categories.map((slug) => {
                const active = category === slug;
                return (
                  <Pressable
                    key={slug}
                    accessibilityRole="button"
                    onPress={() => setCategory(active ? null : slug)}
                    style={{ flexGrow: 1, flexBasis: '46%' }}
                  >
                    <Card
                      style={{
                        flexDirection: row,
                        alignItems: 'center',
                        gap: 10,
                        padding: 14,
                        borderRadius: radius.tile,
                        ...(active ? { borderColor: colors.green, borderWidth: 1.5 } : null),
                      }}
                    >
                      <Dot color={CATEGORY_DOTS[slug] ?? colors.green} />
                      <Text weight="semibold" size={13.5} style={{ flex: 1 }}>
                        {t(`foodCat.${slug}` as TranslationKey)}
                      </Text>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <SectionLabel style={{ marginBottom: 8 }}>{t('explore.foods')}</SectionLabel>
            <View style={{ gap: 8 }}>
              {visible.map(foodRow)}
              {visible.length === 0 && (
                <Text size={13} color={colors.muted}>
                  {t('explore.noResults')}
                </Text>
              )}
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
            <Text weight="semibold" size={16} style={{ flexShrink: 1 }}>
              {pair.length === 2
                ? t('explore.vs', { a: localName(a), b: localName(b) })
                : t('explore.compareTitle')}
            </Text>
            <TextButton
              label={t('explore.backToSearch')}
              size={13.5}
              color={colors.muted}
              onPress={() => {
                setComparing(false);
                setPicked([]);
              }}
            />
          </View>

          {pair.length < 2 && (
            <Text size={13} color={colors.muted}>
              {t('explore.pickTwo')}
            </Text>
          )}

          <View style={{ gap: 8 }}>
            {visible.map(foodRow)}
            {visible.length === 0 && (
              <Text size={13} color={colors.muted}>
                {t('explore.noResults')}
              </Text>
            )}
          </View>

          {pair.length === 2 && (
            <>
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
                    {localName(a)}
                  </Text>
                  <Text weight="bold" size={12.5} color={colors.muted} style={{ flex: 1 }}>
                    {localName(b)}
                  </Text>
                </View>
                {compareRows.map((entry, index) => (
                  <View
                    key={entry.label}
                    style={{
                      flexDirection: row,
                      paddingVertical: 13,
                      paddingHorizontal: 16,
                      borderBottomWidth: index === compareRows.length - 1 ? 0 : 1,
                      borderBottomColor: colors.sunken,
                    }}
                  >
                    <Text weight="semibold" size={13} color={colors.faint} lineHeight={19} style={{ flex: 1 }}>
                      {t(entry.label)}
                    </Text>
                    <Text size={13} color={colors.inkSoft} lineHeight={19} style={{ flex: 1 }}>
                      {entry.value(a)}
                    </Text>
                    <Text size={13} color={colors.inkSoft} lineHeight={19} style={{ flex: 1 }}>
                      {entry.value(b)}
                    </Text>
                  </View>
                ))}
              </Card>

              {winner && (
                <TintCard style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.tile }}>
                  <Text size={13.5} color={colors.greenDeep} lineHeight={20}>
                    {t('explore.verdict', { winner: localName(winner) })}
                  </Text>
                </TintCard>
              )}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
