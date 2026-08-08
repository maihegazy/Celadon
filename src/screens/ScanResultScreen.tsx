import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import { View } from 'react-native';
import {
  Card,
  Display,
  Dot,
  NoteCard,
  Pill,
  PrimaryButton,
  Screen,
  ScoreDial,
  SmallButton,
  Strong,
  Text,
  TextButton,
  TintCard,
} from '../components';
import { IngredientTone, MealAnalysisResult } from '../services/mealAnalysis';
import type { TranslationKey } from '../i18n';
import { useAppState } from '../state/AppState';
import { useTracking } from '../state/TrackingSync';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';
import { RootStackParamList, useAppNavigation } from '../navigation/types';

const toneStyles: Record<IngredientTone, { dot: string; text: string }> = {
  supportive: { dot: colors.green, text: colors.green },
  balanced: { dot: colors.greenMid, text: colors.greenText },
  flagged: { dot: colors.amber, text: colors.amber },
  limit: { dot: colors.amber, text: colors.amber },
};

/**
 * Scan result — score first, then the reasoning, then the numbers (if the
 * user wants them at all). Estimates are labelled as estimates every time
 * they appear.
 */
export function ScanResultScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ScanResult'>>();
  const result: MealAnalysisResult = route.params.result;
  const { numbersOn, set } = useAppState();
  const { logScan } = useTracking();
  const { t, n, row } = useI18n();
  // Logging is one tap and lands once — a second tap must not duplicate it.
  const logged = React.useRef(false);

  const addToDiary = () => {
    if (!logged.current) {
      logged.current = true;
      logScan(result, {
        portion: route.params.portion,
        separateItems: route.params.separateItems,
      });
    }
    navigation.navigate('Diary');
  };

  return (
    <Screen padding={24} paddingTop={24} paddingBottom={32}>
      <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'center' }}>
        <Display size={22} style={{ flex: 1 }}>
          {result.dish}
        </Display>
        <SmallButton label={t('scanResult.rescan')} color={colors.muted} onPress={() => navigation.navigate('Scan')} />
      </View>

      <Card style={{ flexDirection: row, gap: 16, alignItems: 'center', padding: 18, borderRadius: radius.cardLg }}>
        <ScoreDial score={result.celadonScore} caption={t('compare.score')} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: row, gap: 6, flexWrap: 'wrap' }}>
            <Pill label={t(`classification.${result.classification}` as TranslationKey)} />
            <Pill
              label={t(`confidence.${result.confidence}` as TranslationKey)}
              background={colors.sunken}
              color={colors.muted}
              weight="semibold"
            />
          </View>
          <Text size={13.5} color={colors.muted} lineHeight={20} style={{ marginTop: 8 }}>
            {result.summary}
          </Text>
        </View>
      </Card>

      {numbersOn ? (
        <Card style={{ paddingVertical: 14, paddingHorizontal: 18 }}>
          <View style={{ flexDirection: row, alignItems: 'center', gap: 14 }}>
            <View style={{ flex: 1, flexDirection: row, gap: 16, flexWrap: 'wrap' }}>
              <Macro value={n(result.nutrition.calories)} label={t('nutrition.calories')} />
              <Macro value={t('unit.grams', { value: n(result.nutrition.protein) })} label={t('nutrition.protein')} />
              <Macro value={t('unit.grams', { value: n(result.nutrition.carbs) })} label={t('nutrition.carbs')} />
              <Macro value={t('unit.grams', { value: n(result.nutrition.fat) })} label={t('nutrition.fat')} />
              <Macro value={t('unit.grams', { value: n(result.nutrition.fibre) })} label={t('nutrition.fibre')} />
            </View>
            <TextButton label={t('common.hide')} size={12.5} color={colors.faint} onPress={() => set({ numbersOverride: false })} />
          </View>
          <Text
            size={12}
            color={colors.faint}
            style={{ marginTop: 10, paddingTop: 9, borderTopWidth: 1, borderTopColor: colors.sunken }}
          >
            {t('scanResult.estimateNote')}
          </Text>
        </Card>
      ) : (
        <NoteCard
          style={{
            paddingVertical: 13,
            paddingHorizontal: 16,
            flexDirection: row,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text size={13} color={colors.muted} lineHeight={20} style={{ flex: 1 }}>
            {t('scanResult.gentleHidden')}
          </Text>
          <TextButton
            label={t('common.show')}
            size={12.5}
            color={colors.green}
            weight="semibold"
            onPress={() => set({ numbersOverride: true })}
          />
        </NoteCard>
      )}

      <View>
        <Text weight="semibold" size={15} style={{ marginBottom: 10 }}>
          {t('scanResult.breakdown')}
        </Text>
        <View style={{ gap: 8 }}>
          {result.ingredients.map((item) => {
            const tone = toneStyles[item.tone];
            return (
              <Card
                key={item.name}
                style={{
                  flexDirection: row,
                  gap: 12,
                  alignItems: 'flex-start',
                  paddingVertical: 13,
                  paddingHorizontal: 14,
                  borderRadius: radius.tileSm,
                }}
              >
                <Dot color={tone.dot} style={{ marginTop: 4 }} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: row, justifyContent: 'space-between', gap: 8 }}>
                    <Text weight="semibold" size={14.5} style={{ flex: 1 }}>
                      {item.name}
                    </Text>
                    <Text weight="bold" size={12} color={tone.text}>
                      {item.label}
                    </Text>
                  </View>
                  <Text size={13} color={colors.muted} lineHeight={19} style={{ marginTop: 2 }}>
                    {item.reason}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      </View>

      {result.substitutions.length ? (
        <TintCard style={{ padding: 16 }}>
          <Text weight="semibold" size={14.5} color={colors.greenDeep} style={{ marginBottom: 8 }}>
            {t('scanResult.substitutions')}
          </Text>
          <View style={{ gap: 8 }}>
            {result.substitutions.map((sub) => (
              <Text key={sub.from} size={13.5} color={colors.greenDeep} lineHeight={20}>
                <Strong>{sub.from}</Strong> → {sub.to}
              </Text>
            ))}
          </View>
        </TintCard>
      ) : null}

      <PrimaryButton label={t('scanResult.cta')} onPress={addToDiary} />
    </Screen>
  );
}

function Macro({ value, label }: { value: string; label: string }) {
  return (
    <View>
      <Text weight="bold" size={17}>
        {value}
      </Text>
      <Text weight="medium" size={11.5} color={colors.faint}>
        {label}
      </Text>
    </View>
  );
}
