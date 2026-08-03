import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  BareScreen,
  Card,
  CheckBox,
  Chip,
  Display,
  Meter,
  PrimaryButton,
  Strong,
  Text,
  TextButton,
} from '../components';
import { useAnalysisProfile } from '../state/useAnalysisProfile';
import {
  MealAnalysisError,
  PortionSize,
  useMealAnalysis,
} from '../services/mealAnalysis';
import { useI18n } from '../i18n';
import type { TranslationKey } from '../i18n';
import { colors, radius } from '../theme';
import { RootStackParamList, useAppNavigation } from '../navigation/types';
import { AnalyzingState } from './ScanScreen';

const PORTIONS: { key: PortionSize; label: TranslationKey }[] = [
  { key: 'small', label: 'scanConfirm.portion.small' },
  { key: 'medium', label: 'scanConfirm.portion.medium' },
  { key: 'large', label: 'scanConfirm.portion.large' },
];

/**
 * Correction step. The model's guess is shown with its confidence, and every
 * part of it is editable — a wrong ingredient the user can't fix would poison
 * the score and the estimate underneath it.
 */
export function ScanConfirmScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ScanConfirm'>>();
  const { imageUri, detection } = route.params;
  const analysis = useMealAnalysis();
  const profile = useAnalysisProfile();
  const { t, n, row, lang } = useI18n();

  const [excluded, setExcluded] = useState<Record<string, boolean>>({});
  const [portion, setPortion] = useState<PortionSize>('medium');
  const [separateItems, setSeparateItems] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Ids, not names — the analyser scores on identity, not on display text.
  const kept = useMemo(
    () => detection.ingredients.filter((item) => !excluded[item.id]).map((item) => item.id),
    [detection.ingredients, excluded],
  );

  const confirm = async () => {
    setAnalyzing(true);
    try {
      const result = await analysis.analyze({
        imageUri,
        ingredients: kept,
        portion,
        separateItems,
        profile,
        locale: lang,
      });
      navigation.navigate('ScanResult', { result, imageUri });
    } catch (error) {
      // Analysis is the second call; if it fails we send the user back to the
      // camera rather than showing a half-empty result.
      navigation.navigate('Scan');
      if (!(error instanceof MealAnalysisError)) throw error;
    } finally {
      setAnalyzing(false);
    }
  };

  if (analyzing) {
    return <AnalyzingState title={t('scan.scoring.title')} note={t('scan.scoring.note')} />;
  }

  return (
    <BareScreen>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 32, gap: 6 }}
      >
        <Display size={24}>{t('scanConfirm.title')}</Display>

        <View style={{ flexDirection: row, alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 14 }}>
          <Meter value={detection.confidence} width={120} />
          <Text weight="medium" size={13} color={colors.muted} style={{ flex: 1 }}>
            {t('scanConfirm.confidence', { percent: Math.round(detection.confidence * 100) })}{' '}
            <Strong color={colors.ink}>{detection.dish}</Strong>
          </Text>
        </View>

        {detection.mixedDishAmbiguity ? (
          <Card style={{ paddingVertical: 13, paddingHorizontal: 14, marginBottom: 10, borderRadius: radius.tile }}>
            <Text weight="semibold" size={13.5} style={{ marginBottom: 8 }}>
              {t('scanConfirm.mixed.question')}
            </Text>
            <View style={{ flexDirection: row, gap: 8 }}>
              <Chip
                label={t('scanConfirm.mixed.one')}
                selected={!separateItems}
                onPress={() => setSeparateItems(false)}
                size={13}
                paddingVertical={9}
                paddingHorizontal={0}
                style={{ flex: 1, borderRadius: 18 }}
              />
              <Chip
                label={t('scanConfirm.mixed.separate')}
                selected={separateItems}
                onPress={() => setSeparateItems(true)}
                size={13}
                paddingVertical={9}
                paddingHorizontal={0}
                style={{ flex: 1, borderRadius: 18 }}
              />
            </View>
          </Card>
        ) : null}

        <Text size={13.5} color={colors.muted} style={{ marginBottom: 10 }}>
          {t('scanConfirm.correct')}
        </Text>

        <View style={{ gap: 8 }}>
          {detection.ingredients.map((item) => {
            const off = !!excluded[item.id];
            return (
              <Pressable
                key={item.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: !off }}
                onPress={() => setExcluded((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                style={({ pressed }) => [
                  {
                    flexDirection: row,
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 13,
                    paddingHorizontal: 14,
                    borderRadius: radius.tileSm,
                    borderWidth: 1.5,
                    borderColor: off ? colors.line : colors.border,
                    backgroundColor: off ? colors.bg : colors.surface,
                    opacity: off ? 0.45 : 1,
                  },
                  pressed && { opacity: off ? 0.35 : 0.8 },
                ]}
              >
                <CheckBox checked={!off} size={18} borderRadius={radius.checkSq} showMark={false} />
                <Text weight="medium" size={15} style={{ flex: 1 }}>
                  {item.name}
                </Text>
                <Text size={12.5} color={colors.faint}>
                  {n(Math.round(item.confidence * 100))}%
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextButton
          label={t('scanConfirm.addMissing')}
          color={colors.green}
          style={{ alignSelf: 'flex-start', paddingVertical: 8, marginTop: 6 }}
        />

        <Text weight="semibold" size={14} style={{ marginTop: 10, marginBottom: 8 }}>
          {t('scanConfirm.portion')}
        </Text>
        <View style={{ flexDirection: row, gap: 10 }}>
          {PORTIONS.map((option) => (
            <Chip
              key={option.key}
              label={t(option.label)}
              selected={portion === option.key}
              onPress={() => setPortion(option.key)}
              size={14}
              paddingVertical={11}
              paddingHorizontal={0}
              style={{ flex: 1 }}
            />
          ))}
        </View>
        <Text size={12.5} color={colors.faint} style={{ marginTop: 6 }}>
          {t('scanConfirm.portionNote')}
        </Text>

        <PrimaryButton label={t('scanConfirm.cta')} onPress={confirm} style={{ marginTop: 20 }} />
      </ScrollView>
    </BareScreen>
  );
}
