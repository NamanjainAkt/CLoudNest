// components/file-manager/FileListItem.tsx
import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image as RNImage } from 'react-native';
import {
  FileText,
  Image as ImageIcon,
  Film,
  FileArchive,
  Music,
  File,
  Lock,
  Star,
  MoreVertical,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FileRecord } from '../../services/types/models';
import { CacheManager } from '../../services/storage/cacheManager';

export interface FileListItemProps {
  file: FileRecord;
  onPress: (file: FileRecord) => void;
  onMorePress?: (file: FileRecord) => void;
}

export const FileListItem = memo<FileListItemProps>(({ file, onPress, onMorePress }) => {
  const { colors, typography, radii } = useTheme();
  const [imageLoadError, setImageLoadError] = useState(false);

  const ext = file.extension.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);

  const getFileIcon = (extension: string) => {
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
      return {
        icon: <ImageIcon size={20} color={colors.primary} />,
        bg: colors.primaryContainer + '25',
      };
    }
    if (['mov', 'mp4', 'm4v'].includes(extension)) {
      return {
        icon: <Film size={20} color={colors.secondary} />,
        bg: colors.secondaryContainer + '25',
      };
    }
    if (['zip', 'tar', 'gz', 'enc', '7z', 'rar'].includes(extension)) {
      return {
        icon: <FileArchive size={20} color={colors.tertiary} />,
        bg: colors.tertiaryContainer + '30',
      };
    }
    if (['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'].includes(extension)) {
      return {
        icon: <Music size={20} color={colors.tertiary} />,
        bg: colors.tertiaryContainer + '25',
      };
    }
    if (['pdf', 'doc', 'docx', 'txt', 'key', 'xlsx', 'asc', 'csv', 'md', 'json', 'log'].includes(extension)) {
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

  const { icon, bg } = getFileIcon(ext);
  const formattedSize = CacheManager.formatBytes(file.size);
  const isSynced = Boolean(file.telegramMessageId);
  const syncLabel = isSynced ? 'Cloud Synced' : 'Saved on Device';
  const hasLocalThumbnail = isImage && file.localCachePath && !imageLoadError;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(file)}
      style={[
        styles.rowContainer,
        {
          borderRadius: radii.md,
          backgroundColor: colors.surfaceContainer,
          borderColor: colors.borderSubtle,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`File ${file.name}, size ${formattedSize}`}
    >
      <View style={styles.leftGroup}>
        {/* Thumbnail or File icon */}
        <View style={[styles.iconBox, { backgroundColor: bg }]}>
          {hasLocalThumbnail ? (
            <RNImage
              source={{ uri: file.localCachePath! }}
              style={styles.thumbnail}
              resizeMode="cover"
              onError={() => setImageLoadError(true)}
            />
          ) : (
            icon
          )}
          {file.isEncrypted && (
            <View style={[styles.lockBadge, { backgroundColor: colors.primary }]}>
              <Lock size={8} color={colors.onPrimary} />
            </View>
          )}
        </View>

        {/* File name and metadata */}
        <View style={styles.infoCol}>
          <Text
            style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '600', fontSize: 14 }]}
            numberOfLines={1}
          >
            {file.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 11 }]}>
              {formattedSize}
            </Text>
            <Text style={[styles.dotSeparator, { color: colors.outlineVariant }]}>•</Text>
            <Text
              style={[
                typography.monoSm,
                { color: isSynced ? colors.primary : colors.onSurfaceVariant, fontSize: 11 },
              ]}
            >
              {syncLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* Right Actions: Favorite & Context Menu */}
      <View style={styles.rightGroup}>
        {Boolean(file.isFavorite) && (
          <View style={styles.favoriteBadge}>
            <Star size={15} color={colors.tertiary} fill={colors.tertiary} />
          </View>
        )}

        <TouchableOpacity
          onPress={() => onMorePress && onMorePress(file)}
          style={styles.moreButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <MoreVertical size={18} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 4,
    borderWidth: 1,
    minHeight: 60,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  lockBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    marginLeft: 12,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  dotSeparator: {
    marginHorizontal: 5,
    fontSize: 10,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteBadge: {
    marginRight: 4,
    padding: 4,
  },
  moreButton: {
    padding: 6,
  },
});
