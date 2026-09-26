// components/auth/BiometricLockOverlay.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, Fingerprint, ScanFace, Lock, KeyRound, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { BrandMark } from '../common/BrandMark';
import { PillButton } from '../common/PillButton';
import { BiometricService, BiometricStatus } from '../../services/crypto/biometrics';

interface BiometricLockOverlayProps {
  visible: boolean;
  onUnlock: () => void;
}

export const BiometricLockOverlay: React.FC<BiometricLockOverlayProps> = ({
  visible,
  onUnlock,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark } = useTheme();

  const [status, setStatus] = useState<BiometricStatus | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Pulse animation for the lock ring
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    // Check device hardware
    BiometricService.checkAvailability().then((s) => {
      setStatus(s);
    });

    // Start subtle pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Automatically prompt when overlay becomes visible
    const timer = setTimeout(() => {
      handleBiometricAuth();
    }, 400);

    return () => clearTimeout(timer);
  }, [visible]);

  const handleBiometricAuth = async () => {
    if (authenticating) return;
    setAuthenticating(true);
    setAuthError(null);

    try {
      const success = await BiometricService.authenticate('Unlock your CloudNest Vault');
      if (success) {
        setAuthenticating(false);
        onUnlock();
      } else {
        setAuthenticating(false);
        setAuthError('Authentication failed. Please try again.');
      }
    } catch (err: any) {
      setAuthenticating(false);
      setAuthError(err?.message || 'Authentication error.');
    }
  };

  const handlePasscodeFallback = () => {
    Alert.prompt
      ? Alert.prompt(
          'Master Passcode',
          'Enter your device passcode or vault master key to unlock:',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Unlock',
              onPress: (pass?: string) => {
                if (pass && pass.length >= 4) {
                  onUnlock();
                } else {
                  Alert.alert('Invalid Code', 'Passcode must be at least 4 characters.');
                }
              },
            },
          ],
          'secure-text'
        )
      : Alert.alert(
          'Device Passcode Fallback',
          'Biometrics requested device unlock. Please use biometric sensor to proceed.',
          [{ text: 'OK', onPress: handleBiometricAuth }]
        );
  };

  if (!visible) return null;

  const isFaceId = status?.biometryType === 'FACIAL_RECOGNITION';
  const label = status?.label || 'Biometric Security';

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <BrandMark size={32} />
          <View style={styles.enclaveBadge}>
            <Shield size={12} color={colors.primary} />
            <Text
              style={[
                typography.monoSm,
                { color: colors.primary, marginLeft: 5, fontSize: 11, fontWeight: '600' },
              ]}
            >
              VAULT LOCKED
            </Text>
          </View>
        </View>

        {/* Center Stage */}
        <View style={styles.centerStage}>
          {/* Animated Glow Ring */}
          <Animated.View
            style={[
              styles.iconRing,
              {
                borderColor: colors.primary,
                backgroundColor: isDark ? 'rgba(77, 142, 255, 0.08)' : 'rgba(0, 122, 255, 0.08)',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {isFaceId ? (
              <ScanFace size={52} color={colors.primary} />
            ) : (
              <Fingerprint size={52} color={colors.primary} />
            )}
          </Animated.View>

          <Text
            style={[
              typography.headlineMd,
              { color: colors.onSurface, marginTop: 24, textAlign: 'center', fontWeight: '700' },
            ]}
          >
            CloudNest Vault
          </Text>

          <Text
            style={[
              typography.bodySm,
              {
                color: colors.onSurfaceVariant,
                marginTop: 8,
                textAlign: 'center',
                maxWidth: 280,
                lineHeight: 18,
              },
            ]}
          >
            Your CloudNest storage is locked. Authenticate with {label} to continue.
          </Text>

          {/* Error Message if any */}
          {authError && (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: isDark ? 'rgba(255, 180, 171, 0.12)' : 'rgba(255, 59, 48, 0.1)',
                  borderColor: colors.error,
                },
              ]}
            >
              <AlertTriangle size={14} color={colors.error} />
              <Text
                style={[
                  typography.bodySm,
                  { color: colors.error, marginLeft: 6, fontSize: 12 },
                ]}
              >
                {authError}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomSection}>
          <PillButton
            label={authenticating ? 'Authenticating...' : `Unlock with ${label}`}
            onPress={handleBiometricAuth}
            loading={authenticating}
            icon={isFaceId ? <ScanFace size={18} color={colors.onPrimary} /> : <Fingerprint size={18} color={colors.onPrimary} />}
            size="lg"
          />

          <TouchableOpacity
            style={[styles.fallbackButton, { borderColor: colors.borderSubtle }]}
            onPress={handlePasscodeFallback}
            activeOpacity={0.7}
          >
            <KeyRound size={16} color={colors.onSurfaceVariant} />
            <Text
              style={[
                typography.labelMd,
                { color: colors.onSurfaceVariant, marginLeft: 8 },
              ]}
            >
              Use Passcode Fallback
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  enclaveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(77, 142, 255, 0.3)',
    backgroundColor: 'rgba(77, 142, 255, 0.08)',
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
  },
  bottomSection: {
    width: '100%',
    gap: 12,
  },
  fallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 9999,
    borderWidth: 1,
  },
});
