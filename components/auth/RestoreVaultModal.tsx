// components/auth/RestoreVaultModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyRound, X, Check, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { PillButton } from '../common/PillButton';
import { mnemonicToSeedHex, isValidMnemonicWord } from '../../services/crypto/mnemonic';
import { SecureStorageService } from '../../services/crypto/secureStore';
import { useVaultStore } from '../../store/useVaultStore';
import { MTProtoClient } from '../../services/telegram/mtprotoClient';

interface RestoreVaultModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RestoreVaultModal: React.FC<RestoreVaultModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, typography, radii } = useTheme();
  const router = useRouter();
  const setSession = useVaultStore((s) => s.setSession);

  // 12 word inputs
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const [loading, setLoading] = useState(false);

  const handleWordChange = (text: string, index: number) => {
    const trimmed = text.trim().toLowerCase();
    // Check if user pasted full phrase with spaces
    if (trimmed.includes(' ')) {
      const parts = trimmed.split(/\s+/).filter(Boolean);
      if (parts.length === 12) {
        setWords(parts);
        return;
      }
    }

    const next = [...words];
    next[index] = trimmed;
    setWords(next);
  };

  const handleRestore = async () => {
    // Validate all 12 words filled
    const filledWords = words.map((w) => w.trim().toLowerCase());
    if (filledWords.some((w) => !w)) {
      Alert.alert('Incomplete Phrase', 'Please enter all 12 recovery words to restore your vault.');
      return;
    }

    setLoading(true);
    try {
      // Re-derive master seed hex
      const seedHex = mnemonicToSeedHex(filledWords);
      await SecureStorageService.saveMasterKey(seedHex);

      // Create session connected to Frankfurt DC4
      const session = await MTProtoClient.createPrivateVaultChannel({
        id: Date.now(),
        firstName: 'Restored',
        lastName: 'Vault',
        phone: '',
      });
      setSession(session);

      setLoading(false);
      onClose();
      Alert.alert('Vault Restored', 'Your Zero-Knowledge Master Key has been successfully recovered.', [
        {
          text: 'Open Vault',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Restoration Failed', err?.message || 'Invalid recovery phrase format.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissOverlay} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View
            style={[
              styles.container,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderColor: colors.borderSubtle,
                borderTopLeftRadius: radii.xl || 24,
                borderTopRightRadius: radii.xl || 24,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: colors.outlineVariant || '#383a48' },
                ]}
              />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <KeyRound size={20} color={colors.primary} />
                <Text
                  style={[
                    typography.headlineSm,
                    { color: colors.onSurface, marginLeft: 8, fontWeight: '700' },
                  ]}
                >
                  Restore Existing Vault
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.surfaceContainerHigh },
                ]}
              >
                <X size={16} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text
                style={[
                  typography.bodySm,
                  { color: colors.onSurfaceVariant, marginBottom: 16, lineHeight: 18 },
                ]}
              >
                Enter your 12-word recovery phrase or paste the entire phrase into any field to decrypt your existing vault.
              </Text>

              {/* 12 Word Inputs Grid */}
              <View style={styles.wordsGrid}>
                {words.map((word, idx) => {
                  const isValid = word ? isValidMnemonicWord(word) : false;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.wordInputWrapper,
                        {
                          backgroundColor: colors.surfaceContainer,
                          borderColor: word
                            ? isValid
                              ? colors.primary
                              : colors.error
                            : colors.borderSubtle,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.monoSm,
                          { color: colors.outline, width: 22, fontSize: 11 },
                        ]}
                      >
                        {idx + 1}.
                      </Text>
                      <TextInput
                        style={[
                          styles.wordInput,
                          typography.monoSm,
                          { color: colors.onSurface },
                        ]}
                        value={word}
                        onChangeText={(t) => handleWordChange(t, idx)}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="word"
                        placeholderTextColor={colors.outline}
                      />
                      {isValid && (
                        <Check size={12} color={colors.primary} style={{ marginRight: 4 }} />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Action Button */}
              <View style={styles.actionContainer}>
                <PillButton
                  label="Restore Vault & Decrypt"
                  onPress={handleRestore}
                  loading={loading}
                  icon={<ArrowRight size={16} color={colors.onPrimary} />}
                  size="lg"
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  keyboardView: {
    width: '100%',
  },
  container: {
    maxHeight: '90%',
    borderTopWidth: 1,
    paddingHorizontal: 20,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  wordInputWrapper: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
  },
  wordInput: {
    flex: 1,
    paddingVertical: 0,
    height: 36,
  },
  actionContainer: {
    width: '100%',
  },
});
