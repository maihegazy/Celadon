import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { FlexStyle, ScrollView, View } from 'react-native';
import {
  BulletRow,
  Card,
  Chip,
  Display,
  Field,
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
  ONBOARDING_STEPS,
  SEXES,
  STEP_TITLES,
  WEIGHT_GOALS,
} from '../data/assessment';
import { TODAY_MEALS } from '../data/content';
import { useI18n } from '../i18n';
import type { TranslationKey } from '../i18n';
import { useAuth } from '../services/auth';
import { useAppState, ComfortMode } from '../state/AppState';
import { useProfileSync } from '../state/useProfileSync';
import { colors, radius, tracking } from '../theme';
import { RootStackParamList, useAppNavigation } from '../navigation/types';

/**
 * Ten-step health assessment. Every step is optional in spirit — the copy
 * never implies a diagnosis, nothing is framed as forbidden, and the personal
 * step ("About you") is explicitly skippable in full.
 *
 * Profile deep-links back into a single step (`step` + `returnTo`), which is
 * how "Restrictions & avoids" is edited after onboarding.
 */
export function OnboardingScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Onboarding'>>();
  const { state, set, dispatch } = useAppState();
  const { t, row } = useI18n();
  const { status } = useAuth();
  const { saveProfile } = useProfileSync();
  const [step, setStep] = useState(route.params?.step ?? 0);
  const returnTo = route.params?.returnTo;

  const next = async () => {
    if (step < ONBOARDING_STEPS - 1) {
      setStep(step + 1);
      return;
    }

    set({ onboardingComplete: true });

    // Re-entered from Profile to edit one answer — go back where we came from.
    if (returnTo) {
      await saveProfile();
      navigation.navigate(returnTo as never);
      return;
    }

    // The assessment is deliberately answerable before signing up: the value
    // is shown first, and the account is what makes it portable.
    if (status !== 'signedIn') {
      navigation.navigate('Auth', { mode: 'signup' });
      return;
    }

    await saveProfile();
    navigation.navigate('Permissions');
  };

  const back = () => {
    if (step === 0) return;
    // Re-entered from Profile for one step: back means "leave it as it was".
    if (returnTo && step === (route.params?.step ?? 0)) navigation.goBack();
    else setStep(step - 1);
  };

  const heading = STEP_TITLES[step];
  const editingOneStep = !!returnTo && step === (route.params?.step ?? 0);

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
          <Display size={26}>{t(heading.title)}</Display>
          {heading.subtitle ? (
            <Text size={14.5} color={colors.muted} lineHeight={22} style={{ marginBottom: 12 }}>
              {t(heading.subtitle)}
            </Text>
          ) : null}

          {step === 1 ? <AboutStep /> : null}

          {step === 2 ? (
            <View style={{ gap: 10 }}>
              {GOALS.map((goal, i) => (
                <RadioRow key={goal} label={t(goal)} selected={state.goal === i} onPress={() => set({ goal: i })} />
              ))}
            </View>
          ) : null}

          {step === 3 ? (
            <View style={{ gap: 10 }}>
              {CONDITIONS.map((condition, i) => (
                <RadioRow
                  key={condition}
                  label={t(condition)}
                  selected={!!state.conditions[i]}
                  onPress={() => dispatch({ type: 'toggleIn', key: 'conditions', index: i })}
                />
              ))}
            </View>
          ) : null}

          {step === 4 ? (
            <ChipWrap direction={row}>
              {CONCERNS.map((concern, i) => (
                <Chip
                  key={concern}
                  label={t(concern)}
                  selected={!!state.concerns[i]}
                  onPress={() => dispatch({ type: 'toggleIn', key: 'concerns', index: i })}
                />
              ))}
            </ChipWrap>
          ) : null}

          {step === 5 ? (
            <>
              <ChipWrap direction={row}>
                {AVOIDS.map((avoid, i) => (
                  <Chip
                    key={avoid}
                    label={t(avoid)}
                    selected={!!state.avoids[i]}
                    onPress={() => dispatch({ type: 'toggleIn', key: 'avoids', index: i })}
                  />
                ))}
              </ChipWrap>
              <Text size={13} color={colors.faint} lineHeight={20} style={{ marginTop: 8 }}>
                {t('onboarding.avoid.note')}
              </Text>
            </>
          ) : null}

          {step === 6 ? (
            <>
              <ChipWrap direction={row}>
                {CUISINES.map((cuisine, i) => (
                  <Chip
                    key={cuisine}
                    label={t(cuisine)}
                    selected={!!state.cuisines[i]}
                    onPress={() => dispatch({ type: 'toggleIn', key: 'cuisines', index: i })}
                  />
                ))}
              </ChipWrap>
              <SubLabel>{t('onboarding.cuisine.country')}</SubLabel>
              <ChipWrap direction={row}>
                {COUNTRIES.map((country, i) => (
                  <Chip
                    key={country}
                    label={t(country)}
                    selected={state.country === i}
                    onPress={() => set({ country: i })}
                  />
                ))}
              </ChipWrap>
            </>
          ) : null}

          {step === 7 ? (
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
                      {t(level.name)}
                    </Text>
                    <Text size={13} color={colors.muted} style={{ marginTop: 2 }}>
                      {t(level.desc)}
                    </Text>
                  </OptionCard>
                ))}
              </View>
              <SubLabel>{t('onboarding.days.meals')}</SubLabel>
              <ChipWrap direction={row}>
                {MEALS_PER_DAY.map((meals, i) => (
                  <Chip
                    key={meals}
                    label={t(meals)}
                    selected={state.mealsPerDay === i}
                    onPress={() => set({ mealsPerDay: i })}
                  />
                ))}
              </ChipWrap>
              <SubLabel>{t('onboarding.days.weight')}</SubLabel>
              <ChipWrap direction={row}>
                {WEIGHT_GOALS.map((goal, i) => (
                  <Chip
                    key={goal}
                    label={t(goal)}
                    selected={state.weightGoal === i}
                    onPress={() => set({ weightGoal: i })}
                  />
                ))}
              </ChipWrap>
              <Text size={13} color={colors.faint} lineHeight={20} style={{ marginTop: 8 }}>
                {t('onboarding.days.note')}
              </Text>
            </>
          ) : null}

          {step === 8 ? (
            <>
              <View style={{ gap: 10 }}>
                {COMFORT_MODES.map((mode, i) => (
                  <OptionCard
                    key={mode.name}
                    selected={state.comfort === i}
                    onPress={() => set({ comfort: i as ComfortMode, numbersOverride: null })}
                  >
                    <Text weight="semibold" size={15.5}>
                      {t(mode.name)}
                    </Text>
                    <Text size={13.5} color={colors.muted} lineHeight={20} style={{ marginTop: 3 }}>
                      {t(mode.desc)}
                    </Text>
                  </OptionCard>
                ))}
              </View>
              <NoteCard style={{ padding: 14, marginTop: 8 }}>
                <Text size={13} color={colors.muted} lineHeight={20}>
                  {t('onboarding.comfort.note')}
                </Text>
              </NoteCard>
            </>
          ) : null}

          {step === 8 ? <PlanPreview /> : null}
        </ScrollView>
      )}

      {step > 0 ? (
        <View style={{ flexDirection: row, gap: 10, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 24 }}>
          <OutlineButton
            label={t('common.back')}
            onPress={back}
            color={colors.muted}
            style={{ paddingHorizontal: 22, paddingVertical: 15 }}
          />
          <PrimaryButton
            label={
              editingOneStep
                ? t('onboarding.save')
                : step === ONBOARDING_STEPS - 1
                  ? t('onboarding.finish')
                  : t('common.continue')
            }
            onPress={next}
            size={15}
            style={{ flex: 1, paddingVertical: 15 }}
          />
        </View>
      ) : null}
    </View>
  );
}

