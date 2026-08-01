import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors } from '../theme';
import { BackChevron } from './Buttons';
import { Display, Text } from './Text';

/**
 * The "‹ Title" header shared by every stacked screen, with an optional
 * subtitle and a trailing slot for actions.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  trailing,
  align = 'center',
  style,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
  /** `top` when the title wraps to two lines beside the chevron. */
  align?: 'center' | 'top';
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: align === 'center' ? 'center' : 'flex-start', gap: 12, paddingTop: 6 },
        style,
      ]}
    >
      {onBack ? <BackChevron onPress={onBack} /> : null}
      <View style={{ flex: 1 }}>
        <Display size={26}>{title}</Display>
        {subtitle ? (
          <Text size={13} color={colors.faint} style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

/** Header with no back affordance — the tab-root screens. */
export function PageTitle({
  title,
  trailing,
  style,
}: {
  title: string;
  trailing?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
        style,
      ]}
    >
      <Display size={26}>{title}</Display>
      {trailing}
    </View>
  );
}
