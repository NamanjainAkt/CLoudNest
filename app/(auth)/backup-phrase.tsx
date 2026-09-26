// app/(auth)/backup-phrase.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldAlert,
  Copy,
  Check,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Lock,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../theme/ThemeContext';
import { TopHeader } from '../../components/common/TopHeader';
import { PillButton } from '../../components/common/PillButton';
import { entropyToMnemonic } from '../../services/crypto/mnemonic';
import { SecureStorageService } from '../../services/crypto/secureStore';

export default function BackupPhraseScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, radii } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ masterKey?: string }>();

  const [words, setWords] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // 3 random verification indices (0-23)
  const [verifyIndices, setVerifyIndices] = useState<number[]>([]);
  const [verifyInputs, setVerifyInputs] = useState<string[]>(['', '', '']);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMnemonic() {
      let key = params.masterKey;
      if (!key) {
        key = (await SecureStorageService.getMasterKey()) || '';
      }
      if (key && key.length === 64) {
        try {
          const generatedWords = entropyToMnemonic(key);
          setWords(generatedWords);
        } catch (err) {
          console.error('[BackupPhrase] Error generating words:', err);
        }
      }
    }
    loadMnemonic();
  }, [params.masterKey]);

  const handleCopy = async () => {
    if (words.length === 0) return;
    const text = words.map((w, idx) => `${idx + 1}. ${w}`).join(' ');
    try {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);

      // Auto-clear clipboard after 60 seconds for security
      setTimeout(() => {
        Clipboard.setStringAsync('');
      }, 60000);

      Alert.alert(
        'Phrase Copied',
        'Your recovery phrase has been copied to your clipboard. For security, your clipboard will be automatically cleared in 60 seconds.'
      );
    } catch {
      Alert.alert('Copy Failed', 'Could not copy to clipboard.');
    }
  };

  const handleStartVerification = () => {
    if (words.length !== 24) return;
    // Pick 3 random distinct indices
    const available = Array.from({ length: 24 }, (_, i) => i);
    // Shuffle and pick first 3
    const shuffled = available.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3).sort((a, b) => a - b);
    setVerifyIndices(selected);
    setVerifyInputs(['', '', '']);
    setVerifyError(null);
    setIsVerifying(true);
  };

  const handleVerifyAndProceed = () => {
    setVerifyError(null);
    for (let i = 0; i < 3; i++) {
      const targetWord = words[verifyIndices[i]];
      const enteredWord = (verifyInputs[i] || '').trim().toLowerCase();
      if (!enteredWord) {
        setVerifyError(`Please enter word #${verifyIndices[i] + 1}.`);
        return;
      }
      if (enteredWord !== targetWord) {
        setVerifyError(`Word #${verifyIndices[i] + 1} does not match. Please check your backup.`);
        return;
      }
    }

    // Success!
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Backup?',
      'Without your recovery phrase, your cloud files cannot be restored if you lose access to this device or sign out.\n\nAre you sure you want to skip?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip Anyway',
          style: 'destructive',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <TopHeader
        title={isVerifying ? 'Verify Recovery Phrase' : 'Backup Recovery Phrase'}
        showBack={isVerifying}
        onBackPress={() => setIsVerifying(false)}
        showEnclaveBadge={false}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 28) + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!isVerifying ? (
          <>
            {/* Header Icon & Title */}
            <View style={styles.iconCircleWrapper}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.primaryContainer + '30' },
                ]}
              >
                <KeyRound size={32} color={colors.primary} />
              </View>
            </View>

            <Text
              style={[
                typography.headlineMd,
                { color: colors.onSurface, textAlign: 'center', marginTop: 12 },
              ]}
            >
              Save Your Recovery Phrase
            </Text>

            <Text
              style={[
                typography.bodySm,
                {
                  color: colors.onSurfaceVariant,
                  textAlign: 'center',
                  marginTop: 6,
                  maxWidth: 320,
                  lineHeight: 18,
                },
              ]}
            >
              These 24 words represent your account recovery phrase. Write them down in order and store them safely offline.
            </Text>

            {/* Warning Banner */}
            <View
              style={[
                styles.warningBanner,
                {
                  backgroundColor: colors.errorContainer + '25',
                  borderColor: colors.error + '45',
                  borderRadius: radii.default,
                },
              ]}
            >
              <ShieldAlert size={20} color={colors.error} style={{ marginTop: 2, marginRight: 10 }} />
              <Text
                style={[
                  typography.bodySm,
                  { color: colors.onSurface, flex: 1, lineHeight: 18 },
                ]}
              >
                Write these words down and keep them safe. This is the ONLY way to recover your files if you lose access.
              </Text>
            </View>

            {/* 24 Words Grid: 4 columns x 6 rows */}
            <View style={styles.wordsGrid}>
              {words.map((word, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.wordCell,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.borderSubtle,
                      borderRadius: radii.sm || 8,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.monoSm,
                      { color: colors.outline, fontSize: 10, marginRight: 4 },
                    ]}
                  >
                    {idx + 1}.
                  </Text>
                  <Text
                    style={[
                      typography.monoSm,
                      { color: colors.onSurface, fontWeight: '600', fontSize: 12 },
                    ]}
                    numberOfLines={1}
                  >
                    {word}
                  </Text>
                </View>
              ))}
            </View>

            {/* Copy Button */}
            <TouchableOpacity
              onPress={handleCopy}
              style={[
                styles.copyButton,
                {
                  backgroundColor: colors.surfaceContainerHigh,
                  borderColor: colors.borderSubtle,
                  borderRadius: radii.default,
                },
              ]}
              activeOpacity={0.7}
            >
              {copied ? (
                <>
                  <Check size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[typography.labelMd, { color: colors.primary }]}>
                    Copied (Clears in 60s)
                  </Text>
                </>
              ) : (
                <>
                  <Copy size={16} color={colors.onSurfaceVariant} style={{ marginRight: 8 }} />
                  <Text style={[typography.labelMd, { color: colors.onSurface }]}>
                    Copy All 24 Words
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Primary Action Button */}
            <View style={styles.actionContainer}>
              <PillButton
                label="I've saved my recovery phrase"
                onPress={handleStartVerification}
                icon={<ArrowRight size={18} color={colors.onPrimary} />}
                size="lg"
              />
            </View>

            {/* Skip Option */}
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  typography.labelSm,
                  { color: colors.outline, textDecorationLine: 'underline' },
                ]}
              >
                Skip for now (Not recommended)
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Verification Step */}
            <View style={styles.iconCircleWrapper}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.secondaryContainer + '30' },
                ]}
              >
                <Lock size={30} color={colors.secondary} />
              </View>
            </View>

            <Text
              style={[
                typography.headlineMd,
                { color: colors.onSurface, textAlign: 'center', marginTop: 12 },
              ]}
            >
              Verify Your Phrase
            </Text>

            <Text
              style={[
                typography.bodySm,
                {
                  color: colors.onSurfaceVariant,
                  textAlign: 'center',
                  marginTop: 6,
                  maxWidth: 300,
                  lineHeight: 18,
                },
              ]}
            >
              To ensure you have securely recorded your recovery phrase, please enter the requested words below.
            </Text>

            {/* Verification Form */}
            <View style={styles.verifyInputsContainer}>
              {verifyIndices.map((wordIndex, i) => (
                <View key={wordIndex} style={styles.verifyFieldGroup}>
                  <Text
                    style={[
                      typography.labelMd,
                      { color: colors.onSurface, marginBottom: 6, fontWeight: '600' },
                    ]}
                  >
                    Enter Word #{wordIndex + 1}
                  </Text>
                  <View
                    style={[
                      styles.verifyInputWrapper,
                      {
                        backgroundColor: colors.surfaceContainer,
                        borderColor: verifyError ? colors.error : colors.borderSubtle,
                        borderRadius: radii.sm || 8,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.monoSm,
                        { color: colors.outline, width: 24, fontSize: 12 },
                      ]}
                    >
                      {wordIndex + 1}.
                    </Text>
                    <TextInput
                      style={[
                        styles.verifyTextInput,
                        typography.monoSm,
                        { color: colors.onSurface, fontSize: 14 },
                      ]}
                      value={verifyInputs[i]}
                      onChangeText={(val) => {
                        const next = [...verifyInputs];
                        next[i] = val.trim().toLowerCase();
                        setVerifyInputs(next);
                        if (verifyError) setVerifyError(null);
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder={`Type word #${wordIndex + 1}`}
                      placeholderTextColor={colors.outline}
                    />
                  </View>
                </View>
              ))}

              {verifyError && (
                <View style={styles.errorBanner}>
                  <ShieldAlert size={16} color={colors.error} style={{ marginRight: 6 }} />
                  <Text style={[typography.bodySm, { color: colors.error, flex: 1 }]}>
                    {verifyError}
                  </Text>
                </View>
              )}
            </View>

            {/* Verify Button */}
            <View style={styles.actionContainer}>
              <PillButton
                label="Verify & Open Vault"
                onPress={handleVerifyAndProceed}
                icon={<Check size={18} color={colors.onPrimary} />}
                size="lg"
              />
            </View>

            {/* Back to Review */}
            <TouchableOpacity
              onPress={() => setIsVerifying(false)}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeft size={16} color={colors.onSurfaceVariant} style={{ marginRight: 6 }} />
              <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>
                Review Phrase Again
              </Text>
            </TouchableOpacity>
          </>
        )}
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
    paddingTop: 10,
  },
  iconCircleWrapper: {
    marginTop: 10,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderWidth: 1,
    marginTop: 18,
    marginBottom: 16,
    width: '100%',
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    width: '100%',
    marginBottom: 16,
  },
  wordCell: {
    width: '23.5%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderWidth: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  actionContainer: {
    width: '100%',
    marginTop: 4,
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  verifyInputsContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 16,
  },
  verifyFieldGroup: {
    marginBottom: 14,
  },
  verifyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
  },
  verifyTextInput: {
    flex: 1,
    height: 46,
    paddingVertical: 0,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
});
