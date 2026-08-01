import React, { useId } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { colors } from '../theme';
import { Text } from './Text';

/**
 * The Celadon leaf mark — a circle with one squared corner, rotated 45°.
 * (`border-radius:50% 50% 50% 0; transform:rotate(-45deg)` in the prototype.)
 */
export function LeafMark({ size = 22, color = colors.green }: { size?: number; color?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderTopLeftRadius: size / 2,
        borderTopRightRadius: size / 2,
        borderBottomRightRadius: size / 2,
        borderBottomLeftRadius: 0,
        transform: [{ rotate: '-45deg' }],
      }}
    />
  );
}

/** Leaf mark inside the pale circular badge used on intro / empty / success screens. */
export function LeafBadge({
  size = 56,
  leaf = 22,
  background = colors.greenLight,
  style,
}: {
  size?: number;
  leaf?: number;
  background?: string;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <LeafMark size={leaf} />
    </View>
  );
}

/**
 * The Celadon Score ring. The prototype paints it with a conic gradient and
 * masks the middle with a white disc; SVG gets the same result with a stroked
 * circle, and keeps the edges crisp at any size.
 */
export function ScoreRing({
  value,
  size,
  thickness,
  children,
  color = colors.green,
  track = colors.line,
  fill = colors.surface,
}: {
  /** 0–100. */
  value: number;
  size: number;
  thickness: number;
  children?: React.ReactNode;
  color?: string;
  track?: string;
  fill?: string;
}) {
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.max(0, Math.min(100, value)) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={thickness} fill={fill} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeDasharray={`${circumference * progress} ${circumference}`}
          // start the arc at 12 o'clock, like the conic gradient
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {/* Content is held inside the ring's opening so captions can't spill onto the stroke. */}
      <View
        style={{
          width: size - thickness * 2 - 6,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </View>
    </View>
  );
}

/** Score ring with the score + caption stacked inside it. */
export function ScoreDial({
  score,
  size = 92,
  thickness = 10,
  caption,
  scoreSize = 24,
}: {
  score: number;
  size?: number;
  thickness?: number;
  caption?: string;
  scoreSize?: number;
}) {
  return (
    <ScoreRing value={score} size={size} thickness={thickness}>
      <Text weight="bold" size={scoreSize} color={colors.greenDeep}>
        {score}
      </Text>
      {caption ? (
        <Text weight="semibold" size={9.5} color={colors.faint} numberOfLines={1} align="center">
          {caption}
        </Text>
      ) : null}
    </ScoreRing>
  );
}

/**
 * Diagonal hatch that stands in for food photography throughout the design
 * (`repeating-linear-gradient(45deg, …)`). Swap this for `<Image>` once real
 * photography lands — every call site passes a size, nothing else.
 */
export function Hatch({
  band = 6,
  colorA = colors.greenHatchA,
  colorB = colors.greenHatchB,
  radius = 0,
  style,
  children,
}: {
  /** Stripe width in points: 6 for thumbnails, 7 for cards, 8 for the hero. */
  band?: number;
  colorA?: string;
  colorB?: string;
  radius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}) {
  const id = `hatch-${useId()}`;
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', backgroundColor: colorA }, style]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id={id}
            width={band * 2}
            height={band * 2}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <Rect x={0} y={0} width={band} height={band * 2} fill={colorA} />
            <Rect x={band} y={0} width={band} height={band * 2} fill={colorB} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

/** Square meal thumbnail. */
export function MealThumb({ size = 56, radius = 12 }: { size?: number; radius?: number }) {
  return <Hatch band={6} radius={radius} style={{ width: size, height: size, flexShrink: 0 }} />;
}

/** Onboarding step indicator — nine bars that fill as you progress. */
export function StepBars({ total, current }: { total: number; current: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 5 }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            height: 4,
            flex: 1,
            borderRadius: 2,
            backgroundColor: current >= i ? colors.green : colors.borderSoft,
          }}
        />
      ))}
    </View>
  );
}

/** Segmented progress used by the reintroduction tracker (day n of 5). */
export function SegmentBar({ total, filled }: { total: number; filled: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 5 }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: i < filled ? colors.green : colors.line,
          }}
        />
      ))}
    </View>
  );
}

/** Horizontal meter — confidence bar, macro bars. */
export function Meter({
  value,
  width,
  height = 8,
  color = colors.green,
  track = colors.line,
  style,
}: {
  /** 0–1 */
  value: number;
  width?: number;
  height?: number;
  color?: string;
  track?: string;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          height,
          width,
          flex: width ? undefined : 1,
          borderRadius: height / 2,
          backgroundColor: track,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          height: '100%',
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}
