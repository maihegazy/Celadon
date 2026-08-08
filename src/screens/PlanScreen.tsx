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
  PrimaryButton,
  Pill,
  Screen,
  ScoreRing,
  SheetTitle,
  SmallButton,
  Strong,
  Text,
  TextButton,
  TintCard,
} from '../components';
import { DAY_SCORE, MEALS, SWAP_ALTERNATIVES, WEEK_DATES, WEEKDAYS, UNPLANNED_DAY } from '../data/content';
import { useAppState } from '../state/AppState';
import { usePlanning } from '../state/PlanningSync';
import { useI18n } from '../i18n';
import { colors, radius, tracking } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Weekly plan with a day picker. Days are planned a few at a time so the week
 * can still bend around how you're feeling — the unplanned day is a designed
 * state, not a gap.
 */
export function PlanScreen() {
  const navigation = useAppNavigation();
  const { state, set, numbersOn } = useAppState();
  const { toggleMeal } = usePlanning();
  const [swapFor, setSwapFor] = useState<string | null>(null);
  const { t, n, row } = useI18n();

  const dayIsEmpty = state.planDay === UNPLANNED_DAY && !state.saturdayPlanned;

  const regenerate = () => {
    set({ planRegenerated: true });
    setTimeout(() => set({ planRegenerated: false }), 1800);
  };

  return (
    <Screen
      tabs
      overlay={
        <BottomSheet visible={!!swapFor} onDismiss={() => setSwapFor(null)}>
          <SheetTitle>{t('plan.swapSheet.title', { meal: swapFor ?? '' })}</SheetTitle>
          <Text size={13} color={colors.muted}>
            {t('plan.swapSheet.subtitle')}
          </Text>
          <View style={{ gap: 8 }}>
            {SWAP_ALTERNATIVES.map((alt) => (
              <Pressable
                key={alt.name}
                accessibilityRole="button"
                onPress={() => setSwapFor(null)}
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
                      {t(alt.name)}
                    </Text>
                    <Text size={12.5} color={colors.muted} style={{ marginTop: 1 }}>
                      {numbersOn
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
                {n(WEEK_DATES[i])}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {dayIsEmpty ? (
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
            onPress={() => set({ saturdayPlanned: true })}
          />
        </EmptyCard>
      ) : (
        <>
          <Card style={{ flexDirection: row, alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 }}>
            <ScoreRing value={DAY_SCORE} size={58} thickness={7}>
              <Text weight="bold" size={16} color={colors.greenDeep}>
                {n(DAY_SCORE)}
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
            <TextButton label={t('plan.addToCalendar')} size={12.5} color={colors.green} />
          </Card>

          <View style={{ gap: 10 }}>
            {MEALS.map((meal, i) => {
              const done = !!state.completedMeals[i];
              return (
                <Card key={meal.name} style={{ padding: 14 }}>
                  <View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
                    <CheckBox
                      checked={done}
                      size={24}
                      borderRadius={12}
                      onPress={() => toggleMeal(i)}
                    />
                    <Pressable
                      onPress={
                        meal.recipeSlug
                          ? () => navigation.navigate('RecipeDetail', { slug: meal.recipeSlug as string })
                          : undefined
                      }
                    >
                      <Hatch band={6} radius={radius.thumb} style={{ width: 52, height: 52 }} />
                    </Pressable>
                    <Pressable
                      style={{ flex: 1, minWidth: 0, opacity: done ? 0.55 : 1 }}
                      onPress={
                        meal.recipeSlug
                          ? () => navigation.navigate('RecipeDetail', { slug: meal.recipeSlug as string })
                          : undefined
                      }
                    >
                      <Text
                        weight="semibold"
                        size={11.5}
                        color={colors.faint}
                        style={{ letterSpacing: tracking(11.5, 0.07), textTransform: 'uppercase' }}
                      >
                        {t(meal.slot)}
                      </Text>
                      <Text
                        weight="semibold"
                        size={15}
                        style={{ marginTop: 1, textDecorationLine: done ? 'line-through' : 'none' }}
                      >
                        {t(meal.name)}
                      </Text>
                      <Text size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
                        {numbersOn
                          ? t('common.minutesAndCalories', { count: meal.minutes, calories: meal.calories })
                          : t('common.minutes', { count: meal.minutes })}
                      </Text>
                    </Pressable>
                    <SmallButton
                      label={t('plan.swap')}
                      size={12.5}
                      color={colors.muted}
                      background={colors.transparent}
                      style={{ borderRadius: 16, paddingVertical: 6, paddingHorizontal: 13 }}
                      onPress={() => setSwapFor(t(meal.name))}
                    />
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
        onPress={regenerate}
      />

      <TintCard style={{ padding: 16 }}>
        <Text size={13.5} color={colors.greenDeep} lineHeight={20}>
          <Strong>{t('plan.why.title')}</Strong> {t('plan.why.body')}
        </Text>
      </TintCard>
    </Screen>
  );
}
