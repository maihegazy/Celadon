import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';
import { Text } from './Text';

type BaseProps = {
  label?: string;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  size?: number;
};

const pressed = (isPressed: boolean): ViewStyle => ({ opacity: isPressed ? 0.75 : 1 });

/** Solid celadon call-to-action. */
export function PrimaryButton({ label, onPress, style, disabled, size = 16 }: BaseProps & { label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed: p }) => [styles.primary, pressed(p), disabled && { opacity: 0.5 }, style]}
    >
      <Text weight="semibold" size={size} color={colors.white}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Outlined button — "Back", "Not now", "Regenerate this week". */
export function OutlineButton({
  label,
  onPress,
  style,
  color = colors.green,
  size = 15,
  background = colors.transparent,
  borderColor = colors.border,
}: BaseProps & { label: string; color?: string; background?: string; borderColor?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed: p }) => [
        styles.outline,
        { backgroundColor: background, borderColor },
        pressed(p),
        style,
      ]}
    >
      <Text weight="semibold" size={size} color={color}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Bare text button. */
export function TextButton({
  label,
  onPress,
  style,
  color = colors.muted,
  size = 14,
  weight = 'semibold',
  children,
}: BaseProps & {
  color?: string;
  weight?: 'semibold' | 'medium';
  children?: React.ReactNode;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed: p }) => [pressed(p), style]}>
      {children ?? (
        <Text weight={weight} size={size} color={color}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** Small pill button — "Rescan", "Swap", "Share", "Recipes". */
export function SmallButton({
  label,
  onPress,
  style,
  color = colors.green,
  background = colors.surface,
  borderColor = colors.border,
  size = 13,
}: BaseProps & { label: string; color?: string; background?: string; borderColor?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed: p }) => [
        styles.small,
        { backgroundColor: background, borderColor },
        pressed(p),
        style,
      ]}
    >
      <Text weight="semibold" size={size} color={color}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Selectable chip — the multi/single-select control used all over onboarding. */
export function Chip({
  label,
  selected,
  onPress,
  style,
  size = 14.5,
  paddingVertical = 11,
  paddingHorizontal = 18,
}: {
  label: string;
  selected: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  size?: number;
  paddingVertical?: number;
  paddingHorizontal?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed: p }) => [
        styles.chip,
        {
          paddingVertical,
          paddingHorizontal,
          backgroundColor: selected ? colors.greenDeep : colors.surface,
          borderColor: selected ? colors.greenDeep : colors.border,
        },
        pressed(p),
        style,
      ]}
    >
      <Text weight={size <= 13 ? 'semibold' : 'medium'} size={size} color={selected ? colors.white : colors.ink}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Chevron-only back control ("‹") used by the stacked screens. */
export function BackChevron({ onPress, color = colors.muted }: { onPress?: () => void; color?: string }) {
  const { t, chevronBack } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      onPress={onPress}
      hitSlop={12}
      style={({ pressed: p }) => pressed(p)}
    >
      <Text weight="semibold" size={26} color={color} lineHeight={30}>
        {chevronBack}
      </Text>
    </Pressable>
  );
}

/** Radio dot used by single-select option cards. */
export function RadioDot({ selected }: { selected: boolean }) {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: selected ? colors.green : colors.border,
        backgroundColor: selected ? colors.green : colors.transparent,
        flexShrink: 0,
      }}
    />
  );
}

/** Square check used by the scan ingredient list and the shopping list. */
export function CheckBox({
  checked,
  size = 20,
  borderRadius = radius.check,
  showMark = true,
  onPress,
}: {
  checked: boolean;
  size?: number;
  borderRadius?: number;
  /** The scan ingredient list fills the box without a tick, as designed. */
  showMark?: boolean;
  onPress?: () => void;
}) {
  const box = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        borderWidth: 2,
        borderColor: checked ? colors.green : colors.border,
        backgroundColor: checked ? colors.green : colors.transparent,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {checked && showMark ? (
        <Text weight="bold" size={size * 0.6} color={colors.white}>
          ✓
        </Text>
      ) : null}
    </View>
  );
  if (!onPress) return box;
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} hitSlop={8}>
      {box}
    </Pressable>
  );
}

/** Selectable option card (radio-style) — onboarding goals, activity, comfort mode. */
export function OptionCard({
  selected,
  onPress,
  children,
  style,
  padding = 16,
}: {
  selected: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed: p }) => [
        styles.optionCard,
        {
          padding,
          backgroundColor: selected ? colors.greenLight : colors.surface,
          borderColor: selected ? colors.green : colors.border,
        },
        pressed(p),
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: colors.green,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCard: {
    borderWidth: 1.5,
    borderRadius: radius.tile,
  },
});
