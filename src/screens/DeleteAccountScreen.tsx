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
import { colors, radius } from '../theme';
import { useAppNavigation } from '../navigation/types';

/**
 * Deletion, stated exactly. What goes, what doesn't, and the offer to export
 * first — no dark patterns on the way out.
 */
export function DeleteAccountScreen() {
  const navigation = useAppNavigation();
  const { dispatch } = useAppState();

  return (
    <Screen gap={14} paddingBottom={40}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6 }}>
        <BackChevron onPress={() => navigation.navigate('Profile')} />
        <Display size={26} style={{ flex: 1 }}>
          Delete your account?
        </Display>
      </View>

      <Text size={14} color={colors.muted} lineHeight={22}>
        We're sorry to see you go. Here's exactly what deletion means:
      </Text>

      <Card style={{ padding: 16, gap: 10 }}>
        <BulletRow color={colors.red} size={13.5}>
          Profile and health answers — erased
        </BulletRow>
        <BulletRow color={colors.red} size={13.5}>
          Diary, scans and check-ins — erased
        </BulletRow>
        <BulletRow color={colors.faint} size={13.5}>
          Subscription — cancel separately in your app store
        </BulletRow>
      </Card>

      <View style={{ backgroundColor: colors.amberLight, borderRadius: radius.tile, paddingVertical: 14, paddingHorizontal: 16 }}>
        <Text size={13} color={colors.amberDeep} lineHeight={20}>
          <Strong>This is immediate and permanent.</Strong> If you might want your history later, export it first.
        </Text>
      </View>

      <OutlineButton label="Export my data first" size={14.5} />

      <PrimaryButton
        label="Delete permanently"
        size={15}
        style={{ backgroundColor: colors.red, paddingVertical: 15 }}
        onPress={() => {
          dispatch({ type: 'reset' });
          navigation.reset({ index: 0, routes: [{ name: 'Auth', params: { mode: 'signin' } }] });
        }}
      />

      <TextButton
        label="Cancel"
        color={colors.muted}
        style={{ alignSelf: 'center', padding: 4 }}
        onPress={() => navigation.navigate('Profile')}
      />
    </Screen>
  );
}
