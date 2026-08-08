import React from 'react';
import { View } from 'react-native';
import {
  Card,
  Display,
  Dot,
  OutlineButton,
  PrimaryButton,
  Screen,
  SegmentBar,
  Text,
} from '../components';
import { BackChevron } from '../components/Buttons';
import { toneColors, Tone } from '../data/content';
import { ReintroductionStatus } from '../services/reintroduction';
import { useReintroduction } from '../state/useReintroduction';
import type { TranslationKey } from '../i18n';
import { useI18n } from '../i18n';
import { colors, radius, tracking } from '../theme';
import { useAppNavigation } from '../navigation/types';

const queuedTone = { dot: colors.border, text: colors.faint };

const STATUS_TONE: Record<ReintroductionStatus, Tone | 'queued'> = {
  queued: 'queued',
  testing: 'flag',
  passed: 'good',
  reacted: 'limit',
  paused: 'mid',
};

const STATUS_TAG: Record<ReintroductionStatus, TranslationKey> = {
  queued: 'reintro.tag.queued',
  testing: 'reintro.tag.testing',
  passed: 'reintro.tag.passed',
  reacted: 'reintro.tag.reacted',
  paused: 'reintro.tag.paused',
};

/**
 * Reintroduction tracker — one food at a time, five days each, and pausing is
 * always an acceptable answer.
 */
export function ReintroductionScreen() {
  const navigation = useAppNavigation();
  const { t, n, row, lang } = useI18n();
  const { items, active, activeDay, markDay } = useReintroduction();

  const displayName = (item: { nameEn: string; nameAr: string }) =>
    lang === 'ar' ? item.nameAr : item.nameEn;

  return (
    <Screen tabs>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('CheckIn')} />
        <Display size={26}>{t('reintro.title')}</Display>
      </View>

      <Text size={14} color={colors.muted} lineHeight={22}>
        {t('reintro.intro')}
      </Text>

      {active ? (
        <Card style={{ padding: 18, borderColor: colors.amber, borderWidth: 1.5, borderRadius: radius.cardLg }}>
          <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              weight="bold"
              size={12}
              color={colors.amber}
              style={{ letterSpacing: tracking(12, 0.07), textTransform: 'uppercase' }}
            >
              {t('reintro.testingNow')}
            </Text>
            <Text weight="semibold" size={12.5} color={colors.faint}>
              {t('reintro.dayOf', { day: n(activeDay), total: n(active.trialDays) })}
            </Text>
          </View>
          <Display size={22} style={{ marginTop: 6 }}>
            {displayName(active)}
          </Display>
          <View style={{ marginTop: 12 }}>
            <SegmentBar total={active.trialDays} filled={activeDay} />
          </View>
          <Text size={13.5} color={colors.muted} lineHeight={20} style={{ marginTop: 10 }}>
            {t('reintro.note')}
          </Text>
          <View style={{ flexDirection: row, gap: 8, marginTop: 12 }}>
            <PrimaryButton
              label={t('reintro.fine')}
              size={13.5}
              style={{ flex: 1, paddingVertical: 11, borderRadius: 20 }}
              onPress={() => markDay(true)}
            />
            <OutlineButton
              label={t('reintro.symptoms')}
              size={13.5}
              color={colors.red}
              background={colors.redLight}
              borderColor={colors.redLight}
              style={{ flex: 1, paddingVertical: 11, borderRadius: 20 }}
              onPress={() => markDay(false)}
            />
          </View>
        </Card>
      ) : null}

      <View style={{ gap: 8 }}>
        {items.map((item) => {
          // Later stages stay dim until their turn; everything else wears
          // its own status.
          const laterStage = item.stage > 1 && item.status === 'queued';
          const toneKey = STATUS_TONE[item.status];
          const tone = toneKey === 'queued' ? queuedTone : toneColors[toneKey];
          const statusText = laterStage
            ? t('reintro.item.stage2')
            : item.status === 'testing'
              ? t('reintro.status.testing', { day: n(activeDay), total: n(item.trialDays) })
              : t(`reintro.status.${item.status}` as TranslationKey);
          return (
            <Card
              key={item.id}
              style={{
                flexDirection: row,
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: radius.tile,
                opacity: laterStage ? 0.55 : 1,
              }}
            >
              <Dot color={tone.dot} />
              <View style={{ flex: 1 }}>
                <Text weight="semibold" size={14.5}>
                  {displayName(item)}
                </Text>
                <Text size={12.5} color={colors.muted} style={{ marginTop: 1 }}>
                  {statusText}
                </Text>
              </View>
              <Text weight="bold" size={12} color={tone.text}>
                {t(laterStage ? 'reintro.tag.later' : STATUS_TAG[item.status])}
              </Text>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
