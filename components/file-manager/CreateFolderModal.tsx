// components/file-manager/CreateFolderModal.tsx
import React, { useState } from 'react';
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
import { FolderPlus, X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface CreateFolderModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (folderName: string) => Promise<void> | void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  visible,
  onClose,
  onCreate,
}) => {
  const { colors, typography, radii } = useTheme();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await onCreate(trimmed);
      setName('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
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
                      <FolderPlus size={20} color={colors.primary} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
                        New Folder
                      </Text>
                      <Text
                        style={[
                          typography.monoSm,
                          { color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2 },
                        ]}
                      >
                        Organize your files
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleClose}
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
                    placeholder="Enter folder name"
                    placeholderTextColor={colors.onSurfaceVariant}
                    autoFocus
                    maxLength={40}
                    onSubmitEditing={handleCreate}
                    returnKeyType="done"
                  />
                </View>

                {/* Buttons */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={handleClose}
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
                    onPress={handleCreate}
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
                      {loading ? 'Creating…' : 'Create'}
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
    width: 40,
    height: 40,
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
