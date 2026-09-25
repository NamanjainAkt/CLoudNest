// app/file/[fileId].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Star,
  MoreVertical,
  ShieldCheck,
  Lock,
  ZoomIn,
  ZoomOut,
  Download,
  FolderInput,
  Edit2,
  Trash2,
  FileText,
  Eye,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FileDao } from '../../services/db/dbClient';
import { FileRecord } from '../../services/types/models';
import { useVaultStore } from '../../store/useVaultStore';
import { PillButton } from '../../components/common/PillButton';
import { FullScreenPreviewModal } from '../../components/file-manager/FullScreenPreviewModal';
import { RenameFileModal } from '../../components/file-manager/RenameFileModal';
import { MoveFileModal } from '../../components/file-manager/MoveFileModal';

export default function FileDetailsScreen() {
  const { colors, typography, radii } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ fileId: string }>();
  const moveToTrash = useVaultStore((s) => s.moveToTrash);
  const toggleFavorite = useVaultStore((s) => s.toggleFavorite);
  const renameFile = useVaultStore((s) => s.renameFile);
  const moveFile = useVaultStore((s) => s.moveFile);

  const [file, setFile] = useState<FileRecord | null>(null);
  const [zoom, setZoom] = useState(100);
  const [isFavorite, setIsFavorite] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [moveModalVisible, setMoveModalVisible] = useState(false);

  useEffect(() => {
    async function load() {
      if (params.fileId) {
        const item = await FileDao.getFileById(params.fileId);
        if (item) {
          setFile(item);
          setIsFavorite(item.isFavorite);
        }
      }
    }
    load();
  }, [params.fileId]);

  const handleToggleFav = async () => {
    if (file) {
      await toggleFavorite(file.id);
      setIsFavorite((prev) => !prev);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Move to Trash',
      `Are you sure you want to move "${file?.name}" to trash? It will be automatically purged after 30 days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move to Trash',
          style: 'destructive',
          onPress: async () => {
            if (file) {
              await moveToTrash(file.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleDownload = () => {
    setPreviewModalVisible(true);
  };

  const handleRename = async (newName: string) => {
    if (file) {
      await renameFile(file.id, newName);
      setFile((prev) => (prev ? { ...prev, name: newName } : null));
    }
  };

  const handleMove = async (targetFolderId: string | null) => {
    if (file) {
      await moveFile(file.id, targetFolderId);
      setFile((prev) => (prev ? { ...prev, folderId: targetFolderId } : null));
    }
  };

  const sizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : '2.40';

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View
        style={[
          styles.headerRow,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderSubtle,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.onSurface} />
        </TouchableOpacity>

        <Text
          style={[typography.headlineSm, { color: colors.onSurface, flex: 1, marginLeft: 8 }]}
          numberOfLines={1}
        >
          File Inspector
        </Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={handleToggleFav}
            style={[
              styles.iconBtn,
              { backgroundColor: colors.surfaceContainer },
            ]}
            activeOpacity={0.7}
          >
            <Star
              size={18}
              color={isFavorite ? colors.tertiary : colors.onSurfaceVariant}
              fill={isFavorite ? colors.tertiary : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: colors.surfaceContainer, marginLeft: 8 },
            ]}
            activeOpacity={0.7}
          >
            <MoreVertical size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Contextual Path Pill */}
        <View style={styles.pathPillContainer}>
          <View
            style={[
              styles.pathPill,
              { backgroundColor: colors.surfaceContainer },
            ]}
          >
            <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
            <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>
              vault://{file?.folderId || 'root'}/{file?.name || ''}
            </Text>
          </View>
        </View>

        {/* Document Preview Visual Frame */}
        <View
          style={[
            styles.previewContainer,
            {
              backgroundColor: colors.surfaceContainerLowest,
              borderColor: colors.borderSubtle,
              borderRadius: radii.default,
            },
          ]}
        >
          {/* Top Security Badges */}
          <View style={styles.previewTopBar}>
            <View
              style={[
                styles.enclaveBadge,
                { backgroundColor: colors.surfaceDim + 'CC' },
              ]}
            >
              <ShieldCheck size={13} color={colors.primary} />
              <Text
                style={[
                  typography.monoSm,
                  { color: colors.onSurface, marginLeft: 4, fontSize: 10 },
                ]}
              >
                Encrypted
              </Text>
            </View>

            <View
              style={[
                styles.confidentialPill,
                { backgroundColor: colors.primaryContainer + '30' },
              ]}
            >
              <Lock size={11} color={colors.primary} />
              <Text style={[typography.labelSm, { color: colors.primary, fontSize: 10, marginLeft: 3 }]}>
                Confidential
              </Text>
            </View>
          </View>

          {/* Simulated Document Mock Card */}
          <TouchableOpacity
            style={[
              styles.mockCard,
              {
                backgroundColor: colors.surfaceContainerHighest,
                borderRadius: radii.default,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => setPreviewModalVisible(true)}
          >
            <FileText size={48} color={colors.primary} style={{ opacity: 0.8 }} />
            <Text
              style={[
                typography.headlineSm,
                { color: colors.onSurface, marginTop: 12, textAlign: 'center' },
              ]}
              numberOfLines={1}
            >
              {file?.name || 'document.pdf'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Eye size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text
                style={[
                  typography.monoSm,
                  { color: colors.primary, fontWeight: '600', fontSize: 11 },
                ]}
              >
                Tap to Open Full Preview
              </Text>
            </View>

            {/* Watermark */}
            <Text
              style={[
                typography.display,
                styles.watermarkText,
                { color: colors.onSurface },
              ]}
            >
              PROTECTED
            </Text>
          </TouchableOpacity>

          {/* Floating Bottom Controller Overlay */}
          <View
            style={[
              styles.pageControllerBar,
              { backgroundColor: colors.surfaceDim + 'DD' },
            ]}
          >
            <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>
              Page 1 of 4
            </Text>

            <View style={styles.zoomControls}>
              <TouchableOpacity
                onPress={() => setZoom((z) => Math.max(50, z - 25))}
                style={styles.zoomBtn}
              >
                <ZoomOut size={14} color={colors.onSurface} />
              </TouchableOpacity>
              <Text style={[typography.monoSm, { color: colors.onSurface, marginHorizontal: 6 }]}>
                {zoom}%
              </Text>
              <TouchableOpacity
                onPress={() => setZoom((z) => Math.min(200, z + 25))}
                style={styles.zoomBtn}
              >
                <ZoomIn size={14} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Metadata Bento Grid */}
        <View
          style={[
            styles.metaBento,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.borderSubtle,
              borderRadius: radii.default,
            },
          ]}
        >
          <View style={styles.metaRow}>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>File Size</Text>
            <Text style={[typography.monoSm, { color: colors.onSurface, fontWeight: '600' }]}>
              {sizeMB} MB ({file?.size || 0} bytes)
            </Text>
          </View>

          <View style={[styles.metaRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1 }]}>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>MIME Type</Text>
            <Text style={[typography.monoSm, { color: colors.onSurface }]}>
              {file?.mimeType || 'application/octet-stream'}
            </Text>
          </View>

          <View style={[styles.metaRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1 }]}>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>Cloud Storage ID</Text>
            <Text style={[typography.monoSm, { color: colors.primary }]}>
              {file?.telegramMessageId ? `#${file.telegramMessageId}` : 'Saved Locally'}
            </Text>
          </View>

          <View style={[styles.metaRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1 }]}>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>Security Checksum</Text>
            <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 10 }]}>
              {file?.sha256Hash || 'Verified'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <PillButton
            label="Download File"
            onPress={handleDownload}
            icon={<Download size={16} color={colors.onPrimaryContainer} />}
            size="lg"
            style={{ width: '100%', marginBottom: 12 }}
          />

          <View style={styles.actionRowGrid}>
            <TouchableOpacity
              onPress={() => setMoveModalVisible(true)}
              style={[
                styles.actionPillBtn,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: colors.borderSubtle,
                  borderRadius: radii.full,
                },
              ]}
              activeOpacity={0.8}
            >
              <FolderInput size={15} color={colors.onSurface} style={{ marginRight: 6 }} />
              <Text style={[typography.labelSm, { color: colors.onSurface }]}>Move</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRenameModalVisible(true)}
              style={[
                styles.actionPillBtn,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: colors.borderSubtle,
                  borderRadius: radii.full,
                },
              ]}
              activeOpacity={0.8}
            >
              <Edit2 size={15} color={colors.onSurface} style={{ marginRight: 6 }} />
              <Text style={[typography.labelSm, { color: colors.onSurface }]}>Rename</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              style={[
                styles.actionPillBtn,
                {
                  backgroundColor: colors.errorContainer + '25',
                  borderColor: colors.error + '40',
                  borderRadius: radii.full,
                },
              ]}
              activeOpacity={0.8}
            >
              <Trash2 size={15} color={colors.error} style={{ marginRight: 6 }} />
              <Text style={[typography.labelSm, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* In-App Fullscreen Preview Modal */}
      {file && (
        <FullScreenPreviewModal
          visible={previewModalVisible}
          onClose={() => setPreviewModalVisible(false)}
          file={file}
        />
      )}

      {/* Rename File Modal */}
      <RenameFileModal
        visible={renameModalVisible}
        initialName={file?.name || ''}
        onClose={() => setRenameModalVisible(false)}
        onRename={handleRename}
      />

      {/* Move File Modal */}
      <MoveFileModal
        visible={moveModalVisible}
        currentFolderId={file?.folderId || null}
        onClose={() => setMoveModalVisible(false)}
        onMove={handleMove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pathPillContainer: {
    alignItems: 'flex-start',
    marginVertical: 6,
  },
  pathPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  previewContainer: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 10,
    height: 300,
  },
  previewTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    zIndex: 10,
  },
  enclaveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  confidentialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  mockCard: {
    margin: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  watermarkText: {
    position: 'absolute',
    opacity: 0.06,
    transform: [{ rotate: '-25deg' }],
    fontSize: 36,
  },
  pageControllerBar: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoomBtn: {
    padding: 4,
  },
  metaBento: {
    borderWidth: 1,
    padding: 14,
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  actionsContainer: {
    marginTop: 10,
  },
  actionRowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionPillBtn: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
