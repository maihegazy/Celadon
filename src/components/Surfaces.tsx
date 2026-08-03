import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { useI18n } from '../i18n';
import { colors, radius } from '../theme';
import { Text } from './Text';

/** White card with the standard hairline border. */
export function Card({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.card, style]} />;
}

/** Dashed-border card used for every empty state in the prototype. */
export function EmptyCard({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.emptyCard, style]} />;
}

/** Tinted celadon panel — "Why this week works", substitutions, confirmations. */
export function TintCard({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.tint, style]} />;
}

/** Neutral panel used for disclaimers and gentle-mode notices. */
export function NoteCard({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.note, style]} />;
}

/** Deep-green feature card (today's focus, weekly insight). */
export function FeatureCard({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.feature, style]} />;
}

/** Uppercase tracked section label. */
export function SectionLabel({
  children,
  style,
  size = 13,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  size?: 12 | 13;
}) {
  return (
    <View style={style}>
      <Text
        weight="bold"
        size={size}
        color={colors.faint}
        style={{ letterSpacing: size * 0.07, textTransform: 'uppercase' }}
      >
        {children}
      </Text>
    </View>
  );
}

/** Small round marker that opens most list rows in the design. */
export function Dot({
  color,
  size = 10,
  style,
}: {
  color: string;
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, flexShrink: 0 },
        style,
      ]}
    />
  );
}

/** Dot + copy row — the shape used by every "what we do / don't do" list. */
export function BulletRow({
  color,
  children,
  size = 14,
}: {
  color: string;
  children: React.ReactNode;
  size?: number;
}) {
  const { row } = useI18n();
  return (
    <View style={{ flexDirection: row, gap: 12, alignItems: 'flex-start' }}>
      <Dot color={color} style={{ marginTop: 4 }} />
      <Text size={size} color={colors.inkSoft} lineHeight={Math.round(size * 1.5)} style={{ flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}

/** Rounded status pill (Supportive / High confidence / 25 min / …). */
export function Pill({
  label,
  background = colors.greenLight,
  color = colors.green,
  weight = 'bold',
  size = 12.5,
  style,
}: {
  label: string;
  background?: string;
  color?: string;
  weight?: 'bold' | 'semibold';
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: background }, style]}>
      <Text weight={weight} size={size} color={color}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.card,
  },
  tint: {
    backgroundColor: colors.greenLight,
    borderRadius: radius.card,
  },
  note: {
    backgroundColor: colors.sunken,
    borderRadius: radius.tile,
  },
  feature: {
    backgroundColor: colors.greenDeep,
    borderRadius: radius.cardLg,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
