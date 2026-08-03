import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import {
  Display,
  Field,
  LeafBadge,
  NoteCard,
  OutlineButton,
  PrimaryButton,
  Screen,
  Strong,
  Text,
  TextButton,
  TintCard,
} from '../components';
import { useI18n } from '../i18n';
import type { TranslationKey } from '../i18n';
import { useAuth, useAuthAction, validateCredentials, validateEmail } from '../services/auth';
import { colors, radius } from '../theme';
import { RootStackParamList, useAppNavigation } from '../navigation/types';

type Mode = 'signin' | 'signup' | 'forgot' | 'confirm';

/**
 * Sign in / create account / reset password.
 *
 * Backed by `AuthService` — Supabase when configured, a device-only store
 * otherwise. Navigating on success is handled by the session listener in
 * `RootNavigator`, so these handlers only have to report failures.
 */
export function AuthScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Auth'>>();
  const { t, row } = useI18n();
  const { service } = useAuth();
  const { busy, run } = useAuthAction();

  const [mode, setMode] = useState<Mode>(route.params?.mode ?? 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<TranslationKey | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const go = (next: Mode) => {
    setError(null);
    setResetSent(false);
    setMode(next);
  };

  const submitSignIn = () =>
    run(async () => {
      setError(null);
      const invalid = validateCredentials(email, password);
      if (invalid) return setError(invalid.messageKey);

      const result = await service.signIn(email, password);
      if (!result.ok) setError(result.messageKey);
      // Success is picked up by the session listener.
    });

  const submitSignUp = () =>
    run(async () => {
      setError(null);
      const invalid = validateCredentials(email, password);
      if (invalid) return setError(invalid.messageKey);

      const result = await service.signUp(email, password);
      if (!result.ok) return setError(result.messageKey);
      // With email confirmation switched on there's no session yet — say so
      // plainly rather than dropping the user into a half-signed-in state.
      if (result.needsEmailConfirmation) setMode('confirm');
    });

  const submitReset = () =>
    run(async () => {
      setError(null);
      const invalid = validateEmail(email);
      if (invalid) return setError(invalid.messageKey);

      const result = await service.sendPasswordReset(email);
      if (result.ok) setResetSent(true);
      else setError(result.messageKey);
    });

  const withOAuth = (provider: 'apple' | 'google') => () =>
    run(async () => {
      setError(null);
      const result =
        provider === 'apple' ? await service.signInWithApple() : await service.signInWithGoogle();
      if (!result.ok) setError(result.messageKey);
    });

  return (
    <Screen scroll padding={28} paddingTop={0} gap={13} center keyboardAvoiding>
      <LeafBadge style={{ marginBottom: 2 }} />

      {mode === 'signin' ? (
        <>
          <Display size={30} lineHeight={35}>
            {t('auth.signIn.title')}
          </Display>
          <Text size={14.5} color={colors.muted} lineHeight={22}>
            {t('auth.signIn.subtitle')}
          </Text>
          <Field
            placeholder={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!busy}
          />
          <Field
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={submitSignIn}
            editable={!busy}
          />
          <ErrorNote messageKey={error} />
          <SubmitButton
            label={t('auth.signIn.cta')}
            busyLabel={t('auth.signingIn')}
            busy={busy}
            onPress={submitSignIn}
          />
          <OrDivider />
          <SocialButtons onApple={withOAuth('apple')} onGoogle={withOAuth('google')} disabled={busy} />
          <View style={{ flexDirection: row, justifyContent: 'space-between', marginTop: 2 }}>
            <TextButton label={t('auth.forgot')} color={colors.muted} size={13.5} onPress={() => go('forgot')} />
            <TextButton onPress={() => go('signup')}>
              <Text size={13.5} weight="medium" color={colors.muted}>
                {t('auth.newHere')} <Strong color={colors.green}>{t('auth.createAccount')}</Strong>
              </Text>
            </TextButton>
          </View>
          <ConfigNote />
        </>
      ) : null}

      {mode === 'signup' ? (
        <>
          <Display size={30} lineHeight={35}>
            {t('auth.signUp.title')}
          </Display>
          <Text size={14.5} color={colors.muted} lineHeight={22}>
            {t('auth.signUp.subtitle')}
          </Text>
          <Field
            placeholder={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!busy}
          />
          <Field
            placeholder={t('auth.choosePassword')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            onSubmitEditing={submitSignUp}
            editable={!busy}
          />
          <ErrorNote messageKey={error} />
          <SubmitButton
            label={t('auth.signUp.cta')}
            busyLabel={t('auth.creating')}
            busy={busy}
            onPress={submitSignUp}
          />
          <OrDivider />
          <SocialButtons onApple={withOAuth('apple')} onGoogle={withOAuth('google')} disabled={busy} />
          <Text size={12.5} color={colors.faint} align="center" lineHeight={19}>
            {t('auth.terms')}{' '}
            <Strong weight="semibold" color={colors.green} onPress={() => navigation.navigate('Legal', { tab: 1 })}>
              {t('auth.termsLink')}
            </Strong>
            .
          </Text>
          <TextButton onPress={() => go('signin')} style={{ paddingVertical: 4 }}>
            <Text size={13.5} weight="medium" color={colors.muted} align="center">
              {t('auth.haveAccount')} <Strong color={colors.green}>{t('auth.signIn.cta')}</Strong>
            </Text>
          </TextButton>
          <ConfigNote />
        </>
      ) : null}

      {mode === 'forgot' ? (
        <>
          <Display size={30} lineHeight={35}>
            {t('auth.reset.title')}
          </Display>
          <Text size={14.5} color={colors.muted} lineHeight={22}>
            {t('auth.reset.subtitle')}
          </Text>
          {resetSent ? (
            <TintCard
              style={{
                flexDirection: row,
                alignItems: 'center',
                gap: 10,
                padding: 14,
                borderRadius: radius.tile,
              }}
            >
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
                <Strong>{t('auth.reset.sentTitle')}</Strong> {t('auth.reset.sentBody')}
              </Text>
            </TintCard>
          ) : null}
          <Field
            placeholder={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onSubmitEditing={submitReset}
            editable={!busy}
          />
          <ErrorNote messageKey={error} />
          <SubmitButton
            label={t('auth.reset.cta')}
            busyLabel={t('auth.sending')}
            busy={busy}
            onPress={submitReset}
          />
          <TextButton
            label={t('auth.backToSignIn')}
            color={colors.muted}
            size={13.5}
            style={{ paddingVertical: 4 }}
            onPress={() => go('signin')}
          />
        </>
      ) : null}

      {mode === 'confirm' ? (
        <>
          <Display size={30} lineHeight={35}>
            {t('auth.confirm.title')}
          </Display>
          <Text size={14.5} color={colors.muted} lineHeight={22}>
            {t('auth.confirm.body', { email: email.trim() })}
          </Text>
          <TextButton
            label={t('auth.confirm.back')}
            color={colors.green}
            size={13.5}
            style={{ alignSelf: 'center', paddingVertical: 8 }}
            onPress={() => go('signin')}
          />
        </>
      ) : null}
    </Screen>
  );
}

/** Inline failure message, in the app's voice rather than the provider's. */
function ErrorNote({ messageKey }: { messageKey: TranslationKey | null }) {
  const { t } = useI18n();
  if (!messageKey) return null;
  return (
    <View
      style={{
        backgroundColor: colors.redLight,
        borderRadius: radius.tile,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      <Text size={13.5} color={colors.red} lineHeight={20}>
        {t(messageKey)}
      </Text>
    </View>
  );
}

/** Says plainly when this build has no backend behind it. */
function ConfigNote() {
  const { t } = useI18n();
  const { isConfigured } = useAuth();
  if (isConfigured) return null;
  return (
    <NoteCard style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
      <Text size={12.5} color={colors.muted} lineHeight={19}>
        {t('auth.localOnly')}
      </Text>
    </NoteCard>
  );
}

function SubmitButton({
  label,
  busyLabel,
  busy,
  onPress,
}: {
  label: string;
  busyLabel: string;
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <PrimaryButton
      label={busy ? busyLabel : label}
      size={15.5}
      disabled={busy}
      onPress={onPress}
      style={{ paddingVertical: 15 }}
    />
  );
}

function OrDivider() {
  const { t, row } = useI18n();
  return (
    <View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
      <Text size={12.5} color={colors.faint}>
        {t('auth.or')}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
    </View>
  );
}

function SocialButtons({
  onApple,
  onGoogle,
  disabled,
}: {
  onApple: () => void;
  onGoogle: () => void;
  disabled: boolean;
}) {
  const { t } = useI18n();
  return (
    <>
      <PrimaryButton
        label={t('auth.apple')}
        size={14.5}
        disabled={disabled}
        onPress={onApple}
        style={{ backgroundColor: colors.ink, paddingVertical: 14 }}
      />
      <OutlineButton
        label={t('auth.google')}
        size={14.5}
        color={colors.ink}
        background={colors.surface}
        onPress={disabled ? undefined : onGoogle}
      />
    </>
  );
}

/** Full-screen hold while a stored session is restored. */
export function AuthLoadingScreen() {
  const { t } = useI18n();
  return (
    <Screen scroll={false} center padding={40} gap={18} contentStyle={{ alignItems: 'center' }}>
      <LeafBadge size={72} leaf={28} />
      <Display size={24}>{t('loading.title')}</Display>
      <ActivityIndicator color={colors.green} />
    </Screen>
  );
}
