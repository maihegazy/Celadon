import React from 'react';
import { Pressable, View } from 'react-native';
import {
  Card,
  Display,
  NoteField,
  OutlineButton,
  PrimaryButton,
  Screen,
  SmallButton,
  Strong,
  Text,
  TintCard,
} from '../components';
import { BackChevron } from '../components/Buttons';
import { CHECK_IN_METRICS, INVERTED_METRIC } from '../data/content';
import { useAppState } from '../state/AppState';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';
import { useAppNavigation } from '../navigation/types';

const SCALE = [0, 1, 2, 3, 4];

/**
 * Daily check-in — six quick scales and an optional note. Deliberately about
 * how you feel, not what you ate; nothing here is scored.
 */
export function CheckInScreen() {
  const navigation = useAppNavigation();
  const { state, set, dispatch } = useAppState();
  const { t, row } = useI18n();

  return (
    <Screen tabs>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('Home')} />
        <View style={{ flex: 1 }}>
          <Display size={26}>{t('checkIn.title')}</Display>
          <Text size={14} color={colors.muted} style={{ marginTop: 4 }}>
            {t('checkIn.subtitle')}
          </Text>
        </View>
      </View>

      {state.checkInSaved ? (
        <TintCard style={{ flexDirection: row, alignItems: 'center', gap: 12, padding: 16 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.green,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text weight="bold" size={14} color={colors.white}>
              ✓
            </Text>
          </View>
          <Text size={14} color={colors.greenDeep} lineHeight={20} style={{ flex: 1 }}>
            <Strong>{t('checkIn.savedTitle')}</Strong> {t('checkIn.savedBody')}
          </Text>
        </TintCard>
      ) : null}

      <View style={{ gap: 12 }}>
        {CHECK_IN_METRICS.map((metric, mi) => (
          <Card key={metric.name} style={{ padding: 16 }}>
            <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text weight="semibold" size={15}>
                {t(metric.name)}
              </Text>
              <Text weight="medium" size={12.5} color={colors.faint}>
                {t(metric.hint)}
              </Text>
            </View>
            <View style={{ flexDirection: row, gap: 8, marginTop: 12 }}>
              {SCALE.map((step) => {
                const on = (state.checkInValues[mi] ?? 0) >= step;
                const amber = mi === INVERTED_METRIC;
                return (
                  <Pressable
                    key={step}
                    accessibilityRole="button"
                    accessibilityLabel={t('checkIn.a11y.scale', { metric: t(metric.name), value: step + 1 })}
                    onPress={() => dispatch({ type: 'setCheckIn', metric: mi, value: step })}
                    style={{
                      flex: 1,
                      height: 34,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      backgroundColor: on ? (amber ? colors.amberLight : colors.greenLight) : colors.surface,
                      borderColor: on ? (amber ? colors.amber : colors.green) : colors.line,
                    }}
                  />
                );
              })}
            </View>
          </Card>
        ))}
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: state.flare }}
        onPress={() => set({ flare: !state.flare, checkInSaved: false })}
        style={{
          flexDirection: row,
          alignItems: 'center',
          gap: 12,
          padding: 16,
          borderRadius: radius.card,
          borderWidth: 1.5,
          backgroundColor: state.flare ? colors.redLight : colors.surface,
          borderColor: state.flare ? colors.red : colors.line,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: state.flare ? colors.red : colors.border,
            backgroundColor: state.flare ? colors.red : colors.transparent,
          }}
        />
        <View style={{ flex: 1 }}>
          <Text weight="semibold" size={15}>
            {t('checkIn.flare.title')}
          </Text>
          <Text size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
            {t('checkIn.flare.note')}
          </Text>
        </View>
      </Pressable>

      {state.flare ? (
        <Card style={{ padding: 16, gap: 8 }}>
          <Text weight="semibold" size={14.5}>
            {t('checkIn.reassess.title')}
          </Text>
          <Text size={13} color={colors.muted} lineHeight={20}>
            {t('checkIn.reassess.body')}
          </Text>
          <SmallButton
            label={t('checkIn.reassess.cta')}
            style={{ alignSelf: 'flex-start', borderRadius: 18, paddingHorizontal: 16 }}
            onPress={() => navigation.navigate('Onboarding', { step: 4, returnTo: 'CheckIn' })}
          />
        </Card>
      ) : null}

      <NoteField placeholder={t('checkIn.notePlaceholder')} />

      <PrimaryButton
        label={t('checkIn.cta')}
        onPress={() => {
          set({ checkInSaved: true });
          navigation.navigate('Celebrate');
        }}
      />

      <View style={{ flexDirection: row, gap: 10 }}>
        <OutlineButton
          label={t('checkIn.trends')}
          size={14}
          background={colors.surface}
          borderColor={colors.line}
          style={{ flex: 1, borderWidth: 1, borderRadius: radius.tile, paddingVertical: 14 }}
          onPress={() => navigation.navigate('Progress')}
        />
        <OutlineButton
          label={t('checkIn.reintroduction')}
          size={14}
          background={colors.surface}
          borderColor={colors.line}
          style={{ flex: 1, borderWidth: 1, borderRadius: radius.tile, paddingVertical: 14 }}
          onPress={() => navigation.navigate('Reintroduction')}
        />
      </View>
    </Screen>
  );
}
