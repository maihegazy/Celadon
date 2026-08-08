import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  BareScreen,
  Card,
  Display,
  Dot,
  Hatch,
  OutlineButton,
  Pill,
  PrimaryButton,
  Strong,
  Text,
  TintCard,
} from '../components';
import { toneColors, Tone } from '../data/content';
import { IngredientTone, RecipeDetail, useContent } from '../services/content';
import type { TranslationKey } from '../i18n';
import { useAppState } from '../state/AppState';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';
import { RootStackParamList, useAppNavigation } from '../navigation/types';

/** Catalogue tones map onto the design's four ingredient colours. */
const TONE_STYLE: Record<IngredientTone, Tone> = {
  supportive: 'good',
  balanced: 'mid',
  flagged: 'flag',
  limit: 'limit',
};

/** '86 · Supportive' — the classification key matches the enum, capitalised. */
const classificationKey = (value: string): TranslationKey =>
  `classification.${value.charAt(0).toUpperCase()}${value.slice(1)}` as TranslationKey;

/** 320 g for 2 servings scaled to 3 → 480; trims float noise. */
const scaled = (quantity: number, baseServings: number, servings: number): string => {
  const value = (quantity * servings) / baseServings;
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10);
};

/**
 * Recipe detail — hero, why it suits this person, a servings stepper that
 * scales the quantities, method, and substitutions for hard-to-find items.
 */
