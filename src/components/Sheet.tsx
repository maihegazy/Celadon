import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, overlay, radius, shadow } from '../theme';
import { Text } from './Text';

/**
 * Bottom sheet — used for "Swap this meal". Rendered inside the screen and
 * painted above the tab bar, exactly as the prototype layers it.
 */
export function BottomSheet({
  visible,
  onDismiss,
  children,
}: {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  return (
    <View style={styles.layer} pointerEvents="box-none">
      <Pressable accessibilityLabel="Dismiss" style={StyleSheet.absoluteFill} onPress={onDismiss}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: overlay.scrim }]} />
      </Pressable>
      <View style={[styles.panel, shadow.sheet, { paddingBottom: Math.max(insets.bottom, 20) + 14 }]}>
        <View style={styles.handle} />
        {children}
      </View>
    </View>
  );
}

/**
 * Centred dialog — the camera priming prompt. Shown before the OS permission
 * sheet so the ask is explained in Celadon's own words first.
 */
export function CenterDialog({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  if (!visible) return null;
  return (
    <View style={[styles.layer, styles.dialogLayer]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: overlay.dialogScrim }]} />
      <View style={styles.dialog}>{children}</View>
    </View>
  );
}

export function SheetTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text weight="serif" size={20} lineHeight={26}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 40,
  },
  dialogLayer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    zIndex: 50,
  },
  panel: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: overlay.sheetHandle,
    alignSelf: 'center',
    marginBottom: 4,
  },
  dialog: {
    backgroundColor: colors.bg,
    borderRadius: radius.cardLg,
    paddingVertical: 22,
    paddingHorizontal: 20,
    maxWidth: 280,
    alignItems: 'center',
  },
});
