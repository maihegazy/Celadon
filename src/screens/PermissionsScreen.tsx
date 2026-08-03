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
import { useI18n } from '../i18n';
import { colors } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Two consent screens, asked in the app's own words before the OS prompt.
 * Both are genuinely skippable: "Not now" moves on with nothing enabled.
 */
export function PermissionsScreen() {
  const navigation = useAppNavigation();
  const [step, setStep] = useState<0 | 1>(0);
  const { t } = useI18n();

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
          <Display size={27}>{t('perms.notifications.title')}</Display>
          <Text size={14.5} color={colors.muted} lineHeight={22}>
            {t('perms.notifications.body')}
          </Text>
          <PrimaryButton label={t('perms.notifications.cta')} onPress={requestNotifications} style={{ marginTop: 6 }} />
          <OutlineButton label={t('common.notNow')} color={colors.muted} onPress={() => setStep(1)} />
        </>
      ) : (
        <>
          <LeafBadge />
          <Display size={27}>{t('perms.data.title')}</Display>
          <Text size={14.5} color={colors.muted} lineHeight={22}>
            {t('perms.data.body')}
          </Text>
          <Card style={{ padding: 16, gap: 10 }}>
            <BulletRow color={colors.green}>{t('perms.data.point1')}</BulletRow>
            <BulletRow color={colors.green}>{t('perms.data.point2')}</BulletRow>
            <BulletRow color={colors.green}>{t('perms.data.point3')}</BulletRow>
          </Card>
          <PrimaryButton
            label={t('perms.data.cta')}
            onPress={() => navigation.navigate('Home')}
            style={{ marginTop: 6 }}
          />
          <TextButton
            label={t('perms.data.privacy')}
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
