import * as Notifications from 'expo-notifications';
import React, { useState } from 'react';
import { View } from 'react-native';
import {
  BulletRow,
  Card,
  Display,
  LeafBadge,
  OutlineButton,
  PrimaryButton,
  Screen,
  Text,
  TextButton,
} from '../components';
import { BellBadgeIcon } from '../components/Icons';
import { colors } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Two consent screens, asked in the app's own words before the OS prompt.
 * Both are genuinely skippable: "Not now" moves on with nothing enabled.
 */
export function PermissionsScreen() {
  const navigation = useAppNavigation();
  const [step, setStep] = useState<0 | 1>(0);

  const requestNotifications = async () => {
    try {
      await Notifications.requestPermissionsAsync();
    } catch {
      // Declining, or an unsupported environment, is not an error worth
      // interrupting onboarding for — reminders simply stay off.
    }
    setStep(1);
  };

  return (
    <Screen scroll={false} center padding={28} gap={15}>
      {step === 0 ? (
        <>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.greenLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BellBadgeIcon />
          </View>
          <Display size={27}>Gentle reminders, if you want them</Display>
          <Text size={14.5} color={colors.muted} lineHeight={22}>
            A nudge before meals and a weekly reflection. Never streak pressure, never guilt — and you can quiet
            them anytime.
          </Text>
          <PrimaryButton label="Enable notifications" onPress={requestNotifications} style={{ marginTop: 6 }} />
          <OutlineButton label="Not now" color={colors.muted} onPress={() => setStep(1)} />
        </>
      ) : (
        <>
          <LeafBadge />
          <Display size={27}>Your health data, your call</Display>
          <Text size={14.5} color={colors.muted} lineHeight={22}>
            Celadon stores your answers only to personalize your meals and insights.
          </Text>
          <Card style={{ padding: 16, gap: 10 }}>
            <BulletRow color={colors.green}>We never sell your data or show ads</BulletRow>
            <BulletRow color={colors.green}>Export or delete everything, anytime</BulletRow>
            <BulletRow color={colors.green}>Meal photos are analyzed, not kept</BulletRow>
          </Card>
          <PrimaryButton
            label="I understand — continue"
            onPress={() => navigation.navigate('Home')}
            style={{ marginTop: 6 }}
          />
          <TextButton
            label="Read the privacy policy"
            color={colors.green}
            size={13.5}
            style={{ alignSelf: 'center', padding: 4 }}
            onPress={() => navigation.navigate('Legal', { tab: 0 })}
          />
        </>
      )}
    </Screen>
  );
}
