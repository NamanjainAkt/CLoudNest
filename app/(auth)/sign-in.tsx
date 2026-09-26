// app/(auth)/sign-in.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Cloud,
  Lock,
  ArrowRight,
  ShieldCheck,
  Key,
  Smartphone,
  ChevronDown,
  CheckCircle2,
  KeyRound,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { TopHeader } from '../../components/common/TopHeader';
import { PillButton } from '../../components/common/PillButton';
import { MTProtoClient } from '../../services/telegram/mtprotoClient';
import {
  DEFAULT_COUNTRY,
  CountryItem,
  formatPhoneNumber,
  extractCountryAndNumber,
} from '../../services/telegram/countries';
import { CountryPickerModal } from '../../components/auth/CountryPickerModal';
import { RestoreVaultModal } from '../../components/auth/RestoreVaultModal';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, radii } = useTheme();
  const router = useRouter();

  // Default to India (+91)
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);

  // Phone input handler with auto international format detector
  const handlePhoneChange = (input: string) => {
    // If user pasted or typed full international number starting with +
    if (input.trim().startsWith('+')) {
      const { country, localDigits } = extractCountryAndNumber(input);
      if (country) {
        setSelectedCountry(country);
        setPhone(formatPhoneNumber(localDigits, country));
        return;
      }
    }
    setPhone(formatPhoneNumber(input, selectedCountry));
  };

  const handleCountrySelect = (country: CountryItem) => {
    setSelectedCountry(country);
    // If phone has digits, reformat according to selected country rules
    if (phone) {
      setPhone(formatPhoneNumber(phone, country));
    }
  };

  const cleanDigits = phone.replace(/\D/g, '');
  const isValidLength = cleanDigits.length === selectedCountry.maxLength;

  const handleContinue = async () => {
    if (!cleanDigits) {
      Alert.alert(
        'Phone Number Required',
        'Please enter your phone number to receive your Telegram login code.'
      );
      return;
    }
    setLoading(true);
    try {
      const fullPhone = `${selectedCountry.dialCode} ${phone.trim()}`;
      const res = await MTProtoClient.sendCode(fullPhone);
      setLoading(false);
      router.push({
        pathname: '/(auth)/otp-verify',
        params: { phone: fullPhone, hash: res.phoneCodeHash },
      } as any);
    } catch (err: any) {
      setLoading(false);
      console.error('Sign In Error:', err);
      Alert.alert(
        'Telegram Sign In Error',
        err?.message || 'Failed to send verification code. Please check your phone number and internet connection.'
      );
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <TopHeader title="Sign In" showBack={true} showEnclaveBadge={false} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header Micro-Bar */}
          <View style={styles.microBar}>
            <View style={styles.clientBadge}>
              <View style={[styles.glowingDot, { backgroundColor: colors.secondary }]} />
              <Text
                style={[
                  typography.monoSm,
                  { color: colors.onSurfaceVariant, fontWeight: '500' },
                ]}
              >
                CLOUDNEST VAULT
              </Text>
            </View>

            <View
              style={[
                styles.e2eeBadge,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            >
              <ShieldCheck size={12} color={colors.primary} />
              <Text
                style={[
                  typography.monoSm,
                  { color: colors.onSurfaceVariant, marginLeft: 4, fontSize: 10 },
                ]}
              >
                Protected
              </Text>
            </View>
          </View>

          {/* Center Emblem Visual */}
          <View style={styles.emblemContainer}>
            <View
              style={[
                styles.emblemOuter,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            >
              <View
                style={[
                  styles.emblemInner,
                  { backgroundColor: colors.surfaceContainerHighest },
                ]}
              >
                <Cloud size={28} color={colors.primary} />
              </View>
            </View>
            <View
              style={[
                styles.lockSatellite,
                { backgroundColor: colors.surfaceContainerLowest },
              ]}
            >
              <Lock size={12} color={colors.primary} />
            </View>
          </View>

          {/* Title & Subtitle */}
          <Text
            style={[
              typography.headlineMd,
              { color: colors.onSurface, textAlign: 'center', marginTop: 14 },
            ]}
          >
            Sign in with Telegram
          </Text>
          <Text
            style={[
              typography.bodyMd,
              {
                color: colors.onSurfaceVariant,
                textAlign: 'center',
                marginTop: 8,
                maxWidth: 310,
                lineHeight: 18,
              },
            ]}
          >
            Your files are stored safely within your private Telegram storage. CloudNest acts as your client.
          </Text>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text
              style={[
                typography.labelSm,
                { color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.8 },
              ]}
            >
              PHONE NUMBER
            </Text>

            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: isValidLength ? colors.primary : colors.borderSubtle,
                  borderRadius: radii.default,
                },
              ]}
            >
              {/* Country Code Trigger */}
              <TouchableOpacity
                style={[
                  styles.countryBtn,
                  { backgroundColor: colors.surfaceContainer },
                ]}
                activeOpacity={0.75}
                onPress={() => setCountryPickerVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={`Country selector, currently ${selectedCountry.name} (${selectedCountry.dialCode})`}
              >
                <Text style={{ fontSize: 16 }}>{selectedCountry.flag}</Text>
                <Text
                  style={[
                    typography.monoSm,
                    { color: colors.onSurface, marginHorizontal: 4, fontWeight: '700' },
                  ]}
                >
                  {selectedCountry.dialCode}
                </Text>
                <ChevronDown size={14} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.surfaceContainerHighest },
                ]}
              />

              {/* Direct Input */}
              <TextInput
                style={[
                  styles.phoneInput,
                  typography.headlineSm,
                  { color: colors.onSurface },
                ]}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder={selectedCountry.format}
                placeholderTextColor={colors.outline}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
              />

              {/* Status Glyph */}
              <View style={styles.statusIconContainer}>
                {isValidLength ? (
                  <CheckCircle2 size={18} color={colors.primary} />
                ) : (
                  <Smartphone size={18} color={colors.outlineVariant} />
                )}
              </View>
            </View>

            {/* Protocol Assurance Banner */}
            <View
              style={[
                styles.assuranceBanner,
                { backgroundColor: colors.surfaceContainerLowest },
              ]}
            >
              <Key size={18} color={colors.primary} style={{ marginTop: 2 }} />
              <Text
                style={[
                  typography.bodySm,
                  { color: colors.onSurfaceVariant, marginLeft: 8, flex: 1, lineHeight: 18 },
                ]}
              >
                We will send a one-time login code to your Telegram app on {phone.trim() ? `${selectedCountry.dialCode} ${phone.trim()}` : `${selectedCountry.dialCode} your number`}. No password required.
              </Text>
            </View>

            {/* Submit Button */}
            <PillButton
              label="Continue"
              onPress={handleContinue}
              loading={loading}
              icon={<ArrowRight size={18} color={colors.onPrimaryContainer} />}
              size="lg"
              style={{ marginTop: 16 }}
            />
          </View>

          {/* Security Guarantee Card */}
          <View
            style={[
              styles.guaranteeCard,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderRadius: radii.default,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.guaranteeHeader}>
              <View style={styles.zeroRow}>
                <ShieldCheck size={16} color={colors.secondary} />
                <Text
                  style={[
                    typography.labelSm,
                    { color: colors.onSurface, fontWeight: '600', marginLeft: 6 },
                  ]}
                >
                  Private & Secure
                </Text>
              </View>
              <View
                style={[
                  styles.encPill,
                  { backgroundColor: colors.secondaryContainer + '30' },
                ]}
              >
                <Text style={[typography.monoSm, { color: colors.secondary, fontSize: 10 }]}>
                  Protected
                </Text>
              </View>
            </View>

            <Text
              style={[
                typography.bodySm,
                { color: colors.onSurfaceVariant, marginTop: 8, lineHeight: 18 },
              ]}
            >
              Files are encrypted safely on your device before uploading. No one else can see your photos, videos, or documents.
            </Text>
          </View>

          {/* Legal Footnote */}
          <Text
            style={[
              typography.bodySm,
              { color: colors.outline, textAlign: 'center', marginTop: 24, fontSize: 11 },
            ]}
          >
            By signing in, you agree to CloudNest’s Terms of Service & Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Code Picker Modal */}
      <CountryPickerModal
        visible={countryPickerVisible}
        onClose={() => setCountryPickerVisible(false)}
        onSelect={handleCountrySelect}
        selectedCountryCode={selectedCountry.code}
      />

      {/* Restore Vault from 12-Word Recovery Phrase Modal */}
      <RestoreVaultModal
        visible={restoreModalVisible}
        onClose={() => setRestoreModalVisible(false)}
      />
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
    paddingTop: 12,
  },
  microBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
  },
  clientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  glowingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  e2eeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  emblemContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    position: 'relative',
  },
  emblemOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockSatellite: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 360,
    marginTop: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 6,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 8,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 4,
    height: 40,
  },
  statusIconContainer: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assuranceBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  guaranteeCard: {
    width: '100%',
    maxWidth: 360,
    padding: 14,
    borderWidth: 1,
    marginTop: 20,
  },
  guaranteeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  encPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
});
