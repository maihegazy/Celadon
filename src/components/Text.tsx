import React from 'react';
import { Platform, StyleSheet, Text as RNText, TextProps as RNTextProps } from 'react-native';
import { colors, fonts, FontWeightToken } from '../theme';

export type TextProps = RNTextProps & {
  weight?: FontWeightToken;
  /** Font size in points; line height follows unless `lineHeight` is given. */
  size?: number;
  color?: string;
  lineHeight?: number;
  align?: 'left' | 'center' | 'right';
  /** Monospace — used for the "camera viewfinder"/"meal photo" placeholder captions. */
  mono?: boolean;
};

const monoFamily = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

/**
 * Every piece of copy in the app goes through here so the two families are
 * applied consistently — RN gives no font inheritance.
 */
export function Text({
  weight = 'regular',
  size = 14,
  color = colors.ink,
  lineHeight,
  align,
  mono,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      {...rest}
      style={StyleSheet.flatten([
        {
          fontFamily: mono ? monoFamily : fonts[weight],
          fontSize: size,
          color,
          ...(lineHeight ? { lineHeight } : null),
          ...(align ? { textAlign: align } : null),
        },
        style,
      ])}
    />
  );
}

/** Lora display heading — the prototype's `font-family:Lora,serif` blocks. */
export function Display({ size = 26, lineHeight, ...rest }: TextProps) {
  return <Text weight="serif" size={size} lineHeight={lineHeight ?? Math.round(size * 1.2)} {...rest} />;
}

/**
 * Bold run *inside* a paragraph (`<b>` in the prototype). Unlike `Text` it
 * deliberately leaves size and colour unset so it inherits from the Text
 * around it — only the family changes.
 */
export function Strong({
  weight = 'bold',
  size,
  color,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      {...rest}
      style={StyleSheet.flatten([
        {
          fontFamily: fonts[weight],
          ...(size ? { fontSize: size } : null),
          ...(color ? { color } : null),
        },
        style,
      ])}
    />
  );
}
