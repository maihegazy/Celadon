import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BareScreen,
  CenterDialog,
  Display,
  Hatch,
  OutlineButton,
  PrimaryButton,
  Text,
  TextButton,
} from '../components';
import { FREE_SCANS_PER_WEEK } from '../data/content';
import { useAppState } from '../state/AppState';
import { useAnalysisProfile } from '../state/useAnalysisProfile';
import { MealAnalysisError, PhotoSource, useMealAnalysis } from '../services/mealAnalysis';
import { colors, overlay } from '../theme';
import { useAppNavigation } from '../navigation/types';

type Phase = 'camera' | 'analyzing' | 'error';

/**
 * The camera step of the scan flow.
 *
 * Real capture (expo-camera) and real gallery picks (expo-image-picker) feed
 * the meal-analysis service. The design's failure state is a first-class
 * outcome here: when the model can't identify a plate confidently we say so
 * rather than inventing a result.
 */
export function ScanScreen() {
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const analysis = useMealAnalysis();
  const profile = useAnalysisProfile();
  const { state, set } = useAppState();

  const [permission, requestPermission] = useCameraPermissions();
  const [priming, setPriming] = useState(false);
  const [phase, setPhase] = useState<Phase>('camera');
  const [failure, setFailure] = useState<{ title: string; guidance: string } | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const scansLeft = Math.max(0, FREE_SCANS_PER_WEEK - state.scansUsed);

  // Explain the camera ask in Celadon's words before the OS sheet appears.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) setPriming(true);
  }, [permission]);

  const runDetection = useCallback(
    async (imageUri: string, source: PhotoSource) => {
      setPhase('analyzing');
      try {
        const detection = await analysis.detect({ imageUri, source, profile });
        set({ scansUsed: state.scansUsed + 1 });
        setPhase('camera');
        navigation.navigate('ScanConfirm', { imageUri, detection });
      } catch (error) {
        const known = error instanceof MealAnalysisError;
        setFailure({
          title: known ? error.message : "We couldn't read that photo",
          guidance: known
            ? error.guidance
            : 'Something interrupted the scan. Your photo is still here — try again in a moment.',
        });
        setPhase('error');
      }
    },
    [analysis, navigation, profile, set, state.scansUsed],
  );

  const capture = async () => {
    if (scansLeft <= 0) {
      navigation.navigate('ScanQuota');
      return;
    }
    if (!permission?.granted) {
      setPriming(true);
      return;
    }
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) await runDetection(photo.uri, 'camera');
  };

  const pickFromGallery = async () => {
    if (scansLeft <= 0) {
      navigation.navigate('ScanQuota');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await runDetection(result.assets[0].uri, 'gallery');
    }
  };

  if (phase === 'analyzing') return <AnalyzingState />;

  if (phase === 'error') {
    return (
      <BareScreen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.amberLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text weight="serif" size={22} color={colors.amber}>
              !
            </Text>
          </View>
          <Display size={22} align="center">
            {failure?.title ?? "We couldn't read that photo"}
          </Display>
          <Text size={14} color={colors.muted} lineHeight={22} align="center" style={{ maxWidth: 280 }}>
            {failure?.guidance}
          </Text>
          <PrimaryButton
            label="Try again"
            size={15}
            style={{ paddingHorizontal: 32, paddingVertical: 15, marginTop: 6 }}
            onPress={() => {
              setFailure(null);
              setPhase('camera');
            }}
          />
          <TextButton label="Not now" color={colors.muted} onPress={() => navigation.navigate('Home')} />
        </View>
      </BareScreen>
    );
  }

  return (
    <BareScreen background={colors.cameraBg}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Home')}
            style={styles.darkChip}
          >
            <Text weight="semibold" size={13.5} color={colors.white}>
              Close
            </Text>
          </Pressable>
          <Text weight="semibold" size={14} color={colors.white}>
            Scan a meal
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('ScanQuota')}
            style={[styles.darkChip, { borderRadius: 14, paddingVertical: 7, paddingHorizontal: 12 }]}
          >
            <Text weight="semibold" size={11.5} color={overlay.onDarkText}>
              {scansLeft === 1 ? '1 free scan left' : `${scansLeft} free scans left`}
            </Text>
          </Pressable>
        </View>

        <View style={{ flex: 1, marginHorizontal: 20, marginVertical: 8, borderRadius: 20, overflow: 'hidden' }}>
          {permission?.granted ? (
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
          ) : (
            <Hatch
              band={10}
              colorA={colors.cameraHatchA}
              colorB={colors.cameraHatchB}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            >
              <Text mono size={12} color={overlay.onDarkMono} align="center" lineHeight={19}>
                camera viewfinder{'\n'}point at your plate
              </Text>
            </Hatch>
          )}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 24,
              left: 24,
              right: 24,
              bottom: 24,
              borderWidth: 2,
              borderColor: overlay.onDarkFrame,
              borderRadius: 16,
            }}
          />
        </View>

        <View style={{ padding: 20, paddingBottom: Math.max(insets.bottom, 12) + 12, alignItems: 'center', gap: 12 }}>
          <Text size={13} color={overlay.onDarkFaint}>
            Center your plate in the frame
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            onPress={capture}
            style={({ pressed }) => [styles.shutter, pressed && { opacity: 0.8 }]}
          >
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.green }} />
          </Pressable>
          <TextButton label="Upload from gallery" color={overlay.onDarkText} size={13.5} onPress={pickFromGallery} />
        </View>
      </View>

      <CenterDialog visible={priming}>
        <Text weight="semibold" size={15.5} align="center" lineHeight={22}>
          Allow Celadon to use the camera?
        </Text>
        <Text size={13} color={colors.muted} align="center" lineHeight={20} style={{ marginTop: 8 }}>
          Photos are analyzed to estimate ingredients. They aren't stored unless you choose to save them.
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, alignSelf: 'stretch' }}>
          <OutlineButton
            label="Don't allow"
            size={13.5}
            color={colors.muted}
            style={{ flex: 1, paddingVertical: 11, borderRadius: 20 }}
            onPress={() => {
              setPriming(false);
              navigation.navigate('Home');
            }}
          />
          <PrimaryButton
            label="Allow"
            size={13.5}
            style={{ flex: 1, paddingVertical: 11, borderRadius: 20 }}
            onPress={async () => {
              setPriming(false);
              await requestPermission();
            }}
          />
        </View>
      </CenterDialog>
    </BareScreen>
  );
}

/** "Looking at your plate…" — shown while the model works. */
export function AnalyzingState({
  title = 'Looking at your plate…',
  note = 'Identifying ingredients, estimating portions and checking against your profile',
}: {
  title?: string;
  note?: string;
}) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <BareScreen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 18 }}>
        <Animated.View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            borderWidth: 4,
            borderColor: colors.line,
            borderTopColor: colors.green,
            transform: [{ rotate }],
          }}
        />
        <Display size={21}>{title}</Display>
        <Text size={14} color={colors.muted} align="center" lineHeight={21}>
          {note}
        </Text>
      </View>
    </BareScreen>
  );
}

const styles = StyleSheet.create({
  darkChip: {
    backgroundColor: overlay.onDark,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