/** Arabic keyboards produce Arabic-Indic digits; parse both. */
const asciiDigits = (text: string) =>
  text.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const parseNumber = (text: string): number | null => {
  const value = Number(asciiDigits(text).replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : null;
};

/**
 * "About you" — the only step that asks about the person rather than the food.
 * Everything is optional: empty fields stay null and the plan works without
 * them. A second tap clears the sex selection for the same reason.
 */
function AboutStep() {
  const { state, set, numbersOn } = useAppState();
  const { t, row } = useI18n();

  // Date-of-birth pieces live locally; AppState holds the assembled ISO date
  // only once all three parts form a real date.
  const [birth, setBirth] = useState(() => {
    const [y, m, d] = (state.birthDate ?? '').split('-');
    return { day: d ?? '', month: m ?? '', year: y ?? '' };
  });
  const [height, setHeight] = useState(state.heightCm?.toString() ?? '');
  const [weight, setWeight] = useState(state.weightKg?.toString() ?? '');

  const setBirthPart = (part: 'day' | 'month' | 'year') => (text: string) => {
    const nextBirth = { ...birth, [part]: asciiDigits(text).replace(/\D/g, '') };
    setBirth(nextBirth);

    const day = Number(nextBirth.day);
    const month = Number(nextBirth.month);
    const year = Number(nextBirth.year);
    const plausible =
      day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100;
    if (plausible) {
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      // Reject the 31st of February and friends.
      const parsed = new Date(`${iso}T00:00:00Z`);
      const real =
        parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() === month - 1 &&
        parsed.getUTCDate() === day;
      set({ birthDate: real ? iso : null });
    } else {
      set({ birthDate: null });
    }
  };

  const birthField = (part: 'day' | 'month' | 'year', placeholder: string, flex: number) => (
    <Field
      value={birth[part]}
      onChangeText={setBirthPart(part)}
      placeholder={placeholder}
      keyboardType="number-pad"
      maxLength={part === 'year' ? 4 : 2}
      containerStyle={{ flex }}
      accessibilityLabel={placeholder}
    />
  );

  return (
    <View>
      <SubLabel>{t('onboarding.about.name')}</SubLabel>
      <Field
        value={state.displayName}
        onChangeText={(text) => set({ displayName: text })}
        placeholder={t('onboarding.about.namePlaceholder')}
        autoComplete="name"
        accessibilityLabel={t('onboarding.about.name')}
      />

      <SubLabel>{t('onboarding.about.birth')}</SubLabel>
      <View style={{ flexDirection: row, gap: 10 }}>
        {birthField('day', t('onboarding.about.day'), 1)}
        {birthField('month', t('onboarding.about.month'), 1)}
        {birthField('year', t('onboarding.about.year'), 1.4)}
      </View>

      <SubLabel>{t('onboarding.about.sex')}</SubLabel>
      <ChipWrap direction={row}>
        {SEXES.map((sex, i) => (
          <Chip
            key={sex}
            label={t(sex)}
            selected={state.sex === i}
            onPress={() => set({ sex: state.sex === i ? null : i })}
          />
        ))}
      </ChipWrap>

      <SubLabel>{t('onboarding.about.body')}</SubLabel>
      <View style={{ flexDirection: row, gap: 10 }}>
        <Field
          value={height}
          onChangeText={(text) => {
            setHeight(text);
            set({ heightCm: parseNumber(text) });
          }}
          placeholder={t('onboarding.about.height')}
          keyboardType="decimal-pad"
          maxLength={5}
          containerStyle={{ flex: 1 }}
          accessibilityLabel={t('onboarding.about.height')}
        />
        {/* Gentle mode hides weight everywhere, including the ask. */}
        {numbersOn ? (
          <Field
            value={weight}
            onChangeText={(text) => {
              setWeight(text);
              set({ weightKg: parseNumber(text) });
            }}
            placeholder={t('onboarding.about.weight')}
            keyboardType="decimal-pad"
            maxLength={5}
            containerStyle={{ flex: 1 }}
            accessibilityLabel={t('onboarding.about.weight')}
          />
        ) : null}
      </View>

      <NoteCard style={{ padding: 14, marginTop: 16 }}>
        <Text size={13} color={colors.muted} lineHeight={20}>
          {t('onboarding.about.note')}
        </Text>
      </NoteCard>
    </View>
  );
}

function IntroStep({ onBegin, onSignIn }: { onBegin: () => void; onSignIn: () => void }) {
  const { t } = useI18n();
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 16 }}>
      <LeafBadge />
      <Display size={34} lineHeight={39}>
        {t('onboarding.intro.title')}
      </Display>
      <Text size={16} color={colors.muted} lineHeight={25}>
        {t('onboarding.intro.body')}
      </Text>
      <PrimaryButton label={t('onboarding.intro.cta')} onPress={onBegin} style={{ marginTop: 12 }} />
      <Text size={13} color={colors.faint} align="center">
        {t('onboarding.intro.note')}
      </Text>
      <TextButton onPress={onSignIn} style={{ alignSelf: 'center', padding: 4 }}>
        <Text size={13.5} weight="medium" color={colors.muted} align="center">
          {t('onboarding.intro.haveAccount')} <Strong color={colors.green}>{t('onboarding.intro.signIn')}</Strong>
        </Text>
      </TextButton>
    </View>
  );
}

