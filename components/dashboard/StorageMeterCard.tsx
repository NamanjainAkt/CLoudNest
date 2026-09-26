// components/dashboard/StorageMeterCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Cloud, Lock, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { MultiSegmentProgress } from '../common/ProgressBar';
import { StorageBreakdown } from '../../services/types/models';

export interface StorageMeterCardProps {
  stats: StorageBreakdown;
  onManagePress?: () => void;
}

export const StorageMeterCard: React.FC<StorageMeterCardProps> = ({ stats, onManagePress }) => {
  const { colors, typography, radii, spacing } = useTheme();

  const formatBytes = (bytes: number) => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const totalUsed = stats.totalUsedBytes || 0;
  const isZero = totalUsed === 0;

  // Compute percentages strictly based on real data (no dummy fallback percentages)
  const mediaPercent = isZero ? 0 : Math.round(((stats.mediaBytes || 0) / totalUsed) * 100);
  const docsPercent = isZero ? 0 : Math.round(((stats.docsBytes || 0) / totalUsed) * 100);
  const archivesPercent = isZero ? 0 : Math.max(0, 100 - mediaPercent - docsPercent);

  return (
    <View
      style={[
        styles.cardContainer,
        {
          borderRadius: radii.default,
          backgroundColor: colors.surfaceContainer,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.iconTitleRow}>
          <Cloud size={17} color={colors.primary} />
          <Text
            style={[
              typography.labelSm,
              { color: colors.onSurface, marginLeft: 6, fontWeight: '600', letterSpacing: 0.5 },
            ]}
          >
            Cloud Storage
          </Text>
        </View>

        <View
          style={[
            styles.zeroKnowledgePill,
            { backgroundColor: colors.surfaceContainerHighest },
          ]}
        >
          <Cloud size={11} color={colors.primary} />
          <Text
            style={[
              typography.monoSm,
              { color: colors.primary, marginLeft: 4, fontSize: 10, fontWeight: '600' },
            ]}
          >
            TELEGRAM CLOUD
          </Text>
        </View>
      </View>

      {/* Hero Numbers */}
      <View style={styles.heroNumbersRow}>
        <Text style={[typography.display, { color: colors.onSurface, fontSize: 28, fontWeight: '700' }]}>
          {formatBytes(totalUsed)}
        </Text>
        <Text
          style={[
            typography.bodyMd,
            { color: colors.onSurfaceVariant, marginLeft: 8, marginBottom: 2, fontSize: 13 },
          ]}
        >
          {isZero ? 'used of unlimited Cloud Storage' : 'of unlimited Cloud Storage'}
        </Text>
      </View>

      {/* 3-Segment Progress Bar */}
      <MultiSegmentProgress
        mediaPercent={mediaPercent}
        docsPercent={docsPercent}
        archivesPercent={archivesPercent}
        style={{ marginVertical: 6 }}
      />

      {/* Legend Breakdown */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 11 }]}>
            Photos {formatBytes(stats.mediaBytes || 0)}
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.secondaryContainer }]} />
          <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 11 }]}>
            Documents {formatBytes(stats.docsBytes || 0)}
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.tertiary }]} />
          <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 11 }]}>
            Other Files {formatBytes(stats.archivesBytes || 0)}
          </Text>
        </View>
      </View>

      {/* Manage Storage Action */}
      {onManagePress && (
        <TouchableOpacity
          onPress={onManagePress}
          activeOpacity={0.7}
          style={styles.manageButton}
        >
          <Text style={[typography.labelMd, { color: colors.primary, fontSize: 13 }]}>Manage Storage</Text>
          <ArrowRight size={13} color={colors.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: 14,
    borderWidth: 1,
    marginVertical: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zeroKnowledgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  heroNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
});
