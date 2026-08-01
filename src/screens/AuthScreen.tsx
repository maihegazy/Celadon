import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Display,
  Field,
  LeafBadge,
  OutlineButton,
  PrimaryButton,
  Screen,
  Strong,
  Text,
  TextButton,
  TintCard,
} from '../components';
import { colors, radius } from '../theme';
import { RootStackParamList, useAppNavigation } from '../navigation/types';

type Mode = 'signin' | 'signup' | 'forgot';

/**
 * Sign in / create account / reset. Social buttons are present as designed;
 * wiring them to Apple and Google auth is a backend task, so they're inert
 * here rather than pretending to work.
 */
export function AuthScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Auth'>>();
  const [mode, setMode] = useState<Mode>(route.params?.mode ?? 'signin');
  const [resetSent, setResetSent] = useState(false);

  return (
    <Screen scroll padding={28} paddingTop={0} gap={13} center keyboardAvoiding>
      <LeafBadge style={{ marginBottom: 2 }} />

      {mode === 'signin' ? (
        <>
          <Display size={30} lineHeight={35}>
            Welcome back.
          </Display>
          <Text size={14.5} color={colors.muted} lineHeight={22}>
            Your plan and progress are right where you left them.
          </Text>
          <Field placeholder="Email" autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
          <Field placeholder="Password" secureTextEntry textContentType="password" />
          <PrimaryButton label="Sign in" size={15.5} style={{ paddingVertical: 15 }} onPress={() => navigation.navigate('Home')} />
          <OrDivider />
          <SocialButtons />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
            <TextButton
              label="Forgot password?"
              color={colors.muted}
              size={13.5}
              onPress={() => {
                setResetSent(false);
                setMode('forgot');
              }}
            />
            <TextButton onPress={() => setMode('signup')}>
              <Text size={13.5} weight="medium" color={colors.muted}>
                New here? <Strong color={colors.green}>Create account</Strong>
              </Text>
            </TextButton>
          </View>
        </>
      ) : null}

      {mode === 'signup' ? (
        <>
          <Display size={30} lineHeight={35}>
            Let's get you set up.
          </Display>
          <Text size={14.5} color={colors.muted} lineHeight={22}>
            One account — both languages, all your devices.
          </Text>
          <Field placeholder="Email" autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
          <Field placeholder="Choose a password" secureTextEntry textContentType="newPassword" />
          <PrimaryButton
            label="Create account"
            size={15.5}
            style={{ paddingVertical: 15 }}
            onPress={() => navigation.navigate('Onboarding', { step: 1 })}
          />
          <OrDivider />
          <SocialButtons />
          <Text size={12.5} color={colors.faint} align="center" lineHeight={19}>
            By continuing you agree to our{' '}
            <Strong weight="semibold" color={colors.green} onPress={() => navigation.navigate('Legal', { tab: 1 })}>
              Terms &amp; privacy
            </Strong>
            .
          </Text>
          <TextButton onPress={() => setMode('signin')} style={{ paddingVertical: 4 }}>
            <Text size={13.5} weight="medium" color={colors.muted}>
              Have an account? <Strong color={colors.green}>Sign in</Strong>
            </Text>
          </TextButton>
        </>
      ) : null}

      {mode === 'forgot' ? (
        <>
          <Display size={30} lineHeight={35}>
            Reset your password
          </Display>
          <Text size={14.5} color={colors.muted} lineHeight={22}>
            We'll email you a link — it expires in one hour.
          </Text>
          {resetSent ? (
            <TintCard style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.tile }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.green,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text weight="bold" size={12} color={colors.white}>
                  ✓
                </Text>
              </View>
              <Text size={13.5} color={colors.greenDeep} lineHeight={20} style={{ flex: 1 }}>
                <Strong>Sent.</Strong> Check your inbox — and spam, just in case.
              </Text>
            </TintCard>
          ) : null}
          <Field placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
          <PrimaryButton
            label="Send reset link"
            size={15.5}
            style={{ paddingVertical: 15 }}
            onPress={() => setResetSent(true)}
          />
          <TextButton
            label="‹ Back to sign in"
            color={colors.muted}
            size={13.5}
            style={{ paddingVertical: 4 }}
            onPress={() => {
              setResetSent(false);
              setMode('signin');
            }}
          />
        </>
      ) : null}
    </Screen>
  );
}

function OrDivider() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
      <Text size={12.5} color={colors.faint}>
        or
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
    </View>
  );
}

function SocialButtons() {
  return (
    <>
      <PrimaryButton
        label="Continue with Apple"
        size={14.5}
        style={{ backgroundColor: colors.ink, paddingVertical: 14 }}
      />
      <OutlineButton
        label="Continue with Google"
        size={14.5}
        color={colors.ink}
        background={colors.surface}
      />
    </>
  );
}
