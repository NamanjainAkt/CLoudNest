// app/(auth)/create-vault.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Lock, Check, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { TopHeader } from '../../components/common/TopHeader';
import { MTProtoClient } from '../../services/telegram/mtprotoClient';
import { useVaultStore } from '../../store/useVaultStore';
import { generateMasterSeed } from '../../services/crypto/keyDerivation';
import { SecureStorageService } from '../../services/crypto/secureStore';

export default function CreateVaultScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, radii } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ userName?: string; phone?: string }>();
  const setSession = useVaultStore((s) => s.setSession);

  const [step, setStep] = useState(1);
  const [progressPercent, setProgressPercent] = useState(25);
  const spinAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();

    // Sequence the 4 milestones
    const runSetup = async () => {
      try {
        // Step 1: Master key
        await new Promise((r) => setTimeout(r, 600));
        const masterKey = await generateMasterSeed();
        await SecureStorageService.saveMasterKey(masterKey);
        setStep(2);
        setProgressPercent(50);

        // Step 2: Zero-Knowledge container
        await new Promise((r) => setTimeout(r, 600));
        setStep(3);
        setProgressPercent(75);

        // Step 3: MTProto channel
        const nameParts = (params.userName || '').trim().split(' ');
        const session = await MTProtoClient.createPrivateVaultChannel({
          id: Date.now(),
          firstName: nameParts[0] || 'Vault',
          lastName: nameParts.slice(1).join(' ') || 'User',
          phone: params.phone || '',
        });
        setSession(session);
        setStep(4);
        setProgressPercent(100);

        // Step 4: Complete and navigate
        await new Promise((r) => setTimeout(r, 600));
        router.replace('/(tabs)');
      } catch (err: any) {
        console.error('Vault setup error:', err);
        Alert.alert(
          'Vault Initialization Error',
          err?.message || 'Could not connect to Telegram to initialize your private vault.',
          [
            {
              text: 'Retry',
              onPress: () => runSetup(),
            },
            {
              text: 'Back to Sign In',
              style: 'cancel',
              onPress: () => router.replace('/(auth)/sign-in'),
            },
          ]
        );
      }
    };

    runSetup();
  }, [spinAnim, router, setSession]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <TopHeader title="Creating Vault" showBack={false} showEnclaveBadge={false} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Concentric Orbital Visualizer */}
        <View style={styles.orbitContainer}>
          <Animated.View style={[styles.orbitSvg, { transform: [{ rotate: spin }] }]}>
            <Svg width={180} height={180} viewBox="0 0 200 200">
              <Circle
                cx="100"
                cy="100"
                r="90"
                stroke={colors.surfaceContainerHighest}
                strokeWidth="1.2"
                strokeDasharray="4 8"
                fill="none"
              />
              <Circle cx="100" cy="10" r="4" fill={colors.primary} />
              <Circle cx="20" cy="140" r="3" fill={colors.secondary} />
              <Circle
                cx="100"
                cy="100"
                r="65"
                stroke={colors.surfaceContainerHigh}
                strokeWidth="1.5"
                strokeDasharray="12 8"
                fill="none"
              />
              <Circle cx="100" cy="35" r="4" fill={colors.primaryContainer} />
            </Svg>
          </Animated.View>

          {/* Central Shield Vault Halo */}
          <View
            style={[
              styles.shieldHalo,
              { backgroundColor: colors.surfaceContainer },
            ]}
          >
            <View
              style={[
                styles.shieldInner,
                { backgroundColor: colors.surfaceContainerLowest },
              ]}
            >
              <Lock size={28} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Title and Encryption Status */}
        <Text
          style={[
            typography.headlineMd,
            { color: colors.onSurface, textAlign: 'center', marginTop: 16 },
          ]}
        >
          Creating your private vault…
        </Text>

        <View style={styles.entropyPill}>
          <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
          <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>
            End-to-End Encrypted Storage
          </Text>
        </View>

        {/* Progress Matrix Card */}
        <View
          style={[
            styles.progressMatrixCard,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: radii.default,
            },
          ]}
        >
          <View style={styles.progressHeader}>
            <Text
              style={[
                typography.labelSm,
                { color: colors.onSurfaceVariant, letterSpacing: 0.8 },
              ]}
            >
              INITIALIZATION PROGRESS
            </Text>
            <Text style={[typography.monoSm, { color: colors.primary, fontWeight: '600' }]}>
              {progressPercent}%
            </Text>
          </View>

          {/* 4-Phase Segmented Track */}
          <View style={styles.segmentedTrack}>
            {[1, 2, 3, 4].map((phase) => (
              <View
                key={phase}
                style={[
                  styles.segment,
                  {
                    backgroundColor:
                      phase <= step
                        ? colors.primary
                        : colors.surfaceContainerHighest,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Milestones Checklist */}
        <View style={styles.milestoneList}>
          {/* Step 1 */}
          <View
            style={[
              styles.milestoneRow,
              { backgroundColor: colors.surfaceContainerLow, borderRadius: radii.default },
            ]}
          >
            <View
              style={[
                styles.checkCircle,
                {
                  backgroundColor: step >= 1 ? colors.primary + '25' : colors.surfaceContainerHighest,
                },
              ]}
            >
              <Check size={14} color={step >= 1 ? colors.primary : colors.onSurfaceVariant} />
            </View>
            <View style={styles.milestoneText}>
              <Text style={[typography.labelMd, { color: colors.onSurface }]}>
                Creating security keys
              </Text>
              <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                Generating unique encryption keys
              </Text>
            </View>
            <Text style={[typography.monoSm, { color: colors.primary }]}>Done</Text>
          </View>

          {/* Step 2 */}
          <View
            style={[
              styles.milestoneRow,
              { backgroundColor: colors.surfaceContainerLow, borderRadius: radii.default },
            ]}
          >
            <View
              style={[
                styles.checkCircle,
                {
                  backgroundColor: step >= 2 ? colors.primary + '25' : colors.surfaceContainerHighest,
                },
              ]}
            >
              {step >= 2 ? (
                <Check size={14} color={colors.primary} />
              ) : (
                <RefreshCw size={14} color={colors.secondary} />
              )}
            </View>
            <View style={styles.milestoneText}>
              <Text style={[typography.labelMd, { color: colors.onSurface }]}>
                Setting up secure storage
              </Text>
              <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                Private container ready on device
              </Text>
            </View>
            <Text style={[typography.monoSm, { color: step >= 2 ? colors.primary : colors.onSurfaceVariant }]}>
              {step >= 2 ? 'Done' : 'Active'}
            </Text>
          </View>

          {/* Step 3 */}
          <View
            style={[
              styles.milestoneRow,
              {
                backgroundColor: step === 3 ? colors.surfaceContainerHigh : colors.surfaceContainerLow,
                borderRadius: radii.default,
              },
            ]}
          >
            <View
              style={[
                styles.checkCircle,
                {
                  backgroundColor: step >= 3 ? colors.secondary + '25' : colors.surfaceContainerHighest,
                },
              ]}
            >
              {step > 3 ? (
                <Check size={14} color={colors.primary} />
              ) : (
                <RefreshCw size={14} color={colors.secondary} />
              )}
            </View>
            <View style={styles.milestoneText}>
              <Text style={[typography.labelMd, { color: colors.onSurface }]}>
                Connecting to cloud storage
              </Text>
              <Text style={[typography.monoSm, { color: colors.secondary, marginTop: 2 }]}>
                Setting up private storage channel…
              </Text>
            </View>
            <Text style={[typography.monoSm, { color: step >= 4 ? colors.primary : colors.secondary }]}>
              {step >= 4 ? 'Done' : 'Active'}
            </Text>
          </View>

          {/* Step 4 */}
          <View
            style={[
              styles.milestoneRow,
              { backgroundColor: colors.surfaceContainerLow, borderRadius: radii.default },
            ]}
          >
            <View
              style={[
                styles.checkCircle,
                {
                  backgroundColor: step >= 4 ? colors.primary + '25' : colors.surfaceContainerHighest,
                },
              ]}
            >
              {step >= 4 ? (
                <Check size={14} color={colors.primary} />
              ) : (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.outline }} />
              )}
            </View>
            <View style={styles.milestoneText}>
              <Text style={[typography.labelMd, { color: colors.onSurface }]}>
                Finishing setup
              </Text>
              <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                Preparing your offline file manager
              </Text>
            </View>
            <Text style={[typography.monoSm, { color: step >= 4 ? colors.primary : colors.outline }]}>
              {step >= 4 ? 'Done' : 'Pending'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingTop: 16,
  },
  orbitContainer: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 10,
  },
  orbitSvg: {
    position: 'absolute',
    width: 180,
    height: 180,
  },
  shieldHalo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  shieldInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entropyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  progressMatrixCard: {
    width: '100%',
    padding: 16,
    marginTop: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  segmentedTrack: {
    flexDirection: 'row',
    gap: 6,
    height: 6,
    width: '100%',
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  milestoneList: {
    width: '100%',
    marginTop: 18,
    gap: 10,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  milestoneText: {
    flex: 1,
  },
});
