// app/folder/[folderId].tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Image as RNImage,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Plus,
  Star,
  Edit2,
  FolderInput,
  Trash2,
  Eye,
  MoreVertical,
  FileText,
  Image as ImageIcon,
  Film,
  FileArchive,
  Music,
  File,
  FolderOpen,
  ShieldCheck,
  ChevronDown,
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
import { SortOptionsModal, SortMode } from '../../components/file-manager/SortOptionsModal';
import { CustomConfirmDialog } from '../../components/common/CustomConfirmDialog';
import { FileDao, FolderDao } from '../../services/db/dbClient';
import { FileRecord, FolderRecord } from '../../services/types/models';
import { useVaultStore } from '../../store/useVaultStore';
import { CacheManager } from '../../services/storage/cacheManager';

export default function FolderBrowserScreen() {
  const { colors, typography, radii } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ folderId: string }>();

  const addUploadQueueItem = useVaultStore((s) => s.addUploadQueueItem);
  const addUploadQueueItems = useVaultStore((s) => s.addUploadQueueItems);
  const createFolder = useVaultStore((s) => s.createFolder);
  const toggleFavorite = useVaultStore((s) => s.toggleFavorite);
  const moveToTrash = useVaultStore((s) => s.moveToTrash);
  const renameFile = useVaultStore((s) => s.renameFile);
  const moveFile = useVaultStore((s) => s.moveFile);

  const folderId = params.folderId === 'root' ? null : params.folderId;
  const isAllFiles = !folderId;
  const [folder, setFolder] = useState<FolderRecord | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('date_desc');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [isGridView, setIsGridView] = useState<boolean>(false);
  const [sheetVisible, setSheetVisible] = useState<boolean>(false);
  const [folderModalVisible, setFolderModalVisible] = useState<boolean>(false);
  const [sortModalVisible, setSortModalVisible] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState<boolean>(false);
  const [renameModalVisible, setRenameModalVisible] = useState<boolean>(false);
  const [moveModalVisible, setMoveModalVisible] = useState<boolean>(false);

  // Custom Confirmation Dialog State
  const [confirmDialogVisible, setConfirmDialogVisible] = useState<boolean>(false);
  const [confirmDialogConfig, setConfirmDialogConfig] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    isDestructive: boolean;
    onConfirm: () => Promise<void> | void;
  }>({
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    isDestructive: false,
    onConfirm: () => {},
  });

  const numColumns = isGridView ? (width >= 600 ? 3 : 2) : 1;
  const cardGap = 10;
  const gridCardWidth = (width - 32 - cardGap * (numColumns - 1)) / numColumns;

  const loadFolderContent = useCallback(async () => {
    try {
      if (folderId) {
        const f = await FolderDao.getFolderById(folderId);
        setFolder(f);
        const fileList = await FileDao.getFilesInFolder(folderId);
        setFiles(fileList);
      } else {
        setFolder(null);
        const fileList = await FileDao.getAllFiles();
        setFiles(fileList);
      }
    } catch (err) {
      console.error('[FolderBrowser] Load error:', err);
    }
  }, [folderId]);

  useEffect(() => {
    loadFolderContent();
  }, [loadFolderContent]);

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const queueItems = res.assets.map((file) => ({
          filePath: file.uri,
          fileName: file.name,
          fileSize: file.size || 1024 * 1024 * 2,
          mimeType: file.mimeType || 'application/octet-stream',
          targetFolderId: folderId,
          totalChunks: Math.max(1, Math.ceil((file.size || 1024 * 1024 * 2) / (512 * 1024))),
        }));
        await addUploadQueueItems(queueItems);
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
        allowsMultipleSelection: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const queueItems = res.assets.map((asset, index) => {
          const fileName = asset.fileName || `IMG_${Date.now()}_${index}.jpg`;
          const fileSize = asset.fileSize || 1024 * 1024 * 3;
          return {
            filePath: asset.uri,
            fileName,
            fileSize,
            mimeType: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
            targetFolderId: folderId,
            totalChunks: Math.max(1, Math.ceil(fileSize / (512 * 1024))),
          };
        });
        await addUploadQueueItems(queueItems);
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

  const promptDeleteFile = (file: FileRecord) => {
    setActionModalVisible(false);
    setConfirmDialogConfig({
      title: 'Move to Trash?',
      message: `Are you sure you want to move "${file.name}" to trash? You can restore it anytime.`,
      confirmLabel: 'Move to Trash',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmDialogVisible(false);
        await moveToTrash(file.id);
        await loadFolderContent();
      },
    });
    setConfirmDialogVisible(true);
  };

  // Category counts
  const docsCount = files.filter((f) =>
    ['pdf', 'doc', 'docx', 'txt', 'key', 'xlsx', 'asc', 'csv', 'md', 'json', 'log'].includes(
      f.extension.toLowerCase()
    )
  ).length;

  const mediaCount = files.filter((f) =>
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mov', 'mp4', 'm4v', 'svg', 'avi', 'mkv'].includes(
      f.extension.toLowerCase()
    )
  ).length;

  const archivesCount = files.filter((f) =>
    ['zip', 'tar', 'gz', 'enc', '7z', 'rar', 'bz2'].includes(f.extension.toLowerCase())
  ).length;

  const audioCount = files.filter((f) =>
    ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'].includes(f.extension.toLowerCase())
  ).length;

  const favoritesCount = files.filter((f) => f.isFavorite).length;

  const filteredFiles = files.filter((f) => {
    if (favoritesOnly && !f.isFavorite) return false;
    const ext = f.extension.toLowerCase();
    if (filter === 'all') return true;
    if (filter === 'docs')
      return ['pdf', 'doc', 'docx', 'txt', 'key', 'xlsx', 'asc', 'csv', 'md', 'json', 'log'].includes(ext);
    if (filter === 'images')
      return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mov', 'mp4', 'm4v', 'svg', 'avi', 'mkv'].includes(ext);
    if (filter === 'archives')
      return ['zip', 'tar', 'gz', 'enc', '7z', 'rar', 'bz2'].includes(ext);
    if (filter === 'audio')
      return ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'].includes(ext);
    if (filter === 'favorites')
      return f.isFavorite;
    return true;
  });

  const totalSizeBytes = files.reduce((acc, curr) => acc + curr.size, 0);
  const totalSizeFormatted = CacheManager.formatBytes(totalSizeBytes);

  const pageTitle = folder ? folder.name : 'All Files';

  const getSortLabel = (mode: SortMode) => {
    switch (mode) {
      case 'date_asc':
        return 'Oldest';
      case 'name_asc':
        return 'Name (A-Z)';
      case 'name_desc':
        return 'Name (Z-A)';
      case 'size_desc':
        return 'Largest';
      case 'size_asc':
        return 'Smallest';
      default:
        return 'Newest';
    }
  };

  const getGridFileIcon = (ext: string) => {
    const lower = ext.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(lower)) {
      return {
        icon: <ImageIcon size={22} color={colors.primary} />,
        bg: colors.primaryContainer + '25',
      };
    }
    if (['mov', 'mp4', 'm4v', 'avi', 'mkv'].includes(lower)) {
      return {
        icon: <Film size={22} color={colors.secondary} />,
        bg: colors.secondaryContainer + '25',
      };
    }
    if (['zip', 'tar', 'gz', 'enc', '7z', 'rar', 'bz2'].includes(lower)) {
      return {
        icon: <FileArchive size={22} color={colors.tertiary} />,
        bg: colors.tertiaryContainer + '30',
      };
    }
    if (['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'].includes(lower)) {
      return {
        icon: <Music size={22} color={colors.secondary} />,
        bg: colors.secondaryContainer + '25',
      };
    }
    if (['pdf'].includes(lower)) {
      return {
        icon: <FileText size={22} color={colors.error} />,
        bg: colors.errorContainer + '25',
      };
    }
    return {
      icon: <File size={22} color={colors.primary} />,
      bg: colors.primaryContainer + '25',
    };
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      {/* Top Header */}
      <View
        style={[
          styles.headerRow,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderSubtle,
            paddingTop: Math.max(insets.top, 14),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerLow }]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color={colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text
            style={[typography.headlineSm, { color: colors.onSurface, fontSize: 17, fontWeight: '700' }]}
            numberOfLines={1}
          >
            {pageTitle}
          </Text>
          <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 11 }]}>
            {files.length} {files.length === 1 ? 'file' : 'files'} • {totalSizeFormatted}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/search')}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerLow }]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Search Files"
          >
            <Search size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsGridView((prev) => !prev)}
            style={[
              styles.iconBtn,
              { backgroundColor: isGridView ? colors.primaryContainer + '35' : colors.surfaceContainerLow },
            ]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isGridView ? 'Switch to list view' : 'Switch to grid view'}
          >
            {isGridView ? (
              <List size={18} color={colors.primary} />
            ) : (
              <LayoutGrid size={18} color={colors.onSurfaceVariant} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor:
                  sortMode !== 'date_desc' || favoritesOnly
                    ? colors.primaryContainer + '35'
                    : colors.surfaceContainerLow,
              },
            ]}
            onPress={() => setSortModalVisible(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Sort and View Options"
          >
            <SlidersHorizontal
              size={18}
              color={sortMode !== 'date_desc' || favoritesOnly ? colors.primary : colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContainer}>
        {/* Breadcrumb Bar: ONLY rendered when inside a folder to avoid redundancy */}
        {folder && (
          <View style={styles.breadcrumbWrapper}>
            <BreadcrumbBar
              items={[
                { id: 'root', label: 'All Files' },
                { id: folder.id, label: folder.name },
              ]}
              onSelect={(item) => {
                if (item.id === null) {
                  router.replace('/(tabs)');
                } else if (item.id === 'root') {
                  router.push('/folder/root' as any);
                }
              }}
            />
          </View>
        )}

        {/* Horizontal Category Filter Chips */}
        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={styles.filtersScroll}
          >
            <FilterChip
              label={`All (${files.length})`}
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            <FilterChip
              label={`Docs (${docsCount})`}
              active={filter === 'docs'}
              onPress={() => setFilter('docs')}
            />
            <FilterChip
              label={`Photos & Videos (${mediaCount})`}
              active={filter === 'images'}
              onPress={() => setFilter('images')}
            />
            <FilterChip
              label={`Audio (${audioCount})`}
              active={filter === 'audio'}
              onPress={() => setFilter('audio')}
            />
            <FilterChip
              label={`Archives (${archivesCount})`}
              active={filter === 'archives'}
              onPress={() => setFilter('archives')}
            />
            {favoritesCount > 0 && (
              <FilterChip
                label={`Starred (${favoritesCount})`}
                active={filter === 'favorites'}
                onPress={() => setFilter('favorites')}
              />
            )}
          </ScrollView>
        </View>

        {/* Sleek Sub-Header Summary Bar */}
        <View style={styles.subHeaderBar}>
          <View style={styles.subHeaderLeft}>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '500' }]}>
              {filteredFiles.length} {filteredFiles.length === 1 ? 'item' : 'items'}
            </Text>
            {isAllFiles && (
              <>
                <Text style={[styles.dotSeparator, { color: colors.outlineVariant }]}>•</Text>
                <View style={styles.secureTag}>
                  <ShieldCheck size={12} color={colors.primary} style={{ marginRight: 3 }} />
                  <Text style={[typography.monoSm, { color: colors.primary, fontSize: 11, fontWeight: '600' }]}>
                    Cloud Storage
                  </Text>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setSortModalVisible(true)}
            style={[
              styles.sortPillBtn,
              {
                backgroundColor: colors.surfaceContainerHigh,
                borderColor: colors.borderSubtle,
              },
            ]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Sort options"
          >
            <Text style={[typography.monoSm, { color: colors.primary, fontSize: 11, fontWeight: '600' }]}>
              {getSortLabel(sortMode)}
            </Text>
            <ChevronDown size={12} color={colors.primary} style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        </View>

        {/* File List / Grid */}
        {(() => {
          const sortedFiles = [...filteredFiles].sort((a, b) => {
            if (sortMode === 'name_asc') return a.name.localeCompare(b.name);
            if (sortMode === 'name_desc') return b.name.localeCompare(a.name);
            if (sortMode === 'size_desc') return b.size - a.size;
            if (sortMode === 'size_asc') return a.size - b.size;
            if (sortMode === 'date_asc') return a.updatedAt - b.updatedAt;
            return b.updatedAt - a.updatedAt;
          });

          return (
            <FlatList
              key={isGridView ? `grid-${numColumns}` : 'list'}
              numColumns={numColumns}
              columnWrapperStyle={isGridView ? { gap: cardGap } : undefined}
              data={sortedFiles}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 110, paddingTop: 2 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <FolderOpen size={36} color={colors.primary} />
                  </View>
                  <Text style={[typography.headlineSm, { color: colors.onSurface, marginTop: 14, fontSize: 16, fontWeight: '600' }]}>
                    {filter !== 'all' ? 'No Matching Files' : folder ? 'This Folder is Empty' : 'No Files in Vault'}
                  </Text>
                  <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 6, maxWidth: 280, lineHeight: 18 }]}>
                    {filter !== 'all'
                      ? `No files found in the "${filter}" filter. Try selecting another category.`
                      : 'Upload photos, videos, documents, or archives to store them securely in your cloud vault.'}
                  </Text>
                  {filter === 'all' && (
                    <TouchableOpacity
                      onPress={() => setSheetVisible(true)}
                      style={[styles.emptyUploadBtn, { backgroundColor: colors.primary }]}
                      activeOpacity={0.8}
                    >
                      <Plus size={16} color={colors.onPrimary} style={{ marginRight: 6 }} />
                      <Text style={[typography.labelMd, { color: colors.onPrimary, fontWeight: '600' }]}>
                        Upload File
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
              renderItem={({ item }) => {
                if (isGridView) {
                  const { icon, bg } = getGridFileIcon(item.extension);
                  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(item.extension.toLowerCase());
                  const formattedSize = CacheManager.formatBytes(item.size);
                  const statusLabel = item.telegramMessageId ? 'Synced' : 'Saved';

                  return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => router.push(`/file/${item.id}` as any)}
                      style={[
                        styles.gridCard,
                        {
                          width: gridCardWidth,
                          backgroundColor: colors.surfaceContainer,
                          borderColor: colors.borderSubtle,
                          borderRadius: radii.default,
                        },
                      ]}
                    >
                      <View style={styles.gridCardTop}>
                        <View style={[styles.gridIconBox, { backgroundColor: bg }]}>
                          {isImage && item.localCachePath ? (
                            <RNImage
                              source={{ uri: item.localCachePath }}
                              style={styles.gridThumbnail}
                              resizeMode="cover"
                            />
                          ) : (
                            icon
                          )}
                        </View>
                        <View style={styles.gridTopActions}>
                          {Boolean(item.isFavorite) && (
                            <Star size={14} color={colors.tertiary} fill={colors.tertiary} style={{ marginRight: 4 }} />
                          )}
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedFile(item);
                              setActionModalVisible(true);
                            }}
                            style={styles.gridMoreBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <MoreVertical size={16} color={colors.onSurfaceVariant} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.gridCardBody}>
                        <Text
                          style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '600', fontSize: 13 }]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <View style={styles.gridMetaRow}>
                          <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 11 }]}>
                            {formattedSize}
                          </Text>
                          <Text style={[typography.monoSm, { color: colors.outlineVariant, marginHorizontal: 4 }]}>
                            •
                          </Text>
                          <Text
                            style={[
                              typography.monoSm,
                              { color: item.telegramMessageId ? colors.primary : colors.onSurfaceVariant, fontSize: 11 },
                            ]}
                          >
                            {statusLabel}
                          </Text>
                        </View>
                      </View>
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
      <View style={[styles.fabContainer, { bottom: Math.max(insets.bottom + 16, 24) }]}>
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
          accessibilityRole="button"
          accessibilityLabel="Upload File"
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

      {/* Custom Sort & View Options Modal */}
      <SortOptionsModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        sortMode={sortMode}
        onSelectSortMode={setSortMode}
        isGridView={isGridView}
        onToggleGridView={setIsGridView}
        favoritesOnly={favoritesOnly}
        onToggleFavoritesOnly={() => setFavoritesOnly((prev) => !prev)}
      />

      {/* File Action Sheet */}
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
              paddingBottom: Math.max(insets.bottom + 20, 36),
              borderTopWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            {/* File Info Header in Sheet */}
            <View style={styles.sheetFileHeader}>
              <View style={[styles.sheetIconBox, { backgroundColor: getGridFileIcon(selectedFile.extension).bg }]}>
                {getGridFileIcon(selectedFile.extension).icon}
              </View>
              <View style={styles.sheetFileTextCol}>
                <Text style={[typography.headlineSm, { color: colors.onSurface, fontSize: 15, fontWeight: '600' }]} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2 }]}>
                  {CacheManager.formatBytes(selectedFile.size)} • {selectedFile.extension.toUpperCase()}
                </Text>
              </View>
            </View>

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
              onPress={() => promptDeleteFile(selectedFile)}
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

      {/* Custom In-App Confirmation Dialog */}
      <CustomConfirmDialog
        visible={confirmDialogVisible}
        title={confirmDialogConfig.title}
        message={confirmDialogConfig.message}
        confirmLabel={confirmDialogConfig.confirmLabel}
        isDestructive={confirmDialogConfig.isDestructive}
        onCancel={() => setConfirmDialogVisible(false)}
        onConfirm={confirmDialogConfig.onConfirm}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  breadcrumbWrapper: {
    marginBottom: 8,
  },
  filtersWrapper: {
    marginBottom: 8,
  },
  filtersScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  subHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotSeparator: {
    marginHorizontal: 6,
    fontSize: 10,
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 16,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 40,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  gridCard: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  gridCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gridThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  gridTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridMoreBtn: {
    padding: 4,
  },
  gridCardBody: {
    marginTop: 8,
  },
  gridMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  sheetFileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
  },
  sheetIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sheetFileTextCol: {
    flex: 1,
  },
});
