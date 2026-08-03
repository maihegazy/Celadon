import {
  AlbertSans_400Regular,
  AlbertSans_500Medium,
  AlbertSans_600SemiBold,
  AlbertSans_700Bold,
} from '@expo-google-fonts/albert-sans';
import { Lora_500Medium, Lora_600SemiBold, useFonts } from '@expo-google-fonts/lora';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { I18nProvider } from './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/services/auth';
import { MealAnalysisProvider } from './src/services/mealAnalysis';
import { ProfileProvider } from './src/services/profile';
import { AppStateProvider } from './src/state/AppState';
import { colors } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Nothing to do if the splash screen is already hidden.
});

export default function App() {
  const [fontsLoaded] = useFonts({
    AlbertSans_400Regular,
    AlbertSans_500Medium,
    AlbertSans_600SemiBold,
    AlbertSans_700Bold,
    Lora_500Medium,
    Lora_600SemiBold,
  });

  const onReady = useCallback(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onReady}>
      <SafeAreaProvider>
        <I18nProvider>
          <AuthProvider>
            <ProfileProvider>
              <AppStateProvider>
                <MealAnalysisProvider>
                  <StatusBar style="dark" />
                  <SafeTop>
                    <RootNavigator />
                  </SafeTop>
                </MealAnalysisProvider>
              </AppStateProvider>
            </ProfileProvider>
          </AuthProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * The design reserves a fixed strip under the status bar on every screen; on
 * device that's the top safe-area inset. Applying it once here keeps each
 * screen's own padding identical to the prototype's.
 */
function SafeTop({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.root, { paddingTop: insets.top }]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
