// components/file-manager/FileListItem.tsx
import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText, Image, Film, FileArchive, File, Lock, ShieldCheck, MoreVertical } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FileRecord } from '../../services/types/models';

export interface FileListItemProps {
  file: FileRecord;
  onPress: (file: FileRecord) => void;
  onMorePress?: (file: FileRecord) => void;
}

export const FileListItem = memo<FileListItemProps>(({ file, onPress, onMorePress }) => {
  const { colors, typography, radii } = useTheme();

  const getFileIcon = (ext: string) => {
    const lower = ext.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(lower)) {
      return {
        icon: <Image size={20} color={colors.primary} />,
        bg: colors.primaryContainer + '25',
      };
    }
    if (['mov', 'mp4', 'm4v'].includes(lower)) {
      return {
        icon: <Film size={20} color={colors.secondary} />,
        bg: colors.secondaryContainer + '25',
      };
    }
    if (['zip', 'tar', 'gz', 'enc'].includes(lower)) {
      return {
        icon: <FileArchive size={20} color={colors.tertiary} />,
        bg: colors.tertiaryContainer + '30',
      };
    }
    if (['pdf'].includes(lower)) {
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

  const { icon, bg } = getFileIcon(file.extension);
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
  const chunkText = file.telegramMessageId ? `Telegram Chunk #${file.telegramMessageId}` : 'E2EE Local';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(file)}
      style={[
        styles.rowContainer,
        {
          borderRadius: radii.md,
          backgroundColor: colors.surfaceContainer,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.leftGroup}>
        {/* File icon with small lock pill */}
        <View style={[styles.iconBox, { backgroundColor: bg }]}>
          {icon}
          {file.isEncrypted && (
            <View style={[styles.lockBadge, { backgroundColor: colors.primary }]}>
              <Lock size={8} color={colors.onPrimary} />
            </View>
          )}
        </View>

        {/* Text information */}
        <View style={styles.infoCol}>
          <Text
            style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '500' }]}
            numberOfLines={1}
          >
            {file.name}
          </Text>
          <Text
            style={[
              typography.monoSm,
              { color: colors.onSurfaceVariant, marginTop: 2 },
            ]}
            numberOfLines={1}
          >
            {sizeMB} MB • {chunkText}
          </Text>
        </View>
      </View>

      {/* Verified Shield & Context Menu */}
      <View style={styles.rightGroup}>
        <View
          style={[
            styles.shieldBox,
            { backgroundColor: colors.primaryContainer + '20' },
          ]}
        >
          <ShieldCheck size={14} color={colors.primary} />
        </View>

        <TouchableOpacity
          onPress={() => onMorePress && onMorePress(file)}
          style={styles.moreButton}
          activeOpacity={0.7}
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
    padding: 10,
    marginVertical: 4,
    borderWidth: 1,
    minHeight: 56,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    marginLeft: 10,
    flex: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  moreButton: {
    padding: 6,
  },
});
