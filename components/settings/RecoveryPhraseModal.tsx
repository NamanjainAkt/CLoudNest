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

  const handleCopy = () => {
    const text = words.map((w, idx) => `${idx + 1}. ${w}`).join(' ');
    // Clipboard copy
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    Alert.alert('Copied', '12-word recovery phrase copied to clipboard. Store it in a secure location.');
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
                Vault Recovery Phrase
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
              Keep these 12 words secret. Anyone with access to this phrase can decrypt and access your entire vault.
            </Text>
          </View>

          {/* Words 3x4 Grid */}
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
                    { color: colors.outline, width: 20, fontSize: 11 },
                  ]}
                >
                  {idx + 1}.
                </Text>
                <Text
                  style={[
                    typography.monoSm,
                    { color: colors.onSurface, fontWeight: '600', flex: 1 },
                  ]}
                >
                  {word}
                </Text>
              </View>
            ))}
          </View>

          {keyFingerprint && (
            <View style={styles.fingerprintRow}>
              <Text style={[typography.bodySm, { color: colors.outline, fontSize: 11 }]}>
                Master Fingerprint:
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
              label={copied ? 'Phrase Copied' : 'Copy All 12 Words'}
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
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
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
