import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { colors, fonts, radius } from '../theme';

type FieldProps = TextInputProps & {
  /** `pill` is the rounded search/add input; `box` is the 14pt-radius form field. */
  shape?: 'box' | 'pill';
  containerStyle?: ViewStyle;
};

export function Field({ shape = 'box', style, containerStyle, ...rest }: FieldProps) {
  return (
    <View style={containerStyle}>
      <TextInput
        placeholderTextColor={colors.faint}
        {...rest}
        style={[styles.base, shape === 'pill' ? styles.pill : styles.box, style]}
      />
    </View>
  );
}

/** Multi-line note field — the optional "anything else you noticed?" box. */
export function NoteField({ style, ...rest }: TextInputProps) {
  return (
    <TextInput
      multiline
      textAlignVertical="top"
      placeholderTextColor={colors.faint}
      {...rest}
      style={[styles.base, styles.box, { height: 84, paddingTop: 14 }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: colors.ink,
  },
  box: {
    borderRadius: radius.tile,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pill: {
    borderRadius: radius.chip,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
});
