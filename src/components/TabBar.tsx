import { useNavigationState, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, overlay } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { useAppNavigation } from '../navigation/types';
import { ShutterIcon } from './Icons';
import { Text } from './Text';

type TabKey = Extract<keyof RootStackParamList, 'Home' | 'Plan' | 'Progress' | 'Profile'>;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'Home', label: 'Home' },
  { key: 'Plan', label: 'Meal Plan' },
  { key: 'Progress', label: 'Progress' },
  { key: 'Profile', label: 'Profile' },
];

/**
 * Five-slot bottom navigation with Scan raised as the primary action, over a
 * blurred translucent bar. `Meal Plan` and `Progress` sit either side of the
 * shutter, matching the approved layout.
 */
export function TabBar() {
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigationReady = useNavigationState((state) => state !== undefined);
  const active = route.name as keyof RootStackParamList;

  const go = (key: TabKey) => () => {
    if (key === active) return;
    navigation.navigate(key as never);
  };

  const item = ({ key, label }: { key: TabKey; label: string }) => {
    const isActive = active === key;
    return (
      <Pressable
        key={key}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        onPress={go(key)}
        style={styles.tab}
      >
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: isActive ? colors.green : colors.transparent,
          }}
        />
        <Text weight="semibold" size={12} color={isActive ? colors.greenDeep : colors.faint}>
          {label}
        </Text>
      </Pressable>
    );
  };

  if (!navigationReady) return null;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: overlay.tabBar }]} />
      ) : (
        <BlurView intensity={24} tint="light" style={StyleSheet.absoluteFill}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: overlay.tabBar }]} />
        </BlurView>
      )}
      {item(TABS[0])}
      {item(TABS[1])}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scan a meal"
        onPress={() => navigation.navigate('Scan')}
        style={({ pressed }) => [styles.scan, pressed && { opacity: 0.85 }]}
      >
        <ShutterIcon />
      </Pressable>
      {item(TABS[2])}
      {item(TABS[3])}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 12,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  scan: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: colors.greenDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});