export function RecipeDetailScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'RecipeDetail'>>();
  const { state, dispatch, numbersOn } = useAppState();
  const { getRecipe, savedSlugs, toggleSaved } = useContent();
  const { t, n, lang, row, textAlign, chevronBack } = useI18n();

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  useEffect(() => {
    let active = true;
    getRecipe(route.params.slug).then((detail) => {
      if (active) setRecipe(detail);
    });
    return () => {
      active = false;
    };
  }, [getRecipe, route.params.slug]);

  const inLang = (english: string | null, arabic: string | null) =>
    (lang === 'ar' ? arabic ?? english : english) ?? '';

  const saved = savedSlugs.includes(route.params.slug);

  return (
    <BareScreen>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Hatch band={8} style={{ height: 210 }}>
          <Text mono size={12} color={colors.faint}>
            {t('recipe.photo')}
          </Text>
        </Hatch>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            {
              position: 'absolute',
              top: 16,
              left: 16,
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: 18,
              paddingVertical: 8,
              paddingHorizontal: 16,
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text weight="semibold" size={13.5}>
            {chevronBack} {t('common.back')}
          </Text>
        </Pressable>

        {recipe ? (
          <View style={{ padding: 20, gap: 16 }}>
            <View>
              <View style={{ flexDirection: row, gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <Pill
                  label={t('recipe.scoreTag', {
                    score: recipe.score,
                    classification: t(classificationKey(recipe.classification)),
                  })}
                  size={12}
                  style={{ paddingHorizontal: 11 }}
                />
                <Pill
                  label={t('common.minutes', { count: recipe.minutes })}
                  background={colors.sunken}
                  color={colors.muted}
                  weight="semibold"
                  size={12}
                  style={{ paddingHorizontal: 11 }}
                />
                {numbersOn && recipe.calories !== null ? (
                  <Pill
                    label={t('recipe.calTotal', { calories: recipe.calories * state.servings })}
                    background={colors.sunken}
                    color={colors.muted}
                    weight="semibold"
                    size={12}
                    style={{ paddingHorizontal: 11 }}
                  />
                ) : null}
              </View>
              <Display size={26}>{inLang(recipe.nameEn, recipe.nameAr)}</Display>
              <Text size={14.5} color={colors.muted} lineHeight={22} style={{ marginTop: 6 }}>
                {inLang(recipe.blurbEn, recipe.blurbAr)}
              </Text>
            </View>

            {recipe.whyEn ? (
              <Card style={{ padding: 16 }}>
                <Text weight="semibold" size={14.5} style={{ marginBottom: 4 }}>
                  {t('recipe.why.title')}
                </Text>
                <Text size={13.5} color={colors.muted} lineHeight={21}>
                  {inLang(recipe.whyEn, recipe.whyAr)}
                </Text>
              </Card>
            ) : null}

            <Card
              style={{
                flexDirection: row,
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
            >
              <Text weight="semibold" size={14.5}>
                {t('recipe.servings')}
              </Text>
              <View style={{ flexDirection: row, alignItems: 'center', gap: 14 }}>
                <Stepper label="−" onPress={() => dispatch({ type: 'adjustServings', delta: -1 })} />
                <Text weight="bold" size={16} align="center" style={{ width: 16 }}>
                  {n(state.servings)}
                </Text>
                <Stepper label="+" onPress={() => dispatch({ type: 'adjustServings', delta: 1 })} />
              </View>
            </Card>

            {recipe.ingredients.length > 0 ? (
              <View>
                <Text weight="semibold" size={15} style={{ marginBottom: 10 }}>
                  {t('recipe.ingredients')}
                </Text>
                <View style={{ gap: 8 }}>
                  {recipe.ingredients.map((item) => {
                    const tone = TONE_STYLE[item.tone];
                    const unit = lang === 'ar' ? item.unitAr ?? item.unitEn : item.unitEn;
                    const amount =
                      item.quantity === null
                        ? null
                        : `${n(scaled(item.quantity, recipe.baseServings, state.servings))}${unit ? ` ${unit}` : ''}`;
                    return (
                      <Card
                        key={item.position}
                        style={{
                          flexDirection: row,
                          alignItems: 'center',
                          gap: 12,
                          paddingVertical: 12,
                          paddingHorizontal: 14,
                          borderRadius: radius.thumb,
                        }}
                      >
                        <Dot color={toneColors[tone].dot} />
                        <Text weight="medium" size={14.5} style={{ flex: 1 }}>
                          {inLang(item.nameEn, item.nameAr)}
                        </Text>
                        {amount ? (
                          <Text size={12.5} color={colors.faint}>
                            {amount}
                          </Text>
                        ) : null}
                        <Text
                          weight="semibold"
                          size={12}
                          color={toneColors[tone].text}
                          align={textAlign === 'right' ? 'left' : 'right'}
                          style={{ width: 82 }}
                        >
                          {t(`tone.${item.tone}` as TranslationKey)}
                        </Text>
                      </Card>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {recipe.steps.length > 0 ? (
              <View>
                <Text weight="semibold" size={15} style={{ marginBottom: 10 }}>
                  {t('recipe.method')}
                </Text>
                <View style={{ gap: 10 }}>
                  {recipe.steps.map((step, i) => (
                    <View key={step.position} style={{ flexDirection: row, gap: 12, alignItems: 'flex-start' }}>
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.greenLight,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text weight="bold" size={12.5} color={colors.green}>
                          {n(i + 1)}
                        </Text>
                      </View>
                      <Text size={14} color={colors.inkSoft} lineHeight={22} style={{ flex: 1, paddingTop: 2 }}>
                        {inLang(step.textEn, step.textAr)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {recipe.substitutions.length > 0 ? (
              <TintCard style={{ padding: 16 }}>
                <Text weight="semibold" size={14.5} color={colors.greenDeep} style={{ marginBottom: 8 }}>
                  {t('recipe.substitutions')}
                </Text>
                {recipe.substitutions.map((sub) => (
                  <Text key={sub.fromEn} size={13.5} color={colors.greenDeep} lineHeight={22}>
                    <Strong>{inLang(sub.fromEn, sub.fromAr)}</Strong> → {inLang(sub.toEn, sub.toAr)}
                  </Text>
                ))}
              </TintCard>
            ) : null}

            <View style={{ flexDirection: row, gap: 10 }}>
              <OutlineButton
                label={saved ? t('recipe.saved') : t('recipe.save')}
                size={15}
                color={saved ? colors.green : colors.muted}
                background={saved ? colors.greenLight : colors.surface}
                borderColor={saved ? colors.green : colors.border}
                style={{ flex: 1, paddingVertical: 15 }}
                onPress={() => toggleSaved(route.params.slug)}
              />
              <PrimaryButton
                label={t('recipe.addToPlan')}
                size={15}
                style={{ flex: 1.4, paddingVertical: 15 }}
                onPress={() => navigation.navigate('Plan')}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </BareScreen>
  );
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === '+' ? 'More servings' : 'Fewer servings'}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 32,
          height: 32,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text weight="semibold" size={17} color={colors.green}>
        {label}
      </Text>
    </Pressable>
  );
}
