// app/(auth)/otp-verify.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, ShieldCheck, Laptop, Clock, Delete, Key } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { TopHeader } from '../../components/common/TopHeader';
import { PillButton } from '../../components/common/PillButton';
import { MTProtoClient } from '../../services/telegram/mtprotoClient';
import { useVaultStore } from '../../store/useVaultStore';

export default function OtpVerifyScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, radii } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; hash?: string }>();

  const targetPhone = params.phone || '';
  const [code, setCode] = useState<string>('');
  const [timer, setTimer] = useState(42);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const slotCount = code.length > 5 ? 6 : 5;

  const handleKeyPress = (num: string) => {
    if (code.length < 6) {
      setCode((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    setCode((prev) => prev.slice(0, -1));
  };

  const handleVerify = async () => {
    if (code.length < 5) {
      Alert.alert(
        'Incomplete Code',
        'Please enter the verification code sent to your Telegram app.'
      );
      return;
    }
    setLoading(true);
    try {
      const user = await MTProtoClient.signIn(targetPhone, params.hash || '', code);
      // Pass to vault creation milestone screen
      setLoading(false);
      router.push({
        pathname: '/(auth)/create-vault',
        params: {
          userName: `${user.firstName} ${user.lastName || ''}`.trim(),
          phone: targetPhone,
        },
      } as any);
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Verification Failed', err?.message || 'Could not verify code with Telegram.');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <TopHeader title="Verification" showBack={true} showEnclaveBadge={false} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Secure Login Badge */}
        <View
          style={[
            styles.handshakePill,
            { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          <Lock size={12} color={colors.primary} />
          <Text
            style={[
              typography.monoSm,
              { color: colors.onSurfaceVariant, marginLeft: 5, letterSpacing: 0.8 },
            ]}
          >
            SECURE LOGIN
          </Text>
        </View>

        {/* Title & Phone */}
        <Text
          style={[
            typography.headlineMd,
            { color: colors.onSurface, textAlign: 'center', marginTop: 12 },
          ]}
        >
          Enter Verification Code
        </Text>
        <Text
          style={[
            typography.bodyMd,
            { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 6 },
          ]}
        >
          We've sent a code to Telegram on{' '}
          <Text style={{ color: colors.onSurface, fontWeight: '600' }}>{targetPhone}</Text>
        </Text>

        {/* Discrete OTP Display */}
        <View style={styles.otpGrid}>
          {Array.from({ length: slotCount }).map((_, idx) => {
            const digit = code[idx] || '';
            const isActive = idx === code.length;
            const isFilled = digit !== '';

            return (
              <View
                key={idx}
                style={[
                  styles.otpSlot,
                  {
                    borderRadius: radii.default,
                    backgroundColor: isFilled
                      ? colors.surfaceContainerHighest
                      : isActive
                      ? colors.surfaceContainerHigh
                      : colors.surfaceContainerLow,
                    borderColor: isActive ? colors.primary : colors.borderSubtle,
                  },
                ]}
              >
                {isFilled ? (
                  <Text
                    style={[
                      typography.headlineMd,
                      { color: colors.onSurface, fontWeight: '600' },
                    ]}
                  >
                    {digit}
                  </Text>
                ) : isActive ? (
                  <View style={[styles.activeCaret, { backgroundColor: colors.primary }]} />
                ) : (
                  <View
                    style={[
                      styles.emptyDot,
                      { backgroundColor: colors.outlineVariant + '40' },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Device Sync Telemetry */}
        <View style={styles.telemetryRow}>
          <Laptop size={14} color={colors.secondary} />
          <Text
            style={[
              typography.bodySm,
              { color: colors.onSurfaceVariant, marginLeft: 6, fontSize: 11 },
            ]}
          >
            Code sent directly to your Telegram chat
          </Text>
        </View>

        {/* Resend Timer Pill */}
        <View
          style={[
            styles.timerPill,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <Clock size={14} color={colors.onSurfaceVariant} />
          <Text
            style={[
              typography.bodySm,
              { color: colors.onSurfaceVariant, marginLeft: 6, fontSize: 12 },
            ]}
          >
            Resend code in{' '}
            <Text style={{ color: colors.onSurface, fontWeight: '600' }}>
              0:{timer < 10 ? `0${timer}` : timer}
            </Text>
          </Text>
        </View>

        {/* Safe & Private Storage Card */}
        <View
          style={[
            styles.trustCard,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.borderSubtle,
              borderRadius: radii.default,
            },
          ]}
        >
          <View
            style={[
              styles.shieldBox,
              { backgroundColor: colors.surfaceContainerHighest },
            ]}
          >
            <ShieldCheck size={18} color={colors.primary} />
          </View>
          <View style={styles.trustTextCol}>
            <Text style={[typography.labelMd, { color: colors.onSurface }]}>
              Safe & Private Storage
            </Text>
            <Text
              style={[
                typography.bodySm,
                { color: colors.onSurfaceVariant, marginTop: 2, lineHeight: 16 },
              ]}
            >
              CloudNest never stores your files on intermediate servers. Your data is encrypted on your device and private to you.
            </Text>
          </View>
        </View>

        {/* Primary CTA */}
        <PillButton
          label="Verify & Continue"
          onPress={handleVerify}
          loading={loading}
          icon={<Key size={16} color={colors.onPrimaryContainer} />}
          size="lg"
          style={{ width: '100%', marginVertical: 12 }}
        />

        {/* Tactile Keypad Simulation */}
        <View style={styles.keypadGrid}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <TouchableOpacity
              key={digit}
              onPress={() => handleKeyPress(digit)}
              style={[
                styles.keypadKey,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderRadius: radii.default,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[typography.headlineSm, { color: colors.onSurface, fontSize: 18 }]}>
                {digit}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={[styles.keypadKey, { backgroundColor: 'transparent' }]} />
          <TouchableOpacity
            onPress={() => handleKeyPress('0')}
            style={[
              styles.keypadKey,
              {
                backgroundColor: colors.surfaceContainer,
                borderRadius: radii.default,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[typography.headlineSm, { color: colors.onSurface, fontSize: 18 }]}>
              0
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={[
              styles.keypadKey,
              {
                backgroundColor: colors.surfaceContainer,
                borderRadius: radii.default,
              },
            ]}
            activeOpacity={0.7}
          >
            <Delete size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
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
  handshakePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 340,
    marginTop: 24,
    gap: 8,
  },
  otpSlot: {
    flex: 1,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  activeCaret: {
    width: 2,
    height: 22,
    borderRadius: 1,
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 16,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderWidth: 1,
    width: '100%',
    maxWidth: 360,
    marginTop: 20,
  },
  shieldBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  trustTextCol: {
    flex: 1,
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
    marginTop: 8,
    gap: 8,
  },
  keypadKey: {
    width: '30%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
