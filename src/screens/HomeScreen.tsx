import React from 'react';
import { Pressable, View } from 'react-native';
import {
  Card,
  Display,
  FeatureCard,
  MealRow,
  Screen,
  Text,
  TextButton,
} from '../components';
import { BellIcon, DiamondIcon, SearchIcon, TrendIcon } from '../components/Icons';
import { TODAY_MEALS } from '../data/content';
import { useAppState } from '../state/AppState';
import { useI18n } from '../i18n';
import { colors, radius, tracking } from '../theme';
import { useAppNavigation } from '../navigation/types';

/** Daily dashboard — one focus, today's meals, and two quiet entry points. */
export function HomeScreen() {
  const navigation = useAppNavigation();
  const { state, numbersOn } = useAppState();
  const { t, row, chevronForward } = useI18n();
  const name = state.displayName.trim();

  return (
    <Screen tabs gap={18}>
      <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 6 }}>
        <View>
          <Text weight="medium" size={13.5} color={colors.faint}>
            {t('home.date')}
          </Text>
          <Display size={27} style={{ marginTop: 2 }}>
            {name ? t('home.greeting', { name }) : t('home.greetingPlain')}
          </Display>
        </View>
        <View style={{ flexDirection: row, gap: 8, alignItems: 'center' }}>
          <RoundButton label={t('common.search')} onPress={() => navigation.navigate('Explore')}>
            <SearchIcon />
          </RoundButton>
          <RoundButton label={t('home.a11y.notifications')} onPress={() => navigation.navigate('Notifications')}>
            <BellIcon />
          </RoundButton>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.a11y.profile')}
            onPress={() => navigation.navigate('Profile')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.greenLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text weight="semibold" size={15} color={colors.green}>
              M
            </Text>
          </Pressable>
        </View>
      </View>

      <FeatureCard style={{ padding: 18 }}>
        <Text
          weight="semibold"
          size={12}
          color={colors.greenPale}
          style={{ letterSpacing: tracking(12, 0.08), textTransform: 'uppercase' }}
        >
          {t('home.focus.eyebrow')}
        </Text>
        <Text weight="serif" size={19} color={colors.white} lineHeight={26} style={{ marginTop: 6 }}>
          {t('home.focus.title')}
        </Text>
        <Text size={13} color={colors.greenPale} style={{ marginTop: 8 }}>
          {t('home.focus.note')}
        </Text>
      </FeatureCard>

      <View>
        <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text weight="semibold" size={16}>
            {t('home.meals')}
          </Text>
          <TextButton
            label={t('home.diaryLink')}
            color={colors.green}
            size={13.5}
            onPress={() => navigation.navigate('Diary')}
          />
        </View>
        <View style={{ gap: 10 }}>
          {TODAY_MEALS.map((meal) => (
            <MealRow
              key={meal.name}
              slot={t(meal.slot)}
              name={t(meal.name)}
              meta={
                numbersOn
                  ? t('common.minutesAndCalories', { count: meal.minutes, calories: meal.calories })
                  : t('common.minutes', { count: meal.minutes })
              }
              badge={t(meal.badge)}
              onPress={
                meal.recipeSlug
                  ? () => navigation.navigate('RecipeDetail', { slug: meal.recipeSlug as string })
                  : undefined
              }
            />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: row, gap: 10 }}>
        <QuickTile
          onPress={() => navigation.navigate('CheckIn')}
          title={t('home.checkIn.title')}
          note={t('home.checkIn.note')}
          mark={<View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.amber }} />}
        />
        <QuickTile
          onPress={() => navigation.navigate('Progress')}
          title={t('home.progress.title')}
          note={t('home.progress.note')}
          mark={<TrendIcon />}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('Reintroduction')}
        style={({ pressed }) => [
          {
            flexDirection: row,
            alignItems: 'center',
            gap: 12,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radius.card,
            padding: 16,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.amberLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DiamondIcon />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="semibold" size={14.5}>
            {t('home.reintro.title')}
          </Text>
          <Text size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
            {t('home.reintro.note')}
          </Text>
        </View>
        <Text size={18} color={colors.faint}>
          {chevronForward}
        </Text>
      </Pressable>
    </Screen>
  );
}

function RoundButton({
  children,
  onPress,
  label,
}: {
  children: React.ReactNode;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      {children}
    </Pressable>
  );
}

function QuickTile({
  title,
  note,
  mark,
  onPress,
}: {
  title: string;
  note: string;
  mark: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.85 }]}
    >
      <Card style={{ padding: 16 }}>
        <View style={{ marginBottom: 8, height: 10, justifyContent: 'flex-end' }}>{mark}</View>
        <Text weight="semibold" size={14.5}>
          {title}
        </Text>
        <Text size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
          {note}
        </Text>
      </Card>
    </Pressable>
  );
}
