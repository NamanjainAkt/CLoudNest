// components/dashboard/FolderGrid.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Folder, Lock, ShieldCheck, Send, MoreVertical, Plus } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FolderRecord } from '../../services/types/models';

export interface FolderGridProps {
  folders: FolderRecord[];
  onCreateFolderPress?: () => void;
}

export const FolderGrid: React.FC<FolderGridProps> = ({ folders, onCreateFolderPress }) => {
  const { colors, typography, radii } = useTheme();
  const router = useRouter();

  const getFolderIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('vault') || lower.includes('personal')) {
      return {
        icon: <Lock size={18} color={colors.primary} />,
        bg: colors.primaryContainer + '25',
      };
    }
    if (lower.includes('legal') || lower.includes('tax')) {
      return {
        icon: <ShieldCheck size={18} color={colors.tertiary} />,
        bg: colors.tertiaryContainer + '30',
      };
    }
    if (lower.includes('media') || lower.includes('saved')) {
      return {
        icon: <Send size={18} color={colors.primary} />,
        bg: colors.primaryContainer + '25',
      };
    }
    return {
      icon: <Folder size={18} color={colors.secondary} />,
      bg: colors.secondaryContainer + '25',
    };
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={[typography.headlineSm, { color: colors.onSurface }]}>Folders</Text>
          <Text
            style={[
              typography.monoSm,
              { color: colors.onSurfaceVariant, marginLeft: 6 },
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
            <Plus size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* 2-Column Bento Grid or Empty State */}
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
          <Folder size={32} color={colors.outline} style={{ opacity: 0.6 }} />
          <Text
            style={[
              typography.headlineSm,
              { color: colors.onSurface, marginTop: 10, fontSize: 15 },
            ]}
          >
            No Folders Yet
          </Text>
          <Text
            style={[
              typography.bodySm,
              { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4, maxWidth: 240 },
            ]}
          >
            Create your first encrypted folder to organize your vault.
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
              <Plus size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[typography.labelSm, { color: colors.primary, fontWeight: '600' }]}>
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
                    borderRadius: radii.default,
                    backgroundColor: colors.surfaceContainer,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: bg }]}>{icon}</View>
                  <MoreVertical size={16} color={colors.onSurfaceVariant} />
                </View>

                <View style={styles.cardBody}>
                  <Text
                    style={[typography.headlineSm, { color: colors.onSurface, fontSize: 16 }]}
                    numberOfLines={1}
                  >
                    {folder.name}
                  </Text>
                  <Text
                    style={[
                      typography.monoSm,
                      { color: colors.onSurfaceVariant, marginTop: 4 },
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createFolderBtn: {
    padding: 6,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  folderCard: {
    width: '48%',
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    marginTop: 10,
  },
  emptyFolderCard: {
    width: '100%',
    padding: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 12,
  },
});
