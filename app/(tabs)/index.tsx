// app/(tabs)/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, FileText, Image, FolderArchive, Music } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme/ThemeContext';
import { TopHeader } from '../../components/common/TopHeader';
import { StorageMeterCard } from '../../components/dashboard/StorageMeterCard';
import { RecentFilesList } from '../../components/dashboard/RecentFilesList';
import { FolderGrid } from '../../components/dashboard/FolderGrid';
import { UploadBottomSheet } from '../../components/file-manager/UploadBottomSheet';
import { CreateFolderModal } from '../../components/file-manager/CreateFolderModal';
import { useVaultStore } from '../../store/useVaultStore';
import { FileDao } from '../../services/db/dbClient';

export default function HomeDashboardScreen() {
  const { colors, typography, radii, spacing } = useTheme();
  const router = useRouter();

  const {
    storageStats,
    recentFiles,
    folders,
    createFolder,
    addUploadQueueItem,
  } = useVaultStore();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState({
    documents: 0,
    media: 0,
    archives: 0,
    audio: 0,
  });

  React.useEffect(() => {
    FileDao.getCategoryCounts().then(setCategoryCounts).catch(() => {});
  }, [recentFiles]);

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
          targetFolderId: null,
          totalChunks: Math.max(1, Math.ceil((file.size || 1024 * 1024 * 2) / (512 * 1024))),
        });
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
          targetFolderId: null,
          totalChunks: 6,
        });
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
          targetFolderId: null,
          totalChunks: 5,
        });
        router.push('/(tabs)/uploads');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFolder = () => {
    setFolderModalVisible(true);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <TopHeader title="CloudNest" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Storage Card */}
        <StorageMeterCard
          stats={storageStats}
          onManagePress={() => router.push('/(tabs)/settings')}
        />

        {/* Quick Access Categories */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesHeader}>
            <Text style={[typography.headlineSm, { color: colors.onSurface, fontSize: 16 }]}>Categories</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: 'documents' } })}
              style={[styles.categoryPill, { backgroundColor: colors.surfaceContainerHigh }]}
              activeOpacity={0.8}
            >
              <FileText size={15} color={colors.primary} />
              <Text style={[typography.labelMd, { color: colors.onSurface, marginLeft: 6, fontSize: 12 }]}>Documents</Text>
              <View style={[styles.categoryCount, { backgroundColor: colors.surfaceContainerLowest }]}>
                <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 10 }]}>{categoryCounts.documents}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: 'images' } })}
              style={[styles.categoryPill, { backgroundColor: colors.surfaceContainerHigh }]}
              activeOpacity={0.8}
            >
              <Image size={15} color={colors.secondary} />
              <Text style={[typography.labelMd, { color: colors.onSurface, marginLeft: 6, fontSize: 12 }]}>Photos & Videos</Text>
              <View style={[styles.categoryCount, { backgroundColor: colors.surfaceContainerLowest }]}>
                <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 10 }]}>{categoryCounts.media}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: 'archives' } })}
              style={[styles.categoryPill, { backgroundColor: colors.surfaceContainerHigh }]}
              activeOpacity={0.8}
            >
              <FolderArchive size={15} color={colors.tertiary} />
              <Text style={[typography.labelMd, { color: colors.onSurface, marginLeft: 6, fontSize: 12 }]}>Files & Archives</Text>
              <View style={[styles.categoryCount, { backgroundColor: colors.surfaceContainerLowest }]}>
                <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 10 }]}>{categoryCounts.archives}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: 'audio' } })}
              style={[styles.categoryPill, { backgroundColor: colors.surfaceContainerHigh }]}
              activeOpacity={0.8}
            >
              <Music size={15} color={colors.primary} />
              <Text style={[typography.labelMd, { color: colors.onSurface, marginLeft: 6, fontSize: 12 }]}>Audio</Text>
              <View style={[styles.categoryCount, { backgroundColor: colors.surfaceContainerLowest }]}>
                <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 10 }]}>{categoryCounts.audio}</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Recent Files Horizontal List */}
        <RecentFilesList
          files={recentFiles}
          onSeeAllPress={() => router.push('/folder/root')}
        />

        {/* 2-Column Bento Folders Grid */}
        <FolderGrid
          folders={folders}
          onCreateFolderPress={handleCreateFolder}
        />
      </ScrollView>

      {/* Persistent Floating Action Button (FAB) */}
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
          accessibilityRole="button"
          accessibilityLabel="Upload File"
        >
          <Plus size={28} color={colors.onPrimaryContainer} />
        </TouchableOpacity>
      </View>

      {/* Upload Bottom Sheet Modal */}
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
          await createFolder(folderName);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  categoriesSection: {
    marginVertical: 6,
  },
  categoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
  },
  categoryCount: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    zIndex: 40,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
});
