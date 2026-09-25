import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { Folder, Lock, ShieldCheck, Send, MoreVertical, Plus, Edit2, Trash2, FolderOpen, X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FolderRecord } from '../../services/types/models';
import { useVaultStore } from '../../store/useVaultStore';
import { CustomConfirmDialog } from '../common/CustomConfirmDialog';

export interface FolderGridProps {
  folders: FolderRecord[];
  onCreateFolderPress?: () => void;
}

export const FolderGrid: React.FC<FolderGridProps> = ({ folders, onCreateFolderPress }) => {
  const { colors, typography, radii } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const cardWidth = isTablet ? '31.3%' : '48.5%';
  const renameFolder = useVaultStore((s) => s.renameFolder);
  const deleteFolder = useVaultStore((s) => s.deleteFolder);

  const [selectedFolder, setSelectedFolder] = useState<FolderRecord | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const getFolderIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('vault') || lower.includes('personal')) {
      return {
        icon: <Lock size={16} color={colors.primary} />,
        bg: colors.primaryContainer + '25',
      };
    }
    if (lower.includes('legal') || lower.includes('tax')) {
      return {
        icon: <ShieldCheck size={16} color={colors.tertiary} />,
        bg: colors.tertiaryContainer + '30',
      };
    }
    if (lower.includes('media') || lower.includes('saved')) {
      return {
        icon: <Send size={16} color={colors.primary} />,
        bg: colors.primaryContainer + '25',
      };
    }
    return {
      icon: <Folder size={16} color={colors.secondary} />,
      bg: colors.secondaryContainer + '25',
    };
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={[typography.headlineSm, { color: colors.onSurface, fontSize: 16 }]}>Folders</Text>
          <Text
            style={[
              typography.monoSm,
              { color: colors.onSurfaceVariant, marginLeft: 6, fontSize: 12 },
            ]}
          >
            ({folders.length})
          </Text>
        </View>

        {onCreateFolderPress && (
          <TouchableOpacity
            onPress={onCreateFolderPress}
            style={styles.createFolderBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Create Folder"
          >
            <Plus size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* Responsive Grid or Empty State */}
      {folders.length === 0 ? (
        <View
          style={[
            styles.emptyFolderCard,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderColor: colors.borderSubtle,
              borderRadius: radii.default,
            },
          ]}
        >
          <Folder size={28} color={colors.outline} style={{ opacity: 0.6 }} />
          <Text
            style={[
              typography.headlineSm,
              { color: colors.onSurface, marginTop: 6, fontSize: 14 },
            ]}
          >
            No Folders Created
          </Text>
          <Text
            style={[
              typography.bodySm,
              { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 2, fontSize: 12, maxWidth: 260 },
            ]}
          >
            Create folders to organize your files and documents.
          </Text>
          {onCreateFolderPress && (
            <TouchableOpacity
              onPress={onCreateFolderPress}
              style={[
                styles.emptyActionBtn,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
              activeOpacity={0.7}
            >
              <Plus size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[typography.labelSm, { color: colors.primary, fontWeight: '600', fontSize: 12 }]}>
                New Folder
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {folders.map((folder) => {
            const { icon, bg } = getFolderIcon(folder.name);
            const formatBytes = (bytes: number) => {
              if (bytes <= 0) return '0 B';
              const k = 1024;
              const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
              const i = Math.floor(Math.log(bytes) / Math.log(k));
              return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
            };
            const sizeStr = formatBytes(folder.totalSize || 0);
            const itemsCount = folder.itemCount || 0;

            return (
              <TouchableOpacity
                key={folder.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/folder/${folder.id}` as any)}
                style={[
                  styles.folderCard,
                  {
                    width: cardWidth as any,
                    borderRadius: radii.default,
                    backgroundColor: colors.surfaceContainer,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: bg }]}>{icon}</View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedFolder(folder);
                      setActionModalVisible(true);
                    }}
                    style={styles.moreBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MoreVertical size={16} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardBody}>
                  <Text
                    style={[typography.headlineSm, { color: colors.onSurface, fontSize: 14 }]}
                    numberOfLines={1}
                  >
                    {folder.name}
                  </Text>
                  <Text
                    style={[
                      typography.monoSm,
                      { color: colors.onSurfaceVariant, marginTop: 2, fontSize: 11 },
                    ]}
                  >
                    {itemsCount} {itemsCount === 1 ? 'item' : 'items'} • {sizeStr}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Folder Action Sheet */}
      {actionModalVisible && selectedFolder && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 100 },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActionModalVisible(false)}
          />
          <View
            style={{
              backgroundColor: colors.surfaceContainerLow,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 36,
              borderTopWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text style={[typography.headlineSm, { color: colors.onSurface, marginBottom: 16 }]}>
              {selectedFolder.name}
            </Text>

            <TouchableOpacity
              onPress={() => {
                setActionModalVisible(false);
                router.push(`/folder/${selectedFolder.id}` as any);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
            >
              <FolderOpen size={18} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={[typography.bodyMd, { color: colors.onSurface }]}>Open Folder</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActionModalVisible(false);
                setNewName(selectedFolder.name);
                setRenameModalVisible(true);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
            >
              <Edit2 size={18} color={colors.onSurface} style={{ marginRight: 12 }} />
              <Text style={[typography.bodyMd, { color: colors.onSurface }]}>Rename Folder</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActionModalVisible(false);
                setDeleteConfirmVisible(true);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
            >
              <Trash2 size={18} color={colors.error} style={{ marginRight: 12 }} />
              <Text style={[typography.bodyMd, { color: colors.error, fontWeight: '600' }]}>Delete Folder</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Rename Folder Modal */}
      {renameModalVisible && selectedFolder && (
        <Modal visible={renameModalVisible} transparent animationType="fade" onRequestClose={() => setRenameModalVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setRenameModalVisible(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
              <TouchableWithoutFeedback>
                <View style={{ backgroundColor: colors.surfaceContainerLow, borderRadius: radii.lg, padding: 20, borderWidth: 1, borderColor: colors.borderSubtle }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={[typography.headlineSm, { color: colors.onSurface }]}>Rename Folder</Text>
                    <TouchableOpacity onPress={() => setRenameModalVisible(false)}>
                      <X size={18} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[{ backgroundColor: colors.surfaceContainerLowest, borderColor: colors.borderSubtle, borderWidth: 1, borderRadius: radii.default, color: colors.onSurface, padding: 12, marginBottom: 16 }, typography.bodyMd]}
                    value={newName}
                    onChangeText={setNewName}
                    autoFocus
                    maxLength={40}
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => setRenameModalVisible(false)}
                      style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.full, backgroundColor: colors.surfaceContainer }}
                    >
                      <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={async () => {
                        const trimmed = newName.trim();
                        if (trimmed && trimmed !== selectedFolder.name) {
                          await renameFolder(selectedFolder.id, trimmed);
                        }
                        setRenameModalVisible(false);
                      }}
                      style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.full, backgroundColor: colors.primary }}
                    >
                      <Text style={[typography.labelMd, { color: colors.onPrimary, fontWeight: '600' }]}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Delete Folder Confirmation Dialog */}
      <CustomConfirmDialog
        visible={deleteConfirmVisible}
        title="Delete Folder"
        message={`Are you sure you want to move "${selectedFolder?.name || 'this folder'}" and all its files to trash?`}
        confirmLabel="Move to Trash"
        isDestructive
        icon="trash"
        confirmLoading={deleteLoading}
        onConfirm={async () => {
          if (selectedFolder) {
            try {
              setDeleteLoading(true);
              await deleteFolder(selectedFolder.id);
              setDeleteLoading(false);
              setDeleteConfirmVisible(false);
            } catch {
              setDeleteLoading(false);
              setDeleteConfirmVisible(false);
            }
          }
        }}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createFolderBtn: {
    padding: 4,
  },
  moreBtn: {
    padding: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  folderCard: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    marginTop: 6,
  },
  emptyFolderCard: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 8,
  },
});
