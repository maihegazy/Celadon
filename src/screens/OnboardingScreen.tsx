import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  BulletRow,
  Card,
  Chip,
  Display,
  Hatch,
  LeafBadge,
  NoteCard,
  OptionCard,
  OutlineButton,
  PrimaryButton,
  RadioDot,
  SectionLabel,
  StepBars,
  Text,
  TextButton,
  Strong,
} from '../components';
import {
  ACTIVITY_LEVELS,
  AVOIDS,
  COMFORT_MODES,
  CONCERNS,
  CONDITIONS,
  COUNTRIES,
  CUISINES,
  GOALS,
  MEALS_PER_DAY,
  NEXT_LABELS,
  ONBOARDING_STEPS,
  STEP_TITLES,
  WEIGHT_GOALS,
} from '../data/assessment';
import { TODAY_MEALS } from '../data/content';
import { useAppState, ComfortMode } from '../state/AppState';
import { colors, radius, tracking } from '../theme';
import { RootStackParamList, useAppNavigation } from '../navigation/types';

/**
 * Nine-step health assessment. Every step is optional in spirit — the copy
 * never implies a diagnosis and nothing is framed as forbidden.
 *
 * Profile deep-links back into a single step (`step` + `returnTo`), which is
 * how "Restrictions & avoids" is edited after onboarding.
 */
