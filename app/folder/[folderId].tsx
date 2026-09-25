import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
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
  Star,
  Edit2,
  FolderInput,
  Trash2,
  Eye,
  MoreVertical,
  FileText,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme/ThemeContext';
import { BreadcrumbBar } from '../../components/file-manager/BreadcrumbBar';
import { FilterChip } from '../../components/common/FilterChip';
import { FileListItem } from '../../components/file-manager/FileListItem';
import { UploadBottomSheet } from '../../components/file-manager/UploadBottomSheet';
import { CreateFolderModal } from '../../components/file-manager/CreateFolderModal';
import { RenameFileModal } from '../../components/file-manager/RenameFileModal';
import { MoveFileModal } from '../../components/file-manager/MoveFileModal';
import { FileDao, FolderDao } from '../../services/db/dbClient';
import { FileRecord, FolderRecord } from '../../services/types/models';
import { useVaultStore } from '../../store/useVaultStore';

export default function FolderBrowserScreen() {
  const { colors, typography, radii } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ folderId: string }>();
  const addUploadQueueItem = useVaultStore((s) => s.addUploadQueueItem);
  const createFolder = useVaultStore((s) => s.createFolder);
  const toggleFavorite = useVaultStore((s) => s.toggleFavorite);
  const moveToTrash = useVaultStore((s) => s.moveToTrash);
  const renameFile = useVaultStore((s) => s.renameFile);
  const moveFile = useVaultStore((s) => s.moveFile);

  const folderId = params.folderId === 'root' ? null : params.folderId;
  const [folder, setFolder] = useState<FolderRecord | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [sortMode, setSortMode] = useState<'date_desc' | 'name_asc' | 'size_desc'>('date_desc');
  const [isGridView, setIsGridView] = useState<boolean>(false);
  const [sheetVisible, setSheetVisible] = useState<boolean>(false);
  const [folderModalVisible, setFolderModalVisible] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState<boolean>(false);
  const [renameModalVisible, setRenameModalVisible] = useState<boolean>(false);
  const [moveModalVisible, setMoveModalVisible] = useState<boolean>(false);

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

          <TouchableOpacity
            style={[
              styles.iconBtn,
              sortMode !== 'date_desc' && { backgroundColor: colors.primaryContainer + '30' },
            ]}
            onPress={() => {
              if (sortMode === 'date_desc') setSortMode('name_asc');
              else if (sortMode === 'name_asc') setSortMode('size_desc');
              else setSortMode('date_desc');
            }}
            activeOpacity={0.7}
          >
            <SlidersHorizontal
              size={18}
              color={sortMode !== 'date_desc' ? colors.primary : colors.onSurfaceVariant}
            />
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

        {/* Status Strip */}
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
              {sortMode === 'name_asc' ? 'Sorted A-Z' : sortMode === 'size_desc' ? 'Sorted by Size' : formattedModified}
            </Text>
          </View>

          <View style={styles.telemetryBottom}>
            <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, fontSize: 11 }]}>
              Protected with <Text style={{ color: colors.onSurface, fontWeight: '600' }}>End-to-End Encryption</Text> • Synced to Cloud
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

        {/* File List / Grid */}
        {(() => {
          const sortedFiles = [...filteredFiles].sort((a, b) => {
            if (sortMode === 'name_asc') return a.name.localeCompare(b.name);
            if (sortMode === 'size_desc') return b.size - a.size;
            return b.updatedAt - a.updatedAt;
          });

          return (
            <FlatList
              key={isGridView ? 'grid' : 'list'}
              numColumns={isGridView ? 2 : 1}
              columnWrapperStyle={isGridView ? { justifyContent: 'space-between' } : undefined}
              data={sortedFiles}
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
              renderItem={({ item }) => {
                if (isGridView) {
                  const sizeMB = (item.size / (1024 * 1024)).toFixed(1);
                  return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => router.push(`/file/${item.id}` as any)}
                      style={[
                        styles.gridCard,
                        {
                          backgroundColor: colors.surfaceContainer,
                          borderColor: colors.borderSubtle,
                          borderRadius: radii.default,
                        },
                      ]}
                    >
                      <View style={styles.gridCardTop}>
                        <FileText size={22} color={colors.primary} />
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedFile(item);
                            setActionModalVisible(true);
                          }}
                          style={styles.gridMoreBtn}
                        >
                          <MoreVertical size={16} color={colors.onSurfaceVariant} />
                        </TouchableOpacity>
                      </View>
                      <Text
                        style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '500', fontSize: 13, marginTop: 8 }]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2 }]}>
                        {sizeMB} MB
                      </Text>
                    </TouchableOpacity>
                  );
                }
                return (
                  <FileListItem
                    file={item}
                    onPress={(f) => router.push(`/file/${f.id}` as any)}
                    onMorePress={(f) => {
                      setSelectedFile(f);
                      setActionModalVisible(true);
                    }}
                  />
                );
              }}
            />
          );
        })()}
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

      {/* File Action Modal */}
      {actionModalVisible && selectedFile && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 100 },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActionModalVisible(false)}
          />
          <View
            style={{
              backgroundColor: colors.surfaceContainerLow,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 36,
              borderTopWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text style={[typography.headlineSm, { color: colors.onSurface, marginBottom: 16 }]}>
              {selectedFile.name}
            </Text>

            <TouchableOpacity
              onPress={() => {
                setActionModalVisible(false);
                router.push(`/file/${selectedFile.id}` as any);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
            >
              <Eye size={18} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={[typography.bodyMd, { color: colors.onSurface }]}>Open File Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                await toggleFavorite(selectedFile.id);
                await loadFolderContent();
                setActionModalVisible(false);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
            >
              <Star
                size={18}
                color={selectedFile.isFavorite ? colors.tertiary : colors.onSurfaceVariant}
                fill={selectedFile.isFavorite ? colors.tertiary : 'transparent'}
                style={{ marginRight: 12 }}
              />
              <Text style={[typography.bodyMd, { color: colors.onSurface }]}>
                {selectedFile.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActionModalVisible(false);
                setRenameModalVisible(true);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
            >
              <Edit2 size={18} color={colors.onSurface} style={{ marginRight: 12 }} />
              <Text style={[typography.bodyMd, { color: colors.onSurface }]}>Rename File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActionModalVisible(false);
                setMoveModalVisible(true);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
            >
              <FolderInput size={18} color={colors.onSurface} style={{ marginRight: 12 }} />
              <Text style={[typography.bodyMd, { color: colors.onSurface }]}>Move File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActionModalVisible(false);
                Alert.alert(
                  'Move to Trash',
                  `Are you sure you want to move "${selectedFile.name}" to trash?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Move to Trash',
                      style: 'destructive',
                      onPress: async () => {
                        await moveToTrash(selectedFile.id);
                        await loadFolderContent();
                      },
                    },
                  ]
                );
              }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
            >
              <Trash2 size={18} color={colors.error} style={{ marginRight: 12 }} />
              <Text style={[typography.bodyMd, { color: colors.error, fontWeight: '600' }]}>Move to Trash</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Rename File Modal */}
      {selectedFile && (
        <RenameFileModal
          visible={renameModalVisible}
          initialName={selectedFile.name}
          onClose={() => setRenameModalVisible(false)}
          onRename={async (newName) => {
            await renameFile(selectedFile.id, newName);
            await loadFolderContent();
          }}
        />
      )}

      {/* Move File Modal */}
      {selectedFile && (
        <MoveFileModal
          visible={moveModalVisible}
          currentFolderId={selectedFile.folderId}
          onClose={() => setMoveModalVisible(false)}
          onMove={async (targetFolderId) => {
            await moveFile(selectedFile.id, targetFolderId);
            await loadFolderContent();
          }}
        />
      )}
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
  gridCard: {
    width: '48.5%',
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
    minHeight: 90,
  },
  gridCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridMoreBtn: {
    padding: 2,
  },
});
