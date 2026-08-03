import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
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
import { RECIPE_DETAIL, recipeIngredients, toneColors } from '../data/content';
import type { TranslationKey } from '../i18n';
import { useAppState } from '../state/AppState';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';
import { RootStackParamList, useAppNavigation } from '../navigation/types';

/**
 * Recipe detail — hero, why it suits this person, a servings stepper that
 * scales the quantities, method, and substitutions for hard-to-find items.
 */
export function RecipeDetailScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'RecipeDetail'>>();
  const { state, set, dispatch, numbersOn } = useAppState();
  const { t, n, row, textAlign, chevronBack } = useI18n();

  const ingredients = recipeIngredients(state.servings);

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

        <View style={{ padding: 20, gap: 16 }}>
          <View>
            <View style={{ flexDirection: row, gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <Pill
                label={t('recipe.scoreTag', {
                  score: RECIPE_DETAIL.score,
                  classification: t(`classification.${RECIPE_DETAIL.classification}` as TranslationKey),
                })}
                size={12}
                style={{ paddingHorizontal: 11 }}
              />
              <Pill
                label={t('common.minutes', { count: RECIPE_DETAIL.minutes })}
                background={colors.sunken}
                color={colors.muted}
                weight="semibold"
                size={12}
                style={{ paddingHorizontal: 11 }}
              />
              {numbersOn ? (
                <Pill
                  label={t('recipe.calTotal', { calories: RECIPE_DETAIL.caloriesPerServing * state.servings })}
                  background={colors.sunken}
                  color={colors.muted}
                  weight="semibold"
                  size={12}
                  style={{ paddingHorizontal: 11 }}
                />
              ) : null}
            </View>
            <Display size={26}>{t(route.params.name)}</Display>
            <Text size={14.5} color={colors.muted} lineHeight={22} style={{ marginTop: 6 }}>
              {t('recipe.blurb')}
            </Text>
          </View>

          <Card style={{ padding: 16 }}>
            <Text weight="semibold" size={14.5} style={{ marginBottom: 4 }}>
              {t('recipe.why.title')}
            </Text>
            <Text size={13.5} color={colors.muted} lineHeight={21}>
              {t('recipe.why.body')}
            </Text>
          </Card>

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

          <View>
            <Text weight="semibold" size={15} style={{ marginBottom: 10 }}>
              {t('recipe.ingredients')}
            </Text>
            <View style={{ gap: 8 }}>
              {ingredients.map((item) => (
                <Card
                  key={item.name}
                  style={{
                    flexDirection: row,
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: radius.thumb,
                  }}
                >
                  <Dot color={toneColors[item.tone].dot} />
                  <Text weight="medium" size={14.5} style={{ flex: 1 }}>
                    {t(item.name)}
                  </Text>
                  <Text size={12.5} color={colors.faint}>
                    {item.unit ? t(item.unit, { value: n(item.value) }) : n(item.value)}
                  </Text>
                  <Text
                    weight="semibold"
                    size={12}
                    color={toneColors[item.tone].text}
                    align={textAlign === 'right' ? 'left' : 'right'}
                    style={{ width: 82 }}
                  >
                    {t(item.tag)}
                  </Text>
                </Card>
              ))}
            </View>
          </View>

          <View>
            <Text weight="semibold" size={15} style={{ marginBottom: 10 }}>
              {t('recipe.method')}
            </Text>
            <View style={{ gap: 10 }}>
              {RECIPE_DETAIL.steps.map((step, i) => (
                <View key={step} style={{ flexDirection: row, gap: 12, alignItems: 'flex-start' }}>
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
                    {t(step)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <TintCard style={{ padding: 16 }}>
            <Text weight="semibold" size={14.5} color={colors.greenDeep} style={{ marginBottom: 8 }}>
              {t('recipe.substitutions')}
            </Text>
            {RECIPE_DETAIL.substitutions.map((sub) => (
              <Text key={sub.from} size={13.5} color={colors.greenDeep} lineHeight={22}>
                <Strong>{t(sub.from)}</Strong> → {t(sub.to)}
              </Text>
            ))}
          </TintCard>

          <View style={{ flexDirection: row, gap: 10 }}>
            <OutlineButton
              label={state.savedRecipe ? t('recipe.saved') : t('recipe.save')}
              size={15}
              color={state.savedRecipe ? colors.green : colors.muted}
              background={state.savedRecipe ? colors.greenLight : colors.surface}
              borderColor={state.savedRecipe ? colors.green : colors.border}
              style={{ flex: 1, paddingVertical: 15 }}
              onPress={() => set({ savedRecipe: !state.savedRecipe })}
            />
            <PrimaryButton
              label={t('recipe.addToPlan')}
              size={15}
              style={{ flex: 1.4, paddingVertical: 15 }}
              onPress={() => navigation.navigate('Plan')}
            />
          </View>
        </View>
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
