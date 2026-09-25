// components/dashboard/FolderGrid.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const cardWidth = isTablet ? '31.3%' : '48.5%';

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
                  <MoreVertical size={15} color={colors.onSurfaceVariant} />
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
