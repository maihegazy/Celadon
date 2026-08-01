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
import { DATE_LABEL, DAY_SCORE, DIARY_ENTRIES, MACRO_BARS, WATER_GLASSES } from '../data/content';
import { useAppState } from '../state/AppState';
import { colors, radius, tracking } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Food diary. Entries arrive by scan or by hand, and the tone stays neutral —
 * no targets shouted at you, no red numbers, no guilt.
 */
export function DiaryScreen() {
  const navigation = useAppNavigation();
  const { state, set, dispatch, numbersOn } = useAppState();
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const entries = [
    ...DIARY_ENTRIES,
    ...state.manuallyAdded.map((name) => ({
      time: 'now',
      slot: 'Snack',
      name,
      calories: 120,
      score: 86,
    })),
  ]
    .map((entry, index) => ({ ...entry, index }))
    .filter((entry) => !state.diaryRemoved[entry.index]);

  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);

  return (
    <Screen tabs>
      <ScreenHeader
        title="Food diary"
        subtitle={DATE_LABEL}
        onBack={() => navigation.navigate('Home')}
        trailing={
          <Pill
            label={`Day score ${DAY_SCORE}`}
            size={12.5}
            style={{ borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 }}
          />
        }
      />

      {numbersOn ? (
        <Card style={{ paddingVertical: 16, paddingHorizontal: 18, borderRadius: radius.cardLg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text weight="semibold" size={15}>
              {totalCalories.toLocaleString()} cal so far
            </Text>
            <Text size={12.5} color={colors.faint}>
              estimates
            </Text>
          </View>
          <View style={{ gap: 9, marginTop: 12 }}>
            {MACRO_BARS.map((bar) => (
              <View key={bar.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text weight="semibold" size={12} color={colors.muted} style={{ width: 52 }}>
                  {bar.name}
                </Text>
                <Meter value={bar.fill} height={7} color={bar.color} track={colors.sunken} />
                <Text size={12} color={colors.faint} align="right" style={{ width: 64 }}>
                  {bar.value}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      ) : (
        <NoteCard style={{ paddingVertical: 13, paddingHorizontal: 16 }}>
          <Text size={13} color={colors.muted} lineHeight={20}>
            Numbers are hidden in gentle mode. Today reads as <Strong color={colors.green}>supportive</Strong> overall.
          </Text>
        </NoteCard>
      )}

      <Card style={{ paddingVertical: 16, paddingHorizontal: 18, borderRadius: radius.cardLg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text weight="semibold" size={15}>
            Water
          </Text>
          <Text size={12.5} color={colors.faint}>
            {state.water} of {WATER_GLASSES} glasses
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {Array.from({ length: WATER_GLASSES }, (_, i) => {
            const filled = i < state.water;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`${i + 1} glasses`}
                onPress={() => set({ water: i + 1 })}
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
          Logged today
        </Text>

        {entries.length === 0 ? (
          <EmptyCard style={{ paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center', gap: 8 }}>
            <LeafBadge size={44} leaf={16} />
            <Text weight="semibold" size={15}>
              Nothing logged yet
            </Text>
            <Text size={13} color={colors.muted} lineHeight={20} align="center">
              Scan your first meal or add one below — no pressure to log everything.
            </Text>
          </EmptyCard>
        ) : (
          <View style={{ gap: 10 }}>
            {entries.map((entry) => (
              <Card key={entry.index} style={{ paddingVertical: 13, paddingHorizontal: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Hatch band={6} radius={11} style={{ width: 46, height: 46 }} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      weight="semibold"
                      size={11.5}
                      color={colors.faint}
                      style={{ letterSpacing: tracking(11.5, 0.07), textTransform: 'uppercase' }}
                    >
                      {entry.slot} · {entry.time}
                    </Text>
                    <Text weight="semibold" size={14.5} style={{ marginTop: 1 }}>
                      {entry.name}
                    </Text>
                    <Text size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
                      {numbersOn ? `${entry.calories} cal · estimate` : 'logged'}
                    </Text>
                  </View>
                  <Pill
                    label={String(entry.score)}
                    size={11}
                    background={entry.score >= 80 ? colors.greenLight : colors.amberLight}
                    color={entry.score >= 80 ? colors.green : colors.amber}
                    style={{ borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Entry options"
                    hitSlop={8}
                    onPress={() => setOpenMenu(openMenu === entry.index ? null : entry.index)}
                  >
                    <Text size={17} color={colors.faint} style={{ letterSpacing: 1 }}>
                      ···
                    </Text>
                  </Pressable>
                </View>

                {openMenu === entry.index ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 8,
                      marginTop: 10,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: colors.sunken,
                    }}
                  >
                    <Pressable style={styleFor(colors.bg)} onPress={() => setOpenMenu(null)}>
                      <Text weight="semibold" size={13} color={colors.green}>
                        Edit portion
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styleFor(colors.redLight)}
                      onPress={() => {
                        dispatch({ type: 'removeDiaryEntry', index: entry.index });
                        setOpenMenu(null);
                      }}
                    >
                      <Text weight="semibold" size={13} color={colors.red}>
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </Card>
            ))}
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <PrimaryButton
          label="Scan a meal"
          size={14}
          style={{ flex: 1, paddingVertical: 13, borderRadius: radius.chip }}
          onPress={() => navigation.navigate('Scan')}
        />
        <OutlineButton
          label="Add snack"
          size={14}
          background={colors.surface}
          style={{ flex: 1, paddingVertical: 13, borderRadius: radius.chip }}
          onPress={() => navigation.navigate('ManualAdd')}
        />
        <OutlineButton
          label="Add drink"
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
