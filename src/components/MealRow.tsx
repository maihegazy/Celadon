import React from 'react';
import { Pressable, View } from 'react-native';
import { useI18n } from '../i18n';
import { colors, radius, tracking } from '../theme';
import { Hatch } from './Graphics';
import { Pill } from './Surfaces';
import { Text } from './Text';

/**
 * Meal card used on Home and in the day-one preview: thumbnail, slot label,
 * dish name, a light meta line and an optional status pill.
 */
export function MealRow({
  slot,
  name,
  meta,
  badge,
  onPress,
  thumbSize = 56,
  showThumbMark = true,
}: {
  slot: string;
  name: string;
  meta?: string;
  badge?: string;
  onPress?: () => void;
  thumbSize?: number;
  showThumbMark?: boolean;
}) {
  const { row } = useI18n();

  const body = (
    <View
      style={{
        flexDirection: row,
        gap: 12,
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.card,
        padding: 12,
      }}
    >
      <Hatch
        band={6}
        radius={radius.thumb}
        style={{ width: thumbSize, height: thumbSize, flexShrink: 0 }}
      >
        {showThumbMark ? (
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: colors.greenSoft }} />
        ) : null}
      </Hatch>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          weight="semibold"
          size={11.5}
          color={colors.faint}
          style={{ letterSpacing: tracking(11.5, 0.07), textTransform: 'uppercase' }}
        >
          {slot}
        </Text>
        <Text weight="semibold" size={15} style={{ marginTop: 1 }}>
          {name}
        </Text>
        {meta ? (
          <Text size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
            {meta}
          </Text>
        ) : null}
      </View>
      {badge ? <Pill label={badge} weight="semibold" size={12} style={{ flexShrink: 0 }} /> : null}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}>
      {body}
    </Pressable>
  );
}
