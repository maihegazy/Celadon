import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme';

/**
 * The prototype draws its icons from bare `div`s rather than an icon font, and
 * the restraint is part of the look — so they're rebuilt here the same way,
 * shape for shape.
 */

/** Magnifier — circle plus a short angled handle. */
export function SearchIcon({ color = colors.green }: { color?: string }) {
  return (
    <View style={{ width: 16, height: 16 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          borderWidth: 2,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 0,
          bottom: 1,
          width: 7,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

/** Bell — a rounded dome over a bar. */
export function BellIcon({
  color = colors.green,
  width = 11,
  height = 10,
  barWidth = 15,
}: {
  color?: string;
  width?: number;
  height?: number;
  barWidth?: number;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 1 }}>
      <View
        style={{
          width,
          height,
          borderWidth: 2,
          borderBottomWidth: 0,
          borderColor: color,
          borderTopLeftRadius: 7,
          borderTopRightRadius: 7,
          borderBottomLeftRadius: 1,
          borderBottomRightRadius: 1,
        }}
      />
      <View style={{ width: barWidth, height: 2, borderRadius: 1, backgroundColor: color }} />
    </View>
  );
}

/** Bell at badge scale, used on the notifications permission screen. */
export function BellBadgeIcon({ color = colors.green }: { color?: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <View
        style={{
          width: 16,
          height: 15,
          borderWidth: 2.5,
          borderBottomWidth: 0,
          borderColor: color,
          borderTopLeftRadius: 9,
          borderTopRightRadius: 9,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
        }}
      />
      <View style={{ width: 22, height: 2.5, borderRadius: 2, backgroundColor: color }} />
    </View>
  );
}

/** Three ascending bars — the "your progress" tile. */
export function TrendIcon() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 10 }}>
      <View style={{ width: 4, height: 5, borderRadius: 2, backgroundColor: colors.greenSoft }} />
      <View style={{ width: 4, height: 8, borderRadius: 2, backgroundColor: colors.greenMid }} />
      <View style={{ width: 4, height: 10, borderRadius: 2, backgroundColor: colors.green }} />
    </View>
  );
}

/** Struck-through line used by the offline state. */
export function OfflineIcon() {
  return (
    <View
      style={{
        width: 22,
        height: 2.5,
        borderRadius: 2,
        backgroundColor: colors.faint,
        transform: [{ rotate: '-45deg' }],
      }}
    />
  );
}

/** Rotated square — the reintroduction marker. */
export function DiamondIcon({ color = colors.amber, size = 14 }: { color?: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        backgroundColor: color,
        transform: [{ rotate: '45deg' }],
      }}
    />
  );
}

/** The shutter ring inside the raised tab-bar scan button. */
export function ShutterIcon() {
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white }} />
    </View>
  );
}
