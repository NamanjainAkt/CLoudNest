// components/settings/RecoveryPhraseModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldAlert, Copy, Check, X, KeyRound } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../theme/ThemeContext';
import { PillButton } from '../common/PillButton';

interface RecoveryPhraseModalProps {
  visible: boolean;
  onClose: () => void;
  words: string[];
  keyFingerprint?: string;
}

export const RecoveryPhraseModal: React.FC<RecoveryPhraseModalProps> = ({
  visible,
  onClose,
  words,
  keyFingerprint,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, typography, radii } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
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
        'Copied',
        '24-word recovery phrase copied to clipboard. Store it in a safe, private place. Clipboard will be automatically cleared in 60 seconds.'
      );
    } catch {
      Alert.alert('Copy Failed', 'Could not copy to clipboard.');
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
                Recovery Phrase (24 Words)
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

          {/* Warning Banner */}
          <View
            style={[
              styles.warningBanner,
              { backgroundColor: colors.errorContainer + '25', borderColor: colors.error + '40' },
            ]}
          >
            <ShieldAlert size={18} color={colors.error} style={{ marginTop: 2 }} />
            <Text
              style={[
                typography.bodySm,
                { color: colors.onSurface, marginLeft: 8, flex: 1, lineHeight: 18 },
              ]}
            >
              Keep these 24 words safe. You can use this phrase to recover your files if you switch devices.
            </Text>
          </View>

          {/* Words 4x6 Grid */}
          <View style={styles.wordsGrid}>
            {words.map((word, idx) => (
              <View
                key={idx}
                style={[
                  styles.wordCell,
                  {
                    backgroundColor: colors.surfaceContainer,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.monoSm,
                    { color: colors.outline, width: 18, fontSize: 10 },
                  ]}
                >
                  {idx + 1}.
                </Text>
                <Text
                  style={[
                    typography.monoSm,
                    { color: colors.onSurface, fontWeight: '600', flex: 1, fontSize: 12 },
                  ]}
                  numberOfLines={1}
                >
                  {word}
                </Text>
              </View>
            ))}
          </View>

          {keyFingerprint && (
            <View style={styles.fingerprintRow}>
              <Text style={[typography.bodySm, { color: colors.outline, fontSize: 11 }]}>
                Security Key ID:
              </Text>
              <Text
                style={[
                  typography.monoSm,
                  { color: colors.primary, fontSize: 11, marginLeft: 6, fontWeight: '600' },
                ]}
              >
                {keyFingerprint}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            <PillButton
              label={copied ? 'Phrase Copied' : 'Copy All 24 Words'}
              onPress={handleCopy}
              icon={copied ? <Check size={16} color={colors.onPrimary} /> : <Copy size={16} color={colors.onPrimary} />}
              size="lg"
            />
          </View>
        </View>
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
  container: {
    maxHeight: '85%',
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  wordCell: {
    width: '23%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  fingerprintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionRow: {
    width: '100%',
  },
});
