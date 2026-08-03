import React from 'react';
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
import { useAppState } from '../state/AppState';
import { useI18n } from '../i18n';
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

      <PrimaryButton
        label={t('delete.confirm')}
        size={15}
        style={{ backgroundColor: colors.red, paddingVertical: 15 }}
        onPress={() => {
          dispatch({ type: 'reset' });
          navigation.reset({ index: 0, routes: [{ name: 'Auth', params: { mode: 'signin' } }] });
        }}
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
