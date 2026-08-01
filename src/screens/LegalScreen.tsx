import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, Chip, Display, Screen, Text } from '../components';
import { BackChevron } from '../components/Buttons';
import { colors } from '../theme';
import { RootStackParamList, useAppNavigation } from '../navigation/types';

const TABS = ['Privacy', 'Terms', 'Medical care'];

const SECTIONS: { title: string; body: string }[][] = [
  [
    {
      title: 'What we store',
      body:
        'Your assessment answers, logged meals, check-ins and preferences — the minimum needed to personalize your plan. Meal photos are analyzed on the fly and not retained.',
    },
    {
      title: 'What we never do',
      body:
        'Sell your data, show ads, or share health information with anyone without your explicit action (like exporting a doctor report).',
    },
    {
      title: 'Your controls',
      body:
        'Export everything as a file, correct any record, or delete your account and all data — each takes one tap in Profile.',
    },
  ],
  [
    {
      title: 'Subscription',
      body:
        'Billed through the App Store or Google Play. Cancel anytime from your store account — access continues to the end of the paid period.',
    },
    {
      title: 'Free trial',
      body: '7 days, full access. We remind you two days before it converts. No charge if you cancel before it ends.',
    },
    {
      title: 'Refunds',
      body: "Handled by the store per their policies; we'll always help you file the request.",
    },
  ],
  [
    {
      title: 'What Celadon is',
      body:
        'A nutrition companion. It offers meal guidance and pattern observations based on the information you share.',
    },
    {
      title: "What it isn't",
      body:
        'Celadon does not diagnose, treat, cure or prevent any disease, and is not a substitute for care from your doctor or a registered dietitian. Never change medication based on the app.',
    },
    {
      title: 'If something feels wrong',
      body:
        'For severe or sudden symptoms, contact your doctor or local emergency services — not the app.',
    },
  ],
];

/** Privacy, terms and the medical disclaimer — plain language, no small print. */
export function LegalScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Legal'>>();
  const [tab, setTab] = useState(route.params?.tab ?? 0);

  return (
    <Screen tabs gap={14}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.goBack()} />
        <Display size={26}>Privacy &amp; terms</Display>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {TABS.map((label, i) => (
          <Chip
            key={label}
            label={label}
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
              {section.title}
            </Text>
            <Text size={13.5} color={colors.muted} lineHeight={22}>
              {section.body}
            </Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
