// app/folder/[folderId].tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Lock,
  Plus,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme/ThemeContext';
import { BreadcrumbBar } from '../../components/file-manager/BreadcrumbBar';
import { FilterChip } from '../../components/common/FilterChip';
import { FileListItem } from '../../components/file-manager/FileListItem';
import { UploadBottomSheet } from '../../components/file-manager/UploadBottomSheet';
import { CreateFolderModal } from '../../components/file-manager/CreateFolderModal';
import { FileDao, FolderDao } from '../../services/db/dbClient';
import { FileRecord, FolderRecord } from '../../services/types/models';
import { useVaultStore } from '../../store/useVaultStore';

export default function FolderBrowserScreen() {
  const { colors, typography, radii } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ folderId: string }>();
  const addUploadQueueItem = useVaultStore((s) => s.addUploadQueueItem);
  const createFolder = useVaultStore((s) => s.createFolder);

  const folderId = params.folderId === 'root' ? null : params.folderId;
  const [folder, setFolder] = useState<FolderRecord | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isGridView, setIsGridView] = useState<boolean>(false);
  const [sheetVisible, setSheetVisible] = useState<boolean>(false);
  const [folderModalVisible, setFolderModalVisible] = useState<boolean>(false);

  const loadFolderContent = useCallback(async () => {
    try {
      if (folderId) {
        const f = await FolderDao.getFolderById(folderId);
        setFolder(f);
      }
      const fileList = await FileDao.getFilesInFolder(folderId);
      setFiles(fileList);
    } catch (err) {
      console.error(err);
    }
  }, [folderId]);

  useEffect(() => {
    loadFolderContent();
  }, [loadFolderContent]);

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        await addUploadQueueItem({
          filePath: file.uri,
          fileName: file.name,
          fileSize: file.size || 1024 * 1024 * 2,
          mimeType: file.mimeType || 'application/octet-stream',
          targetFolderId: folderId,
          totalChunks: Math.max(1, Math.ceil((file.size || 1024 * 1024 * 2) / (512 * 1024))),
        });
        setSheetVisible(false);
        router.push('/(tabs)/uploads');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const fileName = asset.fileName || `IMG_${Date.now()}.jpg`;
        await addUploadQueueItem({
          filePath: asset.uri,
          fileName,
          fileSize: asset.fileSize || 1024 * 1024 * 3,
          mimeType: asset.mimeType || 'image/jpeg',
          targetFolderId: folderId,
          totalChunks: Math.max(1, Math.ceil((asset.fileSize || 1024 * 1024 * 3) / (512 * 1024))),
        });
        setSheetVisible(false);
        router.push('/(tabs)/uploads');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const res = await ImagePicker.launchCameraAsync({
        quality: 1,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const fileName = `PHOTO_${Date.now()}.jpg`;
        await addUploadQueueItem({
          filePath: asset.uri,
          fileName,
          fileSize: asset.fileSize || 1024 * 1024 * 2.5,
          mimeType: 'image/jpeg',
          targetFolderId: folderId,
          totalChunks: 5,
        });
        setSheetVisible(false);
        router.push('/(tabs)/uploads');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFolder = () => {
    setSheetVisible(false);
    setFolderModalVisible(true);
  };

  const filteredFiles = files.filter((f) => {
    if (filter === 'all') return true;
    if (filter === 'docs') return ['pdf', 'doc', 'docx', 'txt', 'key', 'xlsx'].includes(f.extension.toLowerCase());
    if (filter === 'images') return ['jpg', 'jpeg', 'png', 'webp'].includes(f.extension.toLowerCase());
    if (filter === 'encrypted') return f.isEncrypted;
    return true;
  });

  const totalSizeBytes = files.reduce((acc, curr) => acc + curr.size, 0);
  const totalSizeFormatted =
    totalSizeBytes < 1024
      ? `${totalSizeBytes} B`
      : totalSizeBytes < 1024 * 1024
      ? `${(totalSizeBytes / 1024).toFixed(1)} KB`
      : `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`;

  const formattedModified = folder?.updatedAt
    ? `Modified ${new Date(folder.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
    : files.length > 0
    ? 'Modified Recently'
    : 'Empty';

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      {/* Top Header */}
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
          {folder?.name || 'All Files'}
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/search')}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <Search size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsGridView((prev) => !prev)}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            {isGridView ? (
              <List size={18} color={colors.onSurfaceVariant} />
            ) : (
              <LayoutGrid size={18} color={colors.onSurfaceVariant} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <SlidersHorizontal size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContainer}>
        {/* Interactive Breadcrumb Bar */}
        <BreadcrumbBar
          items={folder ? [{ id: folder.id, label: folder.name }] : []}
          onSelect={(item) => {
            if (item.id === null) {
              router.back();
            }
          }}
        />

        {/* Telemetry & Cryptographic Verification Strip */}
        <View
          style={[
            styles.telemetryStrip,
            {
              backgroundColor: colors.surfaceContainerLowest,
              borderRadius: radii.default,
            },
          ]}
        >
          <View style={styles.telemetryTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Lock size={14} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[typography.monoSm, { color: colors.onSurface, fontWeight: '600' }]}>
                {files.length} {files.length === 1 ? 'file' : 'files'} • {totalSizeFormatted}
              </Text>
            </View>
            <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>
              {formattedModified}
            </Text>
          </View>

          <View style={styles.telemetryBottom}>
            <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, fontSize: 11 }]}>
              Fully encrypted with <Text style={{ color: colors.onSurface, fontWeight: '600' }}>AES-256-GCM</Text> • Synced to Telegram Chunks
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filtersRow}>
          <FilterChip
            label={`All (${files.length})`}
            active={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <FilterChip
            label="Documents"
            active={filter === 'docs'}
            onPress={() => setFilter('docs')}
          />
          <FilterChip
            label="Images"
            active={filter === 'images'}
            onPress={() => setFilter('images')}
          />
          <FilterChip
            label="Encrypted"
            active={filter === 'encrypted'}
            onPress={() => setFilter('encrypted')}
          />
        </View>

        {/* File List */}
        <FlatList
          data={filteredFiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
                This folder is empty.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <FileListItem
              file={item}
              onPress={(f) => router.push(`/file/${f.id}` as any)}
            />
          )}
        />
      </View>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          onPress={() => setSheetVisible(true)}
          style={[
            styles.fab,
            {
              backgroundColor: colors.primaryContainer,
              shadowColor: colors.primaryContainer,
            },
          ]}
          activeOpacity={0.9}
        >
          <Plus size={26} color={colors.onPrimaryContainer} />
        </TouchableOpacity>
      </View>

      {/* Upload Bottom Sheet */}
      <UploadBottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onPickDocument={handlePickDocument}
        onPickImage={handlePickImage}
        onTakePhoto={handleTakePhoto}
        onCreateFolder={handleCreateFolder}
      />

      {/* Cross-Platform Folder Creation Modal */}
      <CreateFolderModal
        visible={folderModalVisible}
        onClose={() => setFolderModalVisible(false)}
        onCreate={async (folderName) => {
          await createFolder(folderName, folderId);
          await loadFolderContent();
        }}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  telemetryStrip: {
    padding: 12,
    marginVertical: 10,
  },
  telemetryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    zIndex: 40,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
