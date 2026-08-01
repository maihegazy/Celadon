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
import {
  DAY_MACROS,
  DAY_MACROS_GENTLE,
  DAY_SCORE,
  MEALS,
  mealMeta,
  PLAN_RATIONALE,
  SWAP_ALTERNATIVES,
} from '../data/content';
import { useAppState } from '../state/AppState';
import { colors, radius, tracking } from '../theme';
import { useAppNavigation } from '../navigation/types';

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
/** The design's week runs 26 July – 1 August. */
const DATES = [26, 27, 28, 29, 30, 31, 1];
const UNPLANNED_DAY = 6;

/**
 * Weekly plan with a day picker. Days are planned a few at a time so the week
 * can still bend around how you're feeling — the unplanned day is a designed
 * state, not a gap.
 */
export function PlanScreen() {
  const navigation = useAppNavigation();
  const { state, set, dispatch, numbersOn } = useAppState();
  const [swapFor, setSwapFor] = useState<string | null>(null);

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
          <SheetTitle>Swap {swapFor}</SheetTitle>
          <Text size={13} color={colors.muted}>
            All alternatives fit your flags and today's balance.
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
                    flexDirection: 'row',
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
                      {alt.name}
                    </Text>
                    <Text size={12.5} color={colors.muted} style={{ marginTop: 1 }}>
                      {numbersOn ? `${alt.minutes} min · ${alt.calories} cal` : `${alt.minutes} min`}
                    </Text>
                  </View>
                  <Pill label={String(alt.score)} size={11} style={{ borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 }} />
                </Card>
              </Pressable>
            ))}
          </View>
          <TextButton
            label="Keep it as is"
            color={colors.muted}
            style={{ alignSelf: 'center', padding: 6 }}
            onPress={() => setSwapFor(null)}
          />
        </BottomSheet>
      }
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
        <Display size={26}>This week</Display>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SmallButton label="Recipes" onPress={() => navigation.navigate('Recipes')} />
          <SmallButton label="Grocery list" onPress={() => navigation.navigate('Grocery')} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {WEEK.map((day, i) => {
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
                {day}
              </Text>
              <Text weight="bold" size={15} color={active ? colors.white : colors.ink} style={{ marginTop: 2 }}>
                {DATES[i]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {dayIsEmpty ? (
        <EmptyCard style={{ paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', gap: 10, borderRadius: radius.cardLg }}>
          <Text weight="semibold" size={15}>
            Saturday isn't planned yet
          </Text>
          <Text size={13} color={colors.muted} lineHeight={20} align="center">
            We plan a few days at a time so the week can adapt to how you're feeling.
          </Text>
          <PrimaryButton
            label="Plan this day"
            size={14}
            style={{ paddingVertical: 12, paddingHorizontal: 24, borderRadius: 22, marginTop: 4 }}
            onPress={() => set({ saturdayPlanned: true })}
          />
        </EmptyCard>
      ) : (
        <>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 }}>
            <ScoreRing value={DAY_SCORE} size={58} thickness={7}>
              <Text weight="bold" size={16} color={colors.greenDeep}>
                {DAY_SCORE}
              </Text>
            </ScoreRing>
            <View style={{ flex: 1 }}>
              <Text weight="semibold" size={14}>
                Day score · Supportive
              </Text>
              <Text size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
                {numbersOn ? DAY_MACROS : DAY_MACROS_GENTLE}
              </Text>
            </View>
            <TextButton label="Add to calendar" size={12.5} color={colors.green} />
          </Card>

          <View style={{ gap: 10 }}>
            {MEALS.map((meal, i) => {
              const done = !!state.completedMeals[i];
              return (
                <Card key={meal.name} style={{ padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <CheckBox
                      checked={done}
                      size={24}
                      borderRadius={12}
                      onPress={() => dispatch({ type: 'toggleMealDone', index: i })}
                    />
                    <Pressable onPress={() => navigation.navigate('RecipeDetail', { name: meal.name })}>
                      <Hatch band={6} radius={radius.thumb} style={{ width: 52, height: 52 }} />
                    </Pressable>
                    <Pressable
                      style={{ flex: 1, minWidth: 0, opacity: done ? 0.55 : 1 }}
                      onPress={() => navigation.navigate('RecipeDetail', { name: meal.name })}
                    >
                      <Text
                        weight="semibold"
                        size={11.5}
                        color={colors.faint}
                        style={{ letterSpacing: tracking(11.5, 0.07), textTransform: 'uppercase' }}
                      >
                        {meal.slot}
                      </Text>
                      <Text
                        weight="semibold"
                        size={15}
                        style={{ marginTop: 1, textDecorationLine: done ? 'line-through' : 'none' }}
                      >
                        {meal.name}
                      </Text>
                      <Text size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
                        {mealMeta(meal, numbersOn)}
                      </Text>
                    </Pressable>
                    <SmallButton
                      label="Swap"
                      size={12.5}
                      color={colors.muted}
                      background={colors.transparent}
                      style={{ borderRadius: 16, paddingVertical: 6, paddingHorizontal: 13 }}
                      onPress={() => setSwapFor(meal.name)}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        </>
      )}

      <OutlineButton
        label={state.planRegenerated ? '✓ Fresh plan generated' : 'Regenerate this week'}
        size={14.5}
        background={colors.surface}
        onPress={regenerate}
      />

      <TintCard style={{ padding: 16 }}>
        <Text size={13.5} color={colors.greenDeep} lineHeight={20}>
          <Strong>Why this week works:</Strong> {PLAN_RATIONALE}
        </Text>
      </TintCard>
    </Screen>
  );
}
