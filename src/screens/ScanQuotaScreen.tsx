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
import { useI18n } from '../i18n';
import { colors } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Free-tier scan limit. It states the limit plainly and always offers a way to
 * carry on without paying — logging the meal by hand.
 */
export function ScanQuotaScreen() {
  const navigation = useAppNavigation();
  const { t } = useI18n();

  return (
    <Screen scroll={false} center padding={28} gap={14}>
      <Pill
        label={t('quota.badge')}
        background={colors.sunken}
        color={colors.muted}
        size={12}
        style={{ alignSelf: 'flex-start' }}
      />
      <Display size={27}>{t('quota.title')}</Display>
      <Text size={14.5} color={colors.muted} lineHeight={22}>
        {t('quota.body', { count: FREE_SCANS_PER_WEEK })}
      </Text>

      <Card style={{ padding: 16, gap: 10 }}>
        <BulletRow color={colors.green}>{t('quota.point1')}</BulletRow>
        <BulletRow color={colors.green}>{t('quota.point2')}</BulletRow>
        <BulletRow color={colors.green}>{t('quota.point3')}</BulletRow>
      </Card>

      <PrimaryButton
        label={t('quota.cta')}
        style={{ marginTop: 4 }}
        onPress={() => navigation.navigate('Paywall')}
      />
      <OutlineButton
        label={t('quota.manual')}
        size={14.5}
        onPress={() => navigation.navigate('ManualAdd')}
      />
      <TextButton
        label={t('common.notNow')}
        color={colors.muted}
        style={{ alignSelf: 'center', padding: 4 }}
        onPress={() => navigation.navigate('Home')}
      />
    </Screen>
  );
}
