// components/dashboard/RecentFilesList.tsx
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, Film, Presentation, File, Cloud, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FileRecord } from '../../services/types/models';

export interface RecentFilesListProps {
  files: FileRecord[];
  onSeeAllPress?: () => void;
}

export const RecentFilesList: React.FC<RecentFilesListProps> = ({ files, onSeeAllPress }) => {
  const { colors, typography, radii } = useTheme();
  const router = useRouter();

  const renderItem = useCallback(
    ({ item }: { item: FileRecord }) => {
      const ext = item.extension.toLowerCase();
      let icon = <FileText size={20} color={colors.error} />;
      let iconBg = colors.errorContainer + '40';

      if (['mov', 'mp4'].includes(ext)) {
        icon = <Film size={20} color={colors.secondary} />;
        iconBg = colors.secondaryContainer + '30';
      } else if (['key', 'ppt', 'pptx'].includes(ext)) {
        icon = <Presentation size={20} color={colors.tertiary} />;
        iconBg = colors.tertiaryContainer + '40';
      } else if (!['pdf'].includes(ext)) {
        icon = <File size={20} color={colors.primary} />;
        iconBg = colors.primaryContainer + '30';
      }

      const sizeMB = (item.size / (1024 * 1024)).toFixed(1);

      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push(`/file/${item.id}` as any)}
          style={[
            styles.fileCard,
            {
              borderRadius: radii.default,
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          {/* Top row with icon & badge */}
          <View style={styles.cardTopRow}>
            <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>{icon}</View>

            <View
              style={[
                styles.badgePill,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            >
              <Cloud size={10} color={colors.primary} />
              <Text
                style={[
                  typography.monoSm,
                  { color: colors.primary, fontSize: 10, marginLeft: 3 },
                ]}
              >
                Cloud
              </Text>
            </View>
          </View>

          {/* Bottom filename & metadata */}
          <View style={styles.cardBottom}>
            <Text
              style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '600', fontSize: 13 }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 11 }]}>
                {sizeMB} MB
              </Text>
              <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, marginHorizontal: 4 }]}>
                •
              </Text>
              <Text style={[typography.monoSm, { color: colors.primary, fontSize: 11 }]}>Saved</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, typography, radii, router]
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={[typography.headlineSm, { color: colors.onSurface, fontSize: 16 }]}>Recent Files</Text>
        {files.length > 0 && onSeeAllPress && (
          <TouchableOpacity
            onPress={onSeeAllPress}
            style={styles.seeAllButton}
            activeOpacity={0.7}
          >
            <Text style={[typography.labelMd, { color: colors.primary, fontSize: 13 }]}>See all</Text>
            <ChevronRight size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {files.length === 0 ? (
        <View
          style={[
            styles.emptyRecentsCard,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderColor: colors.borderSubtle,
              borderRadius: radii.default,
            },
          ]}
        >
          <File size={24} color={colors.outline} style={{ opacity: 0.6 }} />
          <Text
            style={[
              typography.headlineSm,
              { color: colors.onSurface, marginTop: 6, fontSize: 14 },
            ]}
          >
            No Recent Files
          </Text>
          <Text
            style={[
              typography.bodySm,
              { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 2, fontSize: 12 },
            ]}
          >
            Tap the + button below to upload your first file.
          </Text>
        </View>
      ) : (
        <FlatList
          data={files}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContent: {
    paddingRight: 16,
  },
  fileCard: {
    width: 190,
    height: 108,
    padding: 12,
    borderWidth: 1,
    marginRight: 10,
    justifyContent: 'space-between',
  },
  cardTopRow: {
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
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  cardBottom: {
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  emptyRecentsCard: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
});