/** Final step — what the plan will be built around, in plain language. */
function PlanPreview() {
  const { state } = useAppState();
  const { t, row } = useI18n();

  const chosen = (list: TranslationKey[], map: Record<number, boolean>) =>
    list.filter((_, i) => map[i]).map((key) => t(key));
  const cuisines = chosen(CUISINES, state.cuisines);
  const avoids = chosen(AVOIDS, state.avoids);

  const summary = [
    {
      color: colors.green,
      text: t('onboarding.summary.cuisine', {
        cuisines: cuisines.length
          ? cuisines.join(t('common.cuisineJoin'))
          : t('onboarding.summary.cuisineFallback'),
      }),
    },
    {
      color: colors.amber,
      text: avoids.length
        ? t('onboarding.summary.avoids', { avoids: avoids.join(t('common.listSeparator')).toLowerCase() })
        : t('onboarding.summary.avoidsNone'),
    },
    {
      color: colors.greenMid,
      text: t('onboarding.summary.life', {
        meals: t(MEALS_PER_DAY[state.mealsPerDay]),
        activity: t(ACTIVITY_LEVELS[state.activity].name).toLowerCase(),
      }),
    },
    {
      color: colors.faint,
      text:
        state.comfort === 0
          ? t('onboarding.summary.numbersFull')
          : state.comfort === 1
            ? t('onboarding.summary.numbersGentle')
            : t('onboarding.summary.numbersMinimal'),
    },
  ];

  return (
    <View style={{ gap: 14 }}>
      <Card style={{ padding: 16, gap: 11 }}>
        {summary.map((entry) => (
          <BulletRow key={entry.text} color={entry.color}>
            {entry.text}
          </BulletRow>
        ))}
      </Card>

      <View>
        <SectionLabel style={{ marginBottom: 8 }}>{t('onboarding.preview.dayOne')}</SectionLabel>
        <View style={{ gap: 8 }}>
          {TODAY_MEALS.map((meal) => (
            <View
              key={meal.name}
              style={{
                flexDirection: row,
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
                  {t(meal.slot)}
                </Text>
                <Text weight="semibold" size={14}>
                  {t(meal.name)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Text size={13} color={colors.faint} lineHeight={20}>
        {t('onboarding.preview.note')}
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
  const { row } = useI18n();
  return (
    <OptionCard
      selected={selected}
      onPress={onPress}
      padding={0}
      style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 16 }}
    >
      <RadioDot selected={selected} />
      <Text weight="medium" size={15.5} style={{ flex: 1 }}>
        {label}
      </Text>
    </OptionCard>
  );
}

function ChipWrap({
  children,
  direction,
}: {
  children: React.ReactNode;
  direction: FlexStyle['flexDirection'];
}) {
  return <View style={{ flexDirection: direction, flexWrap: 'wrap', gap: 10 }}>{children}</View>;
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text weight="semibold" size={14} style={{ marginTop: 14, marginBottom: 2 }}>
      {children}
    </Text>
  );
}
