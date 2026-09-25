// components/queue/QueueItemRow.tsx
import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Film, FileArchive, FileText, File, Pause, Play, X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { UploadQueueItem } from '../../services/types/models';
import { GlowingProgressBar } from '../common/ProgressBar';

export interface QueueItemRowProps {
  item: UploadQueueItem;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry?: (id: string) => void;
}

export const QueueItemRow = memo<QueueItemRowProps>(({
  item,
  onPause,
  onResume,
  onCancel,
  onRetry,
}) => {
  const { colors, typography, radii } = useTheme();

  const getIcon = (mime: string, name: string) => {
    if (mime.includes('video') || name.endsWith('.mov') || name.endsWith('.mp4')) {
      return {
        icon: <Film size={20} color={colors.primary} />,
        bg: colors.primaryContainer + '25',
      };
    }
    if (mime.includes('zip') || name.endsWith('.zip') || name.endsWith('.tar')) {
      return {
        icon: <FileArchive size={20} color={colors.tertiary} />,
        bg: colors.tertiaryContainer + '30',
      };
    }
    if (mime.includes('pdf') || name.endsWith('.pdf')) {
      return {
        icon: <FileText size={20} color={colors.error} />,
        bg: colors.errorContainer + '30',
      };
    }
    return {
      icon: <File size={20} color={colors.primary} />,
      bg: colors.primaryContainer + '25',
    };
  };

  const { icon, bg } = getIcon(item.mimeType, item.fileName);
  const sizeMB = (item.fileSize / (1024 * 1024)).toFixed(1);
  const percentText = Math.round(item.progress * 100);

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
      {/* Top Details Row */}
      <View style={styles.topRow}>
        <View style={styles.leftInfo}>
          <View style={[styles.iconBox, { backgroundColor: bg }]}>{icon}</View>
          <View style={styles.textColumn}>
            <Text
              style={[typography.headlineSm, { color: colors.onSurface, fontSize: 14 }]}
              numberOfLines={1}
            >
              {item.fileName}
            </Text>
            <Text
              style={[
                typography.monoSm,
                { color: colors.onSurfaceVariant, marginTop: 2 },
              ]}
              numberOfLines={1}
            >
              {item.status === 'completed'
                ? `${sizeMB} MB • Completed`
                : item.status === 'failed'
                ? (item.errorMessage ? `Failed: ${item.errorMessage}` : 'Upload Failed • Tap retry')
                : `${(item.fileSize * item.progress / (1024 * 1024)).toFixed(1)} MB of ${sizeMB} MB • ${percentText}%`}
            </Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.actionControls}>
          {item.status === 'uploading' && (
            <TouchableOpacity
              onPress={() => onPause(item.id)}
              style={[styles.circleAction, { backgroundColor: colors.surfaceContainerHigh }]}
              activeOpacity={0.7}
            >
              <Pause size={14} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}

          {item.status === 'paused' && (
            <TouchableOpacity
              onPress={() => onResume(item.id)}
              style={[styles.circleAction, { backgroundColor: colors.surfaceContainerHigh }]}
              activeOpacity={0.7}
            >
              <Play size={14} color={colors.primary} />
            </TouchableOpacity>
          )}

          {item.status === 'failed' && onRetry && (
            <TouchableOpacity
              onPress={() => onRetry(item.id)}
              style={[styles.circleAction, { backgroundColor: colors.errorContainer + '40' }]}
              activeOpacity={0.7}
            >
              <RefreshCw size={14} color={colors.error} />
            </TouchableOpacity>
          )}

          {item.status === 'completed' ? (
            <View style={styles.checkDone}>
              <CheckCircle2 size={20} color={colors.secondary} />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => onCancel(item.id)}
              style={[styles.circleAction, { backgroundColor: colors.surfaceContainerHigh }]}
              activeOpacity={0.7}
            >
              <X size={14} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={{ marginVertical: 8 }}>
        <GlowingProgressBar progress={item.progress} />
      </View>

      {/* Chunk & Speed Footer */}
      <View style={styles.footerRow}>
        <View style={styles.chunkStatus}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.status === 'completed'
                    ? colors.secondary
                    : item.status === 'failed'
                    ? colors.error
                    : colors.primary,
              },
            ]}
          />
          <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>
            {item.status === 'completed'
              ? 'Uploaded to Cloud'
              : item.status === 'failed'
              ? 'Upload Failed'
              : `Part ${item.currentChunk} of ${item.totalChunks} uploaded`}
          </Text>
        </View>

        <Text
          style={[
            typography.monoSm,
            {
              color: item.status === 'completed' ? colors.secondary : colors.primary,
              fontWeight: '600',
            },
          ]}
        >
          {item.status === 'uploading' ? item.speed : item.status.toUpperCase()}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    padding: 14,
    borderWidth: 1,
    marginVertical: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    marginLeft: 10,
    flex: 1,
  },
  actionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circleAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chunkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
});
