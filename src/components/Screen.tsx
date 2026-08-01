import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors, TAB_BAR_CONTENT_INSET } from '../theme';
import { TabBar } from './TabBar';

type ScreenProps = {
  children: React.ReactNode;
  /** Scrolling content (most screens) vs. a fixed, vertically centred layout. */
  scroll?: boolean;
  /** Render the floating tab bar and reserve room for it. */
  tabs?: boolean;
  /** Horizontal padding; the design uses 20 for tab screens and 28 for full-bleed flows. */
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  gap?: number;
  /** Centre the content block vertically — intro, permissions, quota, offline. */
  center?: boolean;
  background?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Overlays (bottom sheets, priming dialogs) paint above the tab bar. */
  overlay?: React.ReactNode;
  keyboardAvoiding?: boolean;
};

export function Screen({
  children,
  scroll = true,
  tabs = false,
  padding = 20,
  paddingTop = 20,
  paddingBottom,
  gap = 16,
  center = false,
  background = colors.bg,
  style,
  contentStyle,
  overlay,
  keyboardAvoiding = false,
}: ScreenProps) {
  const bottom = paddingBottom ?? (tabs ? TAB_BAR_CONTENT_INSET : 32);

  const content = center ? (
    <View
      style={[
        styles.centered,
        { paddingHorizontal: padding, paddingTop, paddingBottom: bottom, gap },
        contentStyle,
      ]}
    >
      {children}
    </View>
  ) : scroll ? (
    <ScrollView
      style={styles.flex}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        { paddingHorizontal: padding, paddingTop, paddingBottom: bottom, gap },
        contentStyle,
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        { paddingHorizontal: padding, paddingTop, paddingBottom: bottom, gap },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  const body = keyboardAvoiding ? (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <View style={[styles.flex, { backgroundColor: background }, style]}>
      {body}
      {tabs ? <TabBar /> : null}
      {overlay}
    </View>
  );
}

/** Screen that fills edge to edge (camera, recipe hero) — no padding applied. */
export function BareScreen({
  children,
  background = colors.bg,
  style,
}: {
  children: React.ReactNode;
  background?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.flex, { backgroundColor: background }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center' },
});
