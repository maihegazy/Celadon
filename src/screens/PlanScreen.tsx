import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  BottomSheet,
  Card,
  CheckBox,
  Display,
  EmptyCard,
  Hatch,
  OutlineButton,
  Pill,
  PrimaryButton,
  Screen,
  ScoreRing,
  SheetTitle,
  SmallButton,
  Strong,
  Text,
  TextButton,
  TintCard,
} from '../components';
import { WEEKDAYS } from '../data/content';
import { RecipeSummary, useContent } from '../services/content';
import { PlannedMealRecord } from '../services/planning/types';
import { weekStartISO } from '../services/planning';
import { useAppState } from '../state/AppState';
import { usePlanning } from '../state/PlanningSync';
import type { TranslationKey } from '../i18n';
import { useI18n } from '../i18n';
import { colors, radius, tracking } from '../theme';
import { useAppNavigation } from '../navigation/types';

const addDays = (iso: string, days: number): Date => {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date;
};

/**
 * Weekly plan with a day picker — a real week now, generated from the recipe
 * catalogue around this person's answers, with real dates and real swaps.
 */
export function PlanScreen() {
  const navigation = useAppNavigation();
  const { state, set, numbersOn } = useAppState();
  const { toggleMeal, swapMeal, regenerate } = usePlanning();
  const { recipes } = useContent();
  const [swapFor, setSwapFor] = useState<PlannedMealRecord | null>(null);
  const { t, n, row, lang } = useI18n();

  const weekStart = state.planWeekStart ?? weekStartISO();
  const selectedISO = addDays(weekStart, state.planDay).toISOString().slice(0, 10);
  const dayMeals = state.planMeals
    .filter((meal) => meal.scheduledOn === selectedISO)
    .sort((a, b) => a.position - b.position);

  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const mealName = (meal: PlannedMealRecord) => (lang === 'ar' && meal.nameAr ? meal.nameAr : meal.nameEn);

  // The day's score is the average of its dishes' catalogue scores — absent
  // until the lookup has something to stand on.
  const linkedScores = dayMeals
    .map((meal) => (meal.recipeId ? recipeById.get(meal.recipeId)?.score : undefined))
    .filter((score): score is number => score !== undefined);
  const dayScore = linkedScores.length
    ? Math.round(linkedScores.reduce((sum, score) => sum + score, 0) / linkedScores.length)
    : null;

  // Swap alternatives: the best-scored other dishes in the catalogue.
  const alternatives: RecipeSummary[] = swapFor
    ? recipes
        .filter((recipe) => recipe.id !== swapFor.recipeId)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
    : [];

  const doRegenerate = () => {
    regenerate();
    set({ planRegenerated: true });
    setTimeout(() => set({ planRegenerated: false }), 1800);
  };

  return (
    <Screen
      tabs
      overlay={
        <BottomSheet visible={!!swapFor} onDismiss={() => setSwapFor(null)}>
          <SheetTitle>{t('plan.swapSheet.title', { meal: swapFor ? mealName(swapFor) : '' })}</SheetTitle>
          <Text size={13} color={colors.muted}>
            {t('plan.swapSheet.subtitle')}
          </Text>
          <View style={{ gap: 8 }}>
            {alternatives.map((alt) => (
              <Pressable
                key={alt.slug}
                accessibilityRole="button"
                onPress={() => {
                  if (swapFor) swapMeal(swapFor.id, alt);
                  setSwapFor(null);
                }}
                style={({ pressed }) => [pressed && { opacity: 0.85 }]}
              >
                <Card
                  style={{
                    flexDirection: row,
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: radius.tile,
                  }}
                >
                  <Hatch band={6} radius={radius.thumbSm} style={{ width: 42, height: 42 }} />
                  <View style={{ flex: 1 }}>
                    <Text weight="semibold" size={14.5}>
                      {lang === 'ar' ? alt.nameAr : alt.nameEn}
                    </Text>
                    <Text size={12.5} color={colors.muted} style={{ marginTop: 1 }}>
                      {numbersOn && alt.calories !== null
                        ? t('common.minutesAndCalories', { count: alt.minutes, calories: alt.calories })
                        : t('common.minutes', { count: alt.minutes })}
                    </Text>
                  </View>
                  <Pill label={n(alt.score)} size={11} style={{ borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 }} />
                </Card>
              </Pressable>
            ))}
          </View>
          <TextButton
            label={t('plan.swapSheet.keep')}
            color={colors.muted}
            style={{ alignSelf: 'center', padding: 6 }}
            onPress={() => setSwapFor(null)}
          />
        </BottomSheet>
      }
    >
      <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
        <Display size={26}>{t('plan.title')}</Display>
        <View style={{ flexDirection: row, gap: 8 }}>
          <SmallButton label={t('plan.recipes')} onPress={() => navigation.navigate('Recipes')} />
          <SmallButton label={t('plan.grocery')} onPress={() => navigation.navigate('Grocery')} />
        </View>
      </View>

      <View style={{ flexDirection: row, gap: 8 }}>
        {WEEKDAYS.map((day, i) => {
          const active = state.planDay === i;
          return (
            <Pressable
              key={`${day}-${i}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => set({ planDay: i })}
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: radius.tileSm,
                  borderWidth: 1.5,
                  alignItems: 'center',
                  backgroundColor: active ? colors.greenDeep : colors.surface,
                  borderColor: active ? colors.greenDeep : colors.line,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text weight="semibold" size={11} color={active ? colors.greenPale : colors.faint}>
                {t(day)}
              </Text>
              <Text weight="bold" size={15} color={active ? colors.white : colors.ink} style={{ marginTop: 2 }}>
                {n(addDays(weekStart, i).getDate())}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {dayMeals.length === 0 ? (
        <EmptyCard style={{ paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', gap: 10, borderRadius: radius.cardLg }}>
          <Text weight="semibold" size={15}>
            {t('plan.empty.title')}
          </Text>
          <Text size={13} color={colors.muted} lineHeight={20} align="center">
            {t('plan.empty.body')}
          </Text>
          <PrimaryButton
            label={t('plan.empty.cta')}
            size={14}
            style={{ paddingVertical: 12, paddingHorizontal: 24, borderRadius: 22, marginTop: 4 }}
            onPress={doRegenerate}
          />
        </EmptyCard>
      ) : (
        <>
          {dayScore !== null ? (
            <Card style={{ flexDirection: row, alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 }}>
              <ScoreRing value={dayScore} size={58} thickness={7}>
                <Text weight="bold" size={16} color={colors.greenDeep}>
                  {n(dayScore)}
                </Text>
              </ScoreRing>
              <View style={{ flex: 1 }}>
                <Text weight="semibold" size={14}>
                  {t('plan.dayScore')}
                </Text>
                <Text size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
                  {numbersOn ? t('plan.macros') : t('plan.macrosGentle')}
                </Text>
              </View>
            </Card>
          ) : null}

          <View style={{ gap: 10 }}>
            {dayMeals.map((meal) => {
              const recipe = meal.recipeId ? recipeById.get(meal.recipeId) : undefined;
              return (
                <Card key={meal.id} style={{ padding: 14 }}>
                  <View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
                    <CheckBox
                      checked={meal.completed}
                      size={24}
                      borderRadius={12}
                      onPress={() => toggleMeal(meal.id)}
                    />
                    <Pressable
                      onPress={
                        recipe ? () => navigation.navigate('RecipeDetail', { slug: recipe.slug }) : undefined
                      }
                    >
                      <Hatch band={6} radius={radius.thumb} style={{ width: 52, height: 52 }} />
                    </Pressable>
                    <Pressable
                      style={{ flex: 1, minWidth: 0, opacity: meal.completed ? 0.55 : 1 }}
                      onPress={
                        recipe ? () => navigation.navigate('RecipeDetail', { slug: recipe.slug }) : undefined
                      }
                    >
                      <Text
                        weight="semibold"
                        size={11.5}
                        color={colors.faint}
                        style={{ letterSpacing: tracking(11.5, 0.07), textTransform: 'uppercase' }}
                      >
                        {t(`slot.${meal.slot}` as TranslationKey)}
                      </Text>
                      <Text
                        weight="semibold"
                        size={15}
                        style={{ marginTop: 1, textDecorationLine: meal.completed ? 'line-through' : 'none' }}
                      >
                        {mealName(meal)}
                      </Text>
                      {recipe ? (
                        <Text size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
                          {numbersOn && recipe.calories !== null
                            ? t('common.minutesAndCalories', { count: recipe.minutes, calories: recipe.calories })
                            : t('common.minutes', { count: recipe.minutes })}
                        </Text>
                      ) : null}
                    </Pressable>
                    {meal.slot !== 'snack' ? (
                      <SmallButton
                        label={t('plan.swap')}
                        size={12.5}
                        color={colors.muted}
                        background={colors.transparent}
                        style={{ borderRadius: 16, paddingVertical: 6, paddingHorizontal: 13 }}
                        onPress={() => setSwapFor(meal)}
                      />
                    ) : null}
                  </View>
                </Card>
              );
            })}
          </View>
        </>
      )}

      <OutlineButton
        label={state.planRegenerated ? t('plan.regenerated') : t('plan.regenerate')}
        size={14.5}
        background={colors.surface}
        onPress={doRegenerate}
      />

      <TintCard style={{ padding: 16 }}>
        <Text size={13.5} color={colors.greenDeep} lineHeight={20}>
          <Strong>{t('plan.why.title')}</Strong> {t('plan.why.body')}
        </Text>
      </TintCard>
    </Screen>
  );
}
