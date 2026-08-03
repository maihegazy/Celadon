import {
  createNavigationContainerRef,
  DefaultTheme,
  LinkingOptions,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef } from 'react';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

import { AuthLoadingScreen, AuthScreen } from '../screens/AuthScreen';
import { CelebrateScreen } from '../screens/CelebrateScreen';
import { CheckInScreen } from '../screens/CheckInScreen';
import { DeleteAccountScreen } from '../screens/DeleteAccountScreen';
import { DiaryScreen } from '../screens/DiaryScreen';
import { DoctorReportScreen } from '../screens/DoctorReportScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { GentleModeScreen } from '../screens/GentleModeScreen';
import { GroceryScreen } from '../screens/GroceryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LanguageScreen } from '../screens/LanguageScreen';
import { LegalScreen } from '../screens/LegalScreen';
import { ManualAddScreen } from '../screens/ManualAddScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { OfflineScreen } from '../screens/OfflineScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { PermissionsScreen } from '../screens/PermissionsScreen';
import { PlanScreen } from '../screens/PlanScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import { RecipesScreen } from '../screens/RecipesScreen';
import { ReintroductionScreen } from '../screens/ReintroductionScreen';
import { ScanConfirmScreen } from '../screens/ScanConfirmScreen';
import { ScanQuotaScreen } from '../screens/ScanQuotaScreen';
import { ScanResultScreen } from '../screens/ScanResultScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { TrialEndingScreen } from '../screens/TrialEndingScreen';
import { useAuth } from '../services/auth';
import { useAppState } from '../state/AppState';
import { useProfileSync } from '../state/useProfileSync';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    primary: colors.green,
    text: colors.ink,
    border: colors.line,
  },
};

/**
 * Deep links: `celadon://plan`, `celadon://scan`, and so on. Notification
 * taps ("lunch is coming up") land on the right screen, and every screen is
 * addressable when reviewing the build in a browser.
 */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'celadon://'],
  config: {
    screens: {
      Onboarding: 'onboarding',
      Auth: 'auth',
      Permissions: 'permissions',
      Home: 'home',
      Scan: 'scan',
      ScanConfirm: 'scan/confirm',
      ScanResult: 'scan/result',
      ScanQuota: 'scan/limit',
      Plan: 'plan',
      RecipeDetail: 'recipe/:name',
      Recipes: 'recipes',
      Grocery: 'grocery',
      Diary: 'diary',
      ManualAdd: 'diary/add',
      CheckIn: 'check-in',
      Celebrate: 'check-in/saved',
      Reintroduction: 'reintroduction',
      Progress: 'progress',
      DoctorReport: 'progress/report',
      Explore: 'explore',
      Notifications: 'notifications',
      Profile: 'profile',
      Paywall: 'premium',
      TrialEnding: 'premium/trial',
      GentleMode: 'settings/gentle-mode',
      Legal: 'legal',
      DeleteAccount: 'settings/delete-account',
      Language: 'settings/language',
      Offline: 'offline',
    },
  },
};

/**
 * One stack for the whole app. The five-slot tab bar is drawn by the screens
 * that show it (see `TAB_BAR_SCREENS`) rather than by a tab navigator — the
 * design keeps it visible on stacked screens like the shopping list, which a
 * nested tab navigator would hide.
 */
export function RootNavigator() {
  const { status } = useAuth();
  const { state, booted } = useAppState();
  // Reconciles the account's saved answers with what's in memory.
  const { ready: profileReady } = useProfileSync();

  const landingFor = (): keyof RootStackParamList => {
    if (status !== 'signedIn') return 'Onboarding';
    if (!state.onboardingComplete) return 'Onboarding';
    return state.permissionsSeen ? 'Home' : 'Permissions';
  };

  // Hold the UI until a stored session has been restored, so a signed-in user
  // never sees the sign-in screen flash past on launch.
  const settledStatus = useRef<typeof status | null>(null);
  useEffect(() => {
    if (status === 'loading') return;

    // The first resolve is just the app finding out where it stands — the
    // initial route and any deep link already handle that.
    if (settledStatus.current === null) {
      settledStatus.current = status;
      return;
    }
    if (settledStatus.current === status || !navigationRef.isReady()) return;
    settledStatus.current = status;

    // Signing in or out replaces the history rather than stacking on top of
    // it: after sign-up you land in the app, not back on the form behind it.
    navigationRef.reset({ index: 0, routes: [{ name: landingFor() }] });
  });

  // Deciding where to land needs the device flags and the account's answers;
  // guessing early would drop a returning user back into the assessment.
  if (status === 'loading' || !booted || !profileReady) return <AuthLoadingScreen />;

  const signedIn = status === 'signedIn';
  const landing = landingFor();

  return (
    <NavigationContainer ref={navigationRef} theme={theme} linking={linking}>
      <Stack.Navigator
        initialRouteName={landing}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        {/* Reachable either way: the assessment (Profile can re-enter it) and
            the terms (linked from the sign-up screen). */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Legal" component={LegalScreen} />

        {/* Auth exists only while signed out, so signing in unmounts it and
            the stack falls through to the app. */}
        {!signedIn ? <Stack.Screen name="Auth" component={AuthScreen} /> : null}

        {signedIn ? (
          <>
        <Stack.Screen name="Permissions" component={PermissionsScreen} options={{ animation: 'fade' }} />

        <Stack.Screen name="Home" component={HomeScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Scan" component={ScanScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ScanConfirm" component={ScanConfirmScreen} />
        <Stack.Screen name="ScanResult" component={ScanResultScreen} />
        <Stack.Screen name="ScanQuota" component={ScanQuotaScreen} options={{ animation: 'fade' }} />

        <Stack.Screen name="Plan" component={PlanScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
        <Stack.Screen name="Recipes" component={RecipesScreen} />
        <Stack.Screen name="Grocery" component={GroceryScreen} />
        <Stack.Screen name="Diary" component={DiaryScreen} />
        <Stack.Screen name="ManualAdd" component={ManualAddScreen} />

        <Stack.Screen name="CheckIn" component={CheckInScreen} />
        <Stack.Screen name="Celebrate" component={CelebrateScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Reintroduction" component={ReintroductionScreen} />
        <Stack.Screen name="Progress" component={ProgressScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="DoctorReport" component={DoctorReportScreen} />

        <Stack.Screen name="Explore" component={ExploreScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="TrialEnding" component={TrialEndingScreen} />
        <Stack.Screen name="GentleMode" component={GentleModeScreen} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
        <Stack.Screen name="Language" component={LanguageScreen} />
        <Stack.Screen name="Offline" component={OfflineScreen} options={{ animation: 'fade' }} />
          </>
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