export function OnboardingScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Onboarding'>>();
  const { state, set, dispatch } = useAppState();
  const [step, setStep] = useState(route.params?.step ?? 0);
  const returnTo = route.params?.returnTo;

  const next = () => {
    if (step < ONBOARDING_STEPS - 1) {
      setStep(step + 1);
      return;
    }
    if (returnTo) navigation.navigate(returnTo as never);
    else navigation.navigate('Permissions');
  };

  const back = () => {
    if (step === 0) return;
    // Re-entered from Profile for one step: back means "leave it as it was".
    if (returnTo && step === (route.params?.step ?? 0)) navigation.goBack();
    else setStep(step - 1);
  };

  const heading = STEP_TITLES[step];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 18 }}>
        <StepBars total={ONBOARDING_STEPS} current={step} />
      </View>

      {step === 0 ? (
        <IntroStep onBegin={next} onSignIn={() => navigation.navigate('Auth', { mode: 'signin' })} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 28, gap: 8 }}
        >
          <Display size={26}>{heading.title}</Display>
          {heading.subtitle ? (
            <Text size={14.5} color={colors.muted} lineHeight={22} style={{ marginBottom: 12 }}>
              {heading.subtitle}
            </Text>
          ) : null}

          {step === 1 ? (
            <View style={{ gap: 10 }}>
              {GOALS.map((goal, i) => (
                <RadioRow
                  key={goal}
                  label={goal}
                  selected={state.goal === i}
                  onPress={() => set({ goal: i })}
                />
              ))}
            </View>
          ) : null}

          {step === 2 ? (
            <View style={{ gap: 10 }}>
              {CONDITIONS.map((condition, i) => (
                <RadioRow
                  key={condition}
                  label={condition}
                  selected={!!state.conditions[i]}
                  onPress={() => dispatch({ type: 'toggleIn', key: 'conditions', index: i })}
                />
              ))}
            </View>
          ) : null}

          {step === 3 ? (
            <ChipWrap>
              {CONCERNS.map((concern, i) => (
                <Chip
                  key={concern}
                  label={concern}
                  selected={!!state.concerns[i]}
                  onPress={() => dispatch({ type: 'toggleIn', key: 'concerns', index: i })}
                />
              ))}
            </ChipWrap>
          ) : null}

          {step === 4 ? (
            <>
              <ChipWrap>
                {AVOIDS.map((avoid, i) => (
                  <Chip
                    key={avoid}
                    label={avoid}
                    selected={!!state.avoids[i]}
                    onPress={() => dispatch({ type: 'toggleIn', key: 'avoids', index: i })}
                  />
                ))}
              </ChipWrap>
              <Text size={13} color={colors.faint} lineHeight={20} style={{ marginTop: 8 }}>
                Not sure? Skip this — the reintroduction tracker helps you find your triggers over time.
              </Text>
            </>
          ) : null}

          {step === 5 ? (
            <>
              <ChipWrap>
                {CUISINES.map((cuisine, i) => (
                  <Chip
                    key={cuisine}
                    label={cuisine}
                    selected={!!state.cuisines[i]}
                    onPress={() => dispatch({ type: 'toggleIn', key: 'cuisines', index: i })}
                  />
                ))}
              </ChipWrap>
              <SubLabel>Where are you based?</SubLabel>
              <ChipWrap>
                {COUNTRIES.map((country, i) => (
                  <Chip
                    key={country}
                    label={country}
                    selected={state.country === i}
                    onPress={() => set({ country: i })}
                  />
                ))}
              </ChipWrap>
            </>
          ) : null}

          {step === 6 ? (
            <>
              <View style={{ gap: 10 }}>
                {ACTIVITY_LEVELS.map((level, i) => (
                  <OptionCard
                    key={level.name}
                    selected={state.activity === i}
                    onPress={() => set({ activity: i })}
                    padding={0}
                    style={{ paddingVertical: 14, paddingHorizontal: 16 }}
                  >
                    <Text weight="semibold" size={15}>
                      {level.name}
                    </Text>
                    <Text size={13} color={colors.muted} style={{ marginTop: 2 }}>
                      {level.desc}
                    </Text>
                  </OptionCard>
                ))}
              </View>
              <SubLabel>Meals a day</SubLabel>
              <ChipWrap>
                {MEALS_PER_DAY.map((meals, i) => (
                  <Chip
                    key={meals}
                    label={meals}
                    selected={state.mealsPerDay === i}
                    onPress={() => set({ mealsPerDay: i })}
                  />
                ))}
              </ChipWrap>
              <SubLabel>Weight goal</SubLabel>
              <ChipWrap>
                {WEIGHT_GOALS.map((goal, i) => (
                  <Chip
                    key={goal}
                    label={goal}
                    selected={state.weightGoal === i}
                    onPress={() => set({ weightGoal: i })}
                  />
                ))}
              </ChipWrap>
              <Text size={13} color={colors.faint} lineHeight={20} style={{ marginTop: 8 }}>
                Optional — Celadon never pushes numbers on you.
              </Text>
            </>
          ) : null}

          {step === 7 ? (
            <>
              <View style={{ gap: 10 }}>
                {COMFORT_MODES.map((mode, i) => (
                  <OptionCard
                    key={mode.name}
                    selected={state.comfort === i}
                    onPress={() => set({ comfort: i as ComfortMode, numbersOverride: null })}
                  >
                    <Text weight="semibold" size={15.5}>
                      {mode.name}
                    </Text>
                    <Text size={13.5} color={colors.muted} lineHeight={20} style={{ marginTop: 3 }}>
                      {mode.desc}
                    </Text>
                  </OptionCard>
                ))}
              </View>
              <NoteCard style={{ padding: 14, marginTop: 8 }}>
                <Text size={13} color={colors.muted} lineHeight={20}>
                  You can switch modes anytime in settings — quietly, no questions asked.
                </Text>
              </NoteCard>
            </>
          ) : null}

          {step === 8 ? <PlanPreview /> : null}
        </ScrollView>
      )}

      {step > 0 ? (
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 24 }}>
          <OutlineButton
            label="Back"
            onPress={back}
            color={colors.muted}
            style={{ paddingHorizontal: 22, paddingVertical: 15 }}
          />
          <PrimaryButton
            label={returnTo && step === (route.params?.step ?? 0) ? 'Save' : NEXT_LABELS[step]}
            onPress={next}
            size={15}
            style={{ flex: 1, paddingVertical: 15 }}
          />
        </View>
      ) : null}
    </View>
  );
}

