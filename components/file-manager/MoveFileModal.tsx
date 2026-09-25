// components/file-manager/MoveFileModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { FolderInput, Folder, Home, X, Check } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useVaultStore } from '../../store/useVaultStore';

interface MoveFileModalProps {
  visible: boolean;
  currentFolderId: string | null;
  onClose: () => void;
  onMove: (folderId: string | null) => Promise<void> | void;
}

export const MoveFileModal: React.FC<MoveFileModalProps> = ({
  visible,
  currentFolderId,
  onClose,
  onMove,
}) => {
  const { colors, typography, radii } = useTheme();
  const folders = useVaultStore((s) => s.folders);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (targetId: string | null) => {
    if (targetId === currentFolderId) {
      onClose();
      return;
    }
    setLoading(true);
    try {
      await onMove(targetId);
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
                    <FolderInput size={18} color={colors.primary} />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
                      Move File
                    </Text>
                    <Text
                      style={[
                        typography.monoSm,
                        { color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2 },
                      ]}
                    >
                      Select Destination Directory
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

              {/* Folder List */}
              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {/* Option: Root (Top Level) */}
                <TouchableOpacity
                  onPress={() => handleSelect(null)}
                  style={[
                    styles.folderRow,
                    {
                      backgroundColor: currentFolderId === null ? colors.surfaceContainerHighest : colors.surfaceContainer,
                      borderColor: colors.borderSubtle,
                      borderRadius: radii.default,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Home size={18} color={colors.primary} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '600' }]}>
                      Vault Root (Home)
                    </Text>
                    <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 11 }]}>
                      Top level directory
                    </Text>
                  </View>
                  {currentFolderId === null && <Check size={16} color={colors.primary} />}
                </TouchableOpacity>

                {/* User Folders */}
                {folders.map((folder) => {
                  const isCurrent = folder.id === currentFolderId;
                  return (
                    <TouchableOpacity
                      key={folder.id}
                      onPress={() => handleSelect(folder.id)}
                      style={[
                        styles.folderRow,
                        {
                          backgroundColor: isCurrent ? colors.surfaceContainerHighest : colors.surfaceContainer,
                          borderColor: colors.borderSubtle,
                          borderRadius: radii.default,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Folder size={18} color={colors.secondary} style={{ marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '600' }]}>
                          {folder.name}
                        </Text>
                        <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 11 }]}>
                          {folder.itemCount || 0} {(folder.itemCount || 0) === 1 ? 'item' : 'items'}
                        </Text>
                      </View>
                      {isCurrent && <Check size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
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
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: 460,
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
  list: {
    maxHeight: 320,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
});
