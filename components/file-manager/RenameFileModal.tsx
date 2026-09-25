// components/file-manager/RenameFileModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Edit2, X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface RenameFileModalProps {
  visible: boolean;
  initialName: string;
  onClose: () => void;
  onRename: (newName: string) => Promise<void> | void;
}

export const RenameFileModal: React.FC<RenameFileModalProps> = ({
  visible,
  initialName,
  onClose,
  onRename,
}) => {
  const { colors, typography, radii } = useTheme();
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName, visible]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === initialName) {
      onClose();
      return;
    }
    setLoading(true);
    try {
      await onRename(trimmed);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlayMask }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surfaceContainerLow,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.lg,
                  },
                ]}
              >
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.iconTitleRow}>
                    <View
                      style={[
                        styles.iconBadge,
                        { backgroundColor: colors.primaryContainer + '20' },
                      ]}
                    >
                      <Edit2 size={18} color={colors.primary} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
                        Rename File
                      </Text>
                      <Text
                        style={[
                          typography.monoSm,
                          { color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2 },
                        ]}
                      >
                        Enter new file name
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={onClose}
                    style={[styles.closeBtn, { backgroundColor: colors.surfaceContainer }]}
                    activeOpacity={0.7}
                  >
                    <X size={16} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>

                {/* Input */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      typography.bodyMd,
                      {
                        backgroundColor: colors.surfaceContainerLowest,
                        borderColor: colors.borderSubtle,
                        color: colors.onSurface,
                        borderRadius: radii.default,
                      },
                    ]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter file name"
                    placeholderTextColor={colors.onSurfaceVariant}
                    autoFocus
                    maxLength={100}
                    onSubmitEditing={handleSave}
                    returnKeyType="done"
                  />
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={onClose}
                    style={[
                      styles.btn,
                      {
                        backgroundColor: colors.surfaceContainer,
                        borderRadius: radii.full,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={!name.trim() || loading}
                    style={[
                      styles.btn,
                      {
                        backgroundColor: name.trim() ? colors.primaryContainer : colors.surfaceContainerHigh,
                        borderRadius: radii.full,
                        marginLeft: 12,
                        opacity: name.trim() ? 1 : 0.5,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        typography.labelMd,
                        {
                          color: name.trim() ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {loading ? 'Saving…' : 'Rename'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  keyboardContainer: {
    width: '100%',
    maxWidth: 380,
  },
  card: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
