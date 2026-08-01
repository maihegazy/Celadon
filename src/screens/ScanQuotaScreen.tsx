import React from 'react';
import {
  BulletRow,
  Card,
  Display,
  OutlineButton,
  Pill,
  PrimaryButton,
  Screen,
  Text,
  TextButton,
} from '../components';
import { FREE_SCANS_PER_WEEK } from '../data/content';
import { colors } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Free-tier scan limit. It states the limit plainly and always offers a way to
 * carry on without paying — logging the meal by hand.
 */
export function ScanQuotaScreen() {
  const navigation = useAppNavigation();

  return (
    <Screen scroll={false} center padding={28} gap={14}>
      <Pill
        label="Free plan"
        background={colors.sunken}
        color={colors.muted}
        size={12}
        style={{ alignSelf: 'flex-start' }}
      />
      <Display size={27}>That's this week's free scans</Display>
      <Text size={14.5} color={colors.muted} lineHeight={22}>
        Free includes {FREE_SCANS_PER_WEEK} photo scans a week — they reset Monday. Premium removes the limit.
      </Text>

      <Card style={{ padding: 16, gap: 10 }}>
        <BulletRow color={colors.green}>Unlimited meal scanning</BulletRow>
        <BulletRow color={colors.green}>Adaptive weekly plans</BulletRow>
        <BulletRow color={colors.green}>Pattern detection &amp; doctor reports</BulletRow>
      </Card>

      <PrimaryButton
        label="See Premium plans"
        style={{ marginTop: 4 }}
        onPress={() => navigation.navigate('Paywall')}
      />
      <OutlineButton
        label="Log this meal manually"
        size={14.5}
        onPress={() => navigation.navigate('ManualAdd')}
      />
      <TextButton
        label="Not now"
        color={colors.muted}
        style={{ alignSelf: 'center', padding: 4 }}
        onPress={() => navigation.navigate('Home')}
      />
    </Screen>
  );
}
