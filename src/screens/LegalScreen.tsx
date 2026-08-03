import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, Chip, Display, Screen, Text } from '../components';
import { BackChevron } from '../components/Buttons';
import { useI18n } from '../i18n';
import type { TranslationKey } from '../i18n';
import { colors } from '../theme';
import { RootStackParamList, useAppNavigation } from '../navigation/types';

const TABS: TranslationKey[] = ['legal.tab.privacy', 'legal.tab.terms', 'legal.tab.medical'];

const SECTIONS: { title: TranslationKey; body: TranslationKey }[][] = [
  [
    { title: 'legal.privacy.store', body: 'legal.privacy.store.body' },
    { title: 'legal.privacy.never', body: 'legal.privacy.never.body' },
    { title: 'legal.privacy.controls', body: 'legal.privacy.controls.body' },
  ],
  [
    { title: 'legal.terms.subscription', body: 'legal.terms.subscription.body' },
    { title: 'legal.terms.trial', body: 'legal.terms.trial.body' },
    { title: 'legal.terms.refunds', body: 'legal.terms.refunds.body' },
  ],
  [
    { title: 'legal.medical.is', body: 'legal.medical.is.body' },
    { title: 'legal.medical.isNot', body: 'legal.medical.isNot.body' },
    { title: 'legal.medical.wrong', body: 'legal.medical.wrong.body' },
  ],
];

/** Privacy, terms and the medical disclaimer — plain language, no small print. */
export function LegalScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Legal'>>();
  const [tab, setTab] = useState(route.params?.tab ?? 0);
  const { t, row } = useI18n();

  return (
    <Screen tabs gap={14}>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.goBack()} />
        <Display size={26}>{t('legal.title')}</Display>
      </View>

      <View style={{ flexDirection: row, gap: 8 }}>
        {TABS.map((label, i) => (
          <Chip
            key={label}
            label={t(label)}
            selected={tab === i}
            onPress={() => setTab(i)}
            size={13}
            paddingVertical={9}
            paddingHorizontal={0}
            style={{ flex: 1, borderRadius: 18 }}
          />
        ))}
      </View>

      <Card style={{ padding: 18, gap: 12 }}>
        {SECTIONS[tab].map((section) => (
          <View key={section.title}>
            <Text weight="semibold" size={14.5} style={{ marginBottom: 4 }}>
              {t(section.title)}
            </Text>
            <Text size={13.5} color={colors.muted} lineHeight={22}>
              {t(section.body)}
            </Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
