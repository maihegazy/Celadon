import React from 'react';
import { View } from 'react-native';
import { Display, PrimaryButton, Screen, Text } from '../components';
import { OfflineIcon } from '../components/Icons';
import { useI18n } from '../i18n';
import { colors } from '../theme';
import { useAppNavigation } from '../navigation/types';

/** Offline state — reassuring, because nothing local is actually lost. */
export function OfflineScreen() {
  const navigation = useAppNavigation();
  const { t } = useI18n();

  return (
    <Screen scroll={false} center padding={40} gap={14} contentStyle={{ alignItems: 'center' }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.sunken,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <OfflineIcon />
      </View>
      <Display size={24}>{t('offline.title')}</Display>
      <Text size={14} color={colors.muted} lineHeight={22} align="center" style={{ maxWidth: 280 }}>
        {t('offline.body')}
      </Text>
      <PrimaryButton
        label={t('common.tryAgain')}
        size={15}
        style={{ paddingHorizontal: 36, paddingVertical: 15, marginTop: 6 }}
        onPress={() => navigation.navigate('Home')}
      />
      <Text size={12.5} color={colors.faint}>
        {t('offline.lastSync')}
      </Text>
    </Screen>
  );
}
