import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Card,
  EmptyCard,
  Hatch,
  LeafBadge,
  Meter,
  NoteCard,
  OutlineButton,
  Pill,
  PrimaryButton,
  Screen,
  ScreenHeader,
  Strong,
  Text,
} from '../components';
import { DIARY_ENTRIES, MACRO_METERS, WATER_GLASSES } from '../data/content';
import type { TranslationKey } from '../i18n';
import { useAppState } from '../state/AppState';
import { useTracking } from '../state/TrackingSync';
import { isSupabaseConfigured } from '../services/supabase';
import { useI18n } from '../i18n';
import { colors, radius, tracking } from '../theme';
import { useAppNavigation } from '../navigation/types';

/** '8:20' — the compact 12-hour form the entry rows use. */
const clockTime = (iso: string): string => {
  const date = new Date(iso);
  const hours = date.getHours() % 12 || 12;
  return `${hours}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/**
 * Food diary. Entries arrive by scan or by hand, and the tone stays neutral —
 * no targets shouted at you, no red numbers, no guilt.
 */
export function DiaryScreen() {
  const navigation = useAppNavigation();
  const { state, dispatch, numbersOn } = useAppState();
  const { setWater, removeEntry } = useTracking();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { t, n, row, lang, textAlign, isRTL } = useI18n();

  // Without a backend the walkable demo keeps its example entries; against a
  // real one the diary shows only what was actually logged.
  const demoEntries = isSupabaseConfigured
    ? []
    : DIARY_ENTRIES.map((entry, index) => ({
        key: `demo-${index}`,
        time: entry.time,
        slot: t(entry.slot),
        name: t(entry.name),
        calories: entry.calories as number | null,
        score: entry.score as number | null,
        proteinG: null as number | null,
        carbsG: null as number | null,
        fatG: null as number | null,
        remove: () => dispatch({ type: 'removeDiaryEntry', index }),
      })).filter((_, index) => !state.diaryRemoved[index]);

  const entries = [
    ...demoEntries,
    ...state.diaryEntries.map((entry) => ({
      key: entry.id,
      time: clockTime(entry.loggedAt),
      slot: t(`slot.${entry.slot}` as TranslationKey),
      name: entry.name,
      calories: entry.calories,
      score: entry.score,
      proteinG: entry.proteinG,
      carbsG: entry.carbsG,
      fatG: entry.fatG,
      remove: () => removeEntry(entry.id),
    })),
  ];

  const totalCalories = entries.reduce((sum, entry) => sum + (entry.calories ?? 0), 0);

  // The day's score is the average of what was actually scored — no entries,
  // no number. Estimates averaged, never invented.
  const scored = entries.filter((entry) => entry.score !== null);
  const dayScore = scored.length
    ? Math.round(scored.reduce((sum, entry) => sum + (entry.score ?? 0), 0) / scored.length)
    : null;

  const macroTotal = (key: 'proteinG' | 'carbsG' | 'fatG') =>
    Math.round(entries.reduce((sum, entry) => sum + (entry[key] ?? 0), 0));

  return (
    <Screen tabs>
      <ScreenHeader
        title={t('diary.title')}
        subtitle={new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
        onBack={() => navigation.navigate('Home')}
        trailing={
          dayScore !== null ? (
            <Pill
              label={t('diary.dayScore', { score: dayScore })}
              size={12.5}
              style={{ borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 }}
            />
          ) : undefined
        }
      />

      {numbersOn ? (
        <Card style={{ paddingVertical: 16, paddingHorizontal: 18, borderRadius: radius.cardLg }}>
          <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text weight="semibold" size={15}>
              {t('diary.soFar', { calories: totalCalories })}
            </Text>
            <Text size={12.5} color={colors.faint}>
              {t('common.estimates')}
            </Text>
          </View>
          <View style={{ gap: 9, marginTop: 12 }}>
            {MACRO_METERS.map((meter) => {
              const total = macroTotal(meter.key);
              return (
                <View key={meter.name} style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
                  <Text weight="semibold" size={12} color={colors.muted} style={{ width: isRTL ? 76 : 52 }}>
                    {t(meter.name)}
                  </Text>
                  <Meter
                    value={Math.min(1, total / meter.target)}
                    height={7}
                    color={meter.color}
                    track={colors.sunken}
                  />
                  <Text size={12} color={colors.faint} align={textAlign === 'right' ? 'left' : 'right'} style={{ width: 64 }}>
                    {t('macro.progress', { total: n(total), target: n(meter.target) })}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>
      ) : (
        <NoteCard style={{ paddingVertical: 13, paddingHorizontal: 16 }}>
          <Text size={13} color={colors.muted} lineHeight={20}>
            {t('diary.gentleNote')} <Strong color={colors.green}>{t('diary.gentleNoteStrong')}</Strong>{' '}
            {t('diary.gentleNoteEnd')}
          </Text>
        </NoteCard>
      )}

      <Card style={{ paddingVertical: 16, paddingHorizontal: 18, borderRadius: radius.cardLg }}>
        <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text weight="semibold" size={15}>
            {t('diary.water')}
          </Text>
          <Text size={12.5} color={colors.faint}>
            {t('diary.waterCount', { count: state.water, total: WATER_GLASSES })}
          </Text>
        </View>
        <View style={{ flexDirection: row, gap: 8, marginTop: 12 }}>
          {Array.from({ length: WATER_GLASSES }, (_, i) => {
            const filled = i < state.water;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={t('diary.a11y.water', { count: i + 1 })}
                onPress={() => setWater(i + 1)}
                style={{
                  flex: 1,
                  height: 34,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  backgroundColor: filled ? colors.water : colors.surface,
                  borderColor: filled ? colors.waterBorder : colors.line,
                }}
              />
            );
          })}
        </View>
      </Card>

      <View>
        <Text weight="semibold" size={16} style={{ marginBottom: 10 }}>
          {t('diary.logged')}
        </Text>

        {entries.length === 0 ? (
          <EmptyCard style={{ paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center', gap: 8 }}>
            <LeafBadge size={44} leaf={16} />
            <Text weight="semibold" size={15}>
              {t('diary.empty.title')}
            </Text>
            <Text size={13} color={colors.muted} lineHeight={20} align="center">
              {t('diary.empty.body')}
            </Text>
          </EmptyCard>
        ) : (
          <View style={{ gap: 10 }}>
            {entries.map((entry) => (
              <Card key={entry.key} style={{ paddingVertical: 13, paddingHorizontal: 14 }}>
                <View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
                  <Hatch band={6} radius={11} style={{ width: 46, height: 46 }} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      weight="semibold"
                      size={11.5}
                      color={colors.faint}
                      style={{ letterSpacing: tracking(11.5, 0.07), textTransform: 'uppercase' }}
                    >
                      {entry.slot} · {n(entry.time)}
                    </Text>
                    <Text weight="semibold" size={14.5} style={{ marginTop: 1 }}>
                      {entry.name}
                    </Text>
                    <Text size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
                      {numbersOn && entry.calories !== null
                        ? t('diary.entryMeta', { calories: entry.calories })
                        : t('diary.entryLogged')}
                    </Text>
                  </View>
                  {entry.score !== null ? (
                    <Pill
                      label={n(entry.score)}
                      size={11}
                      background={entry.score >= 80 ? colors.greenLight : colors.amberLight}
                      color={entry.score >= 80 ? colors.green : colors.amber}
                      style={{ borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 }}
                    />
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('diary.a11y.options')}
                    hitSlop={8}
                    onPress={() => setOpenMenu(openMenu === entry.key ? null : entry.key)}
                  >
                    <Text size={17} color={colors.faint} style={{ letterSpacing: 1 }}>
                      ···
                    </Text>
                  </Pressable>
                </View>

                {openMenu === entry.key ? (
                  <View
                    style={{
                      flexDirection: row,
                      gap: 8,
                      marginTop: 10,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: colors.sunken,
                    }}
                  >
                    <Pressable style={styleFor(colors.bg)} onPress={() => setOpenMenu(null)}>
                      <Text weight="semibold" size={13} color={colors.green}>
                        {t('diary.editPortion')}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styleFor(colors.redLight)}
                      onPress={() => {
                        entry.remove();
                        setOpenMenu(null);
                      }}
                    >
                      <Text weight="semibold" size={13} color={colors.red}>
                        {t('diary.remove')}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </Card>
            ))}
          </View>
        )}
      </View>

      <View style={{ flexDirection: row, gap: 10 }}>
        <PrimaryButton
          label={t('diary.scanMeal')}
          size={14}
          style={{ flex: 1, paddingVertical: 13, borderRadius: radius.chip }}
          onPress={() => navigation.navigate('Scan')}
        />
        <OutlineButton
          label={t('diary.addSnack')}
          size={14}
          background={colors.surface}
          style={{ flex: 1, paddingVertical: 13, borderRadius: radius.chip }}
          onPress={() => navigation.navigate('ManualAdd')}
        />
        <OutlineButton
          label={t('diary.addDrink')}
          size={14}
          background={colors.surface}
          style={{ flex: 1, paddingVertical: 13, borderRadius: radius.chip }}
          onPress={() => navigation.navigate('ManualAdd')}
        />
      </View>
    </Screen>
  );
}

const styleFor = (background: string) => ({
  flex: 1,
  backgroundColor: background,
  borderRadius: 12,
  paddingVertical: 9,
  alignItems: 'center' as const,
});
