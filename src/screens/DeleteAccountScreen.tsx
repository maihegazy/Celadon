import React, { useState } from 'react';
import { View } from 'react-native';
import {
  BulletRow,
  Card,
  Display,
  OutlineButton,
  PrimaryButton,
  Screen,
  Strong,
  Text,
  TextButton,
} from '../components';
import { BackChevron } from '../components/Buttons';
import { useAuth, useAuthAction } from '../services/auth';
import { useAppState } from '../state/AppState';
import { useI18n } from '../i18n';
import type { TranslationKey } from '../i18n';
import { colors, radius } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Deletion, stated exactly. What goes, what doesn't, and the offer to export
 * first — no dark patterns on the way out.
 */
export function DeleteAccountScreen() {
  const navigation = useAppNavigation();
  const { dispatch } = useAppState();
  const { t, row } = useI18n();
  const { service } = useAuth();
  const { busy, run } = useAuthAction();
  const [error, setError] = useState<TranslationKey | null>(null);

  const confirmDelete = () =>
    run(async () => {
      setError(null);
      const result = await service.deleteAccount();
      if (!result.ok) {
        setError(result.messageKey);
        return;
      }
      // Signing out swaps the navigator back to the signed-out stack.
      dispatch({ type: 'reset' });
    });

  return (
    <Screen gap={14} paddingBottom={40}>
      <View style={{ flexDirection: row, alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('Profile')} />
        <Display size={26} style={{ flex: 1 }}>
          {t('delete.title')}
        </Display>
      </View>

      <Text size={14} color={colors.muted} lineHeight={22}>
        {t('delete.intro')}
      </Text>

      <Card style={{ padding: 16, gap: 10 }}>
        <BulletRow color={colors.red} size={13.5}>
          {t('delete.point1')}
        </BulletRow>
        <BulletRow color={colors.red} size={13.5}>
          {t('delete.point2')}
        </BulletRow>
        <BulletRow color={colors.faint} size={13.5}>
          {t('delete.point3')}
        </BulletRow>
      </Card>

      <View style={{ backgroundColor: colors.amberLight, borderRadius: radius.tile, paddingVertical: 14, paddingHorizontal: 16 }}>
        <Text size={13} color={colors.amberDeep} lineHeight={20}>
          <Strong>{t('delete.warning.strong')}</Strong> {t('delete.warning.body')}
        </Text>
      </View>

      <OutlineButton label={t('delete.export')} size={14.5} />

      {error ? (
        <View style={{ backgroundColor: colors.redLight, borderRadius: radius.tile, paddingVertical: 12, paddingHorizontal: 14 }}>
          <Text size={13.5} color={colors.red} lineHeight={20}>
            {t(error)}
          </Text>
        </View>
      ) : null}

      <PrimaryButton
        label={busy ? t('auth.working') : t('delete.confirm')}
        size={15}
        disabled={busy}
        style={{ backgroundColor: colors.red, paddingVertical: 15 }}
        onPress={confirmDelete}
      />

      <TextButton
        label={t('common.cancel')}
        color={colors.muted}
        style={{ alignSelf: 'center', padding: 4 }}
        onPress={() => navigation.navigate('Profile')}
      />
    </Screen>
  );
}
