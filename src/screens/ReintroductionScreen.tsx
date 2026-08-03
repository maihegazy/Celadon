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
import { REINTRO_ACTIVE, REINTRO_ITEMS, toneColors } from '../data/content';
import { useI18n } from '../i18n';
import { colors, radius, tracking } from '../theme';
import { useAppNavigation } from '../navigation/types';

const queuedTone = { dot: colors.border, text: colors.faint };

/**
 * Reintroduction tracker — one food at a time, five days each, and pausing is
 * always an acceptable answer.
 */
export function ReintroductionScreen() {
  const navigation = useAppNavigation();
  const { t, row } = useI18n();

  return (
    <Screen tabs>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('CheckIn')} />
        <Display size={26}>{t('reintro.title')}</Display>
      </View>

      <Text size={14} color={colors.muted} lineHeight={22}>
        {t('reintro.intro')}
      </Text>

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
            {t('reintro.dayOf', { day: REINTRO_ACTIVE.day, total: REINTRO_ACTIVE.days })}
          </Text>
        </View>
        <Display size={22} style={{ marginTop: 6 }}>
          {t(REINTRO_ACTIVE.name)}
        </Display>
        <View style={{ marginTop: 12 }}>
          <SegmentBar total={REINTRO_ACTIVE.days} filled={REINTRO_ACTIVE.day} />
        </View>
        <Text size={13.5} color={colors.muted} lineHeight={20} style={{ marginTop: 10 }}>
          {t('reintro.note')}
        </Text>
        <View style={{ flexDirection: row, gap: 8, marginTop: 12 }}>
          <PrimaryButton
            label={t('reintro.fine')}
            size={13.5}
            style={{ flex: 1, paddingVertical: 11, borderRadius: 20 }}
          />
          <OutlineButton
            label={t('reintro.symptoms')}
            size={13.5}
            color={colors.red}
            background={colors.redLight}
            borderColor={colors.redLight}
            style={{ flex: 1, paddingVertical: 11, borderRadius: 20 }}
          />
        </View>
      </Card>

      <View style={{ gap: 8 }}>
        {REINTRO_ITEMS.map((item) => {
          const tone = item.tone === 'queued' ? queuedTone : toneColors[item.tone];
          return (
            <Card
              key={`${item.name}-${item.status}`}
              style={{
                flexDirection: row,
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: radius.tile,
                opacity: item.dim ? 0.55 : 1,
              }}
            >
              <Dot color={tone.dot} />
              <View style={{ flex: 1 }}>
                <Text weight="semibold" size={14.5}>
                  {t(item.name)}
                </Text>
                <Text size={12.5} color={colors.muted} style={{ marginTop: 1 }}>
                  {t(item.status)}
                </Text>
              </View>
              <Text weight="bold" size={12} color={tone.text}>
                {t(item.tag)}
              </Text>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
