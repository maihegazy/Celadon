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
import { useI18n } from '../i18n';
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
  const { t, row } = useI18n();

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
          <Field placeholder={t('auth.email')} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
          <Field placeholder={t('auth.password')} secureTextEntry textContentType="password" />
          <PrimaryButton label={t('auth.signIn.cta')} size={15.5} style={{ paddingVertical: 15 }} onPress={() => navigation.navigate('Home')} />
          <OrDivider />
          <SocialButtons />
          <View style={{ flexDirection: row, justifyContent: 'space-between', marginTop: 2 }}>
            <TextButton
              label={t('auth.forgot')}
              color={colors.muted}
              size={13.5}
              onPress={() => {
                setResetSent(false);
                setMode('forgot');
              }}
            />
            <TextButton onPress={() => setMode('signup')}>
              <Text size={13.5} weight="medium" color={colors.muted}>
                {t('auth.newHere')} <Strong color={colors.green}>{t('auth.createAccount')}</Strong>
              </Text>
            </TextButton>
          </View>
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
          <Field placeholder={t('auth.email')} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
          <Field placeholder={t('auth.choosePassword')} secureTextEntry textContentType="newPassword" />
          <PrimaryButton
            label={t('auth.signUp.cta')}
            size={15.5}
            style={{ paddingVertical: 15 }}
            onPress={() => navigation.navigate('Onboarding', { step: 1 })}
          />
          <OrDivider />
          <SocialButtons />
          <Text size={12.5} color={colors.faint} align="center" lineHeight={19}>
            {t('auth.terms')}{' '}
            <Strong weight="semibold" color={colors.green} onPress={() => navigation.navigate('Legal', { tab: 1 })}>
              {t('auth.termsLink')}
            </Strong>
            .
          </Text>
          <TextButton onPress={() => setMode('signin')} style={{ paddingVertical: 4 }}>
            <Text size={13.5} weight="medium" color={colors.muted}>
              {t('auth.haveAccount')} <Strong color={colors.green}>{t('auth.signIn.cta')}</Strong>
            </Text>
          </TextButton>
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
            <TintCard style={{ flexDirection: row, alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.tile }}>
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
          <Field placeholder={t('auth.email')} autoCapitalize="none" keyboardType="email-address" />
          <PrimaryButton
            label={t('auth.reset.cta')}
            size={15.5}
            style={{ paddingVertical: 15 }}
            onPress={() => setResetSent(true)}
          />
          <TextButton
            label={t('auth.backToSignIn')}
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

function SocialButtons() {
  const { t } = useI18n();
  return (
    <>
      <PrimaryButton
        label={t('auth.apple')}
        size={14.5}
        style={{ backgroundColor: colors.ink, paddingVertical: 14 }}
      />
      <OutlineButton
        label={t('auth.google')}
        size={14.5}
        color={colors.ink}
        background={colors.surface}
      />
    </>
  );
}