function IntroStep({ onBegin, onSignIn }: { onBegin: () => void; onSignIn: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 16 }}>
      <LeafBadge />
      <Display size={34} lineHeight={39}>
        A calmer way to eat well.
      </Display>
      <Text size={16} color={colors.muted} lineHeight={25}>
        Celadon helps you start an anti‑inflammatory way of eating without the overwhelm — one gentle step at a
        time. No judgment, no pressure.
      </Text>
      <PrimaryButton label="Let's begin" onPress={onBegin} style={{ marginTop: 12 }} />
      <Text size={13} color={colors.faint} align="center">
        Takes about two minutes · You can change everything later
      </Text>
      <TextButton onPress={onSignIn} style={{ alignSelf: 'center', padding: 4 }}>
        <Text size={13.5} weight="medium" color={colors.muted}>
          Already have an account? <Strong color={colors.green}>Sign in</Strong>
        </Text>
      </TextButton>
    </View>
  );
}

/** Final step — what the plan will be built around, in plain language. */
function PlanPreview() {
  const { state } = useAppState();

  const chosen = (list: string[], map: Record<number, boolean>) => list.filter((_, i) => map[i]);
  const cuisines = chosen(CUISINES, state.cuisines);
  const avoids = chosen(AVOIDS, state.avoids);

  const summary = [
    {
      color: colors.green,
      text: `${cuisines.length ? cuisines.join(' & ') : 'A broad, familiar'} table — dishes you already know.`,
    },
    {
      color: colors.amber,
      text: avoids.length
        ? `Plans quietly avoid ${avoids.join(', ').toLowerCase()}.`
        : 'No avoid-list yet — the reintroduction tracker can help you find one.',
    },
    {
      color: colors.greenMid,
      text: `${MEALS_PER_DAY[state.mealsPerDay]} a day, sized for a ${ACTIVITY_LEVELS[
        state.activity
      ].name.toLowerCase()} rhythm.`,
    },
    {
      color: colors.faint,
      text:
        state.comfort === 0
          ? 'Numbers visible — calories and macros shown as estimates.'
          : state.comfort === 1
            ? 'Gentle mode — no numbers, just how food supports you.'
            : 'Minimal mode — meal ideas and a simple signal.',
    },
  ];

  return (
    <View style={{ gap: 14 }}>
      <Card style={{ padding: 16, gap: 11 }}>
        {summary.map((row) => (
          <BulletRow key={row.text} color={row.color}>
            {row.text}
          </BulletRow>
        ))}
      </Card>

      <View>
        <SectionLabel style={{ marginBottom: 8 }}>A taste of day one</SectionLabel>
        <View style={{ gap: 8 }}>
          {TODAY_MEALS.map((meal) => (
            <View
              key={meal.name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: radius.tileSm,
                paddingVertical: 11,
                paddingHorizontal: 14,
              }}
            >
              <Hatch band={6} radius={radius.thumbSm} style={{ width: 38, height: 38 }} />
              <View style={{ flex: 1 }}>
                <Text
                  weight="semibold"
                  size={11}
                  color={colors.faint}
                  style={{ letterSpacing: tracking(11, 0.07), textTransform: 'uppercase' }}
                >
                  {meal.slot}
                </Text>
                <Text weight="semibold" size={14}>
                  {meal.name}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Text size={13} color={colors.faint} lineHeight={20}>
        You can swap any meal, regenerate the week, or change these answers anytime.
      </Text>
    </View>
  );
}

function RadioRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <OptionCard
      selected={selected}
      onPress={onPress}
      padding={0}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 16 }}
    >
      <RadioDot selected={selected} />
      <Text weight="medium" size={15.5} style={{ flex: 1 }}>
        {label}
      </Text>
    </OptionCard>
  );
}

function ChipWrap({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{children}</View>;
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text weight="semibold" size={14} style={{ marginTop: 14, marginBottom: 2 }}>
      {children}
    </Text>
  );
}
