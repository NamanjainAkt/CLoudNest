// components/dashboard/RecentFilesList.tsx
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, Film, Presentation, File, Lock, ChevronRight } from 'lucide-react-native';
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
              <Lock size={10} color={colors.primary} />
              <Text
                style={[
                  typography.monoSm,
                  { color: colors.primary, fontSize: 10, marginLeft: 3 },
                ]}
              >
                E2EE
              </Text>
            </View>
          </View>

          {/* Bottom filename & metadata */}
          <View style={styles.cardBottom}>
            <Text
              style={[typography.bodyLg, { color: colors.onSurface, fontWeight: '500' }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>
                {sizeMB} MB
              </Text>
              <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, marginHorizontal: 4 }]}>
                •
              </Text>
              <Text style={[typography.monoSm, { color: colors.primary }]}>Synced</Text>
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
        <Text style={[typography.headlineSm, { color: colors.onSurface }]}>Recent Files</Text>
        {files.length > 0 && onSeeAllPress && (
          <TouchableOpacity
            onPress={onSeeAllPress}
            style={styles.seeAllButton}
            activeOpacity={0.7}
          >
            <Text style={[typography.labelMd, { color: colors.primary }]}>See all</Text>
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
          <File size={28} color={colors.outline} style={{ opacity: 0.6 }} />
          <Text
            style={[
              typography.headlineSm,
              { color: colors.onSurface, marginTop: 8, fontSize: 15 },
            ]}
          >
            No Files in Vault
          </Text>
          <Text
            style={[
              typography.bodySm,
              { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 3 },
            ]}
          >
            Tap the + button below to encrypt and upload your first file.
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
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContent: {
    paddingRight: 16,
  },
  fileCard: {
    width: 220,
    height: 120,
    padding: 14,
    borderWidth: 1,
    marginRight: 12,
    justifyContent: 'space-between',
  },
  cardTopRow: {
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
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  cardBottom: {
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  emptyRecentsCard: {
    width: '100%',
    padding: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
});
