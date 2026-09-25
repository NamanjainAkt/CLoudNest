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
import { Shield, Plus, FileText, Image, FolderArchive, Music } from 'lucide-react-native';
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
    session,
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

  const accountName = session?.accountName || 'Vault User';

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
      <TopHeader title="CloudNest" subtitle="Home" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Greeting & Telemetry */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingHeader}>
            <View>
              <Text style={[typography.headlineLgMobile, { color: colors.onSurface }]}>
                Good evening, {accountName}
              </Text>
              <View style={styles.syncStatusRow}>
                <View style={styles.pulseWrapper}>
                  <View style={[styles.pingCircle, { backgroundColor: colors.secondaryContainer }]} />
                  <View style={[styles.pulseCore, { backgroundColor: colors.primary }]} />
                </View>
                <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>
                  Vault synced via Telegram E2EE • {session?.lastPingMs || 42} ms ping
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.privateStoragePill,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            >
              <Shield size={13} color={colors.primary} />
              <Text
                style={[
                  typography.labelSm,
                  { color: colors.onSurface, marginLeft: 4, letterSpacing: 0.8 },
                ]}
              >
                PRIVATE STORAGE
              </Text>
            </View>
          </View>
        </View>

        {/* Hero Storage Telemetry Card */}
        <StorageMeterCard
          stats={storageStats}
          onManagePress={() => router.push('/(tabs)/settings')}
        />

        {/* Quick Access Categories Carousel */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesHeader}>
            <Text style={[typography.headlineSm, { color: colors.onSurface }]}>Categories</Text>
            <Text style={[typography.monoSm, { color: colors.onSurfaceVariant }]}>4 Sources</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: 'documents' } })}
              style={[styles.categoryPill, { backgroundColor: colors.surfaceContainerHigh }]}
              activeOpacity={0.8}
            >
              <FileText size={16} color={colors.primary} />
              <Text style={[typography.labelMd, { color: colors.onSurface, marginLeft: 6 }]}>Documents</Text>
              <View style={[styles.categoryCount, { backgroundColor: colors.surfaceContainerLowest }]}>
                <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 10 }]}>{categoryCounts.documents}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: 'images' } })}
              style={[styles.categoryPill, { backgroundColor: colors.surfaceContainerHigh }]}
              activeOpacity={0.8}
            >
              <Image size={16} color={colors.secondary} />
              <Text style={[typography.labelMd, { color: colors.onSurface, marginLeft: 6 }]}>Media & Photos</Text>
              <View style={[styles.categoryCount, { backgroundColor: colors.surfaceContainerLowest }]}>
                <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 10 }]}>{categoryCounts.media}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: 'archives' } })}
              style={[styles.categoryPill, { backgroundColor: colors.surfaceContainerHigh }]}
              activeOpacity={0.8}
            >
              <FolderArchive size={16} color={colors.tertiary} />
              <Text style={[typography.labelMd, { color: colors.onSurface, marginLeft: 6 }]}>Code & Archives</Text>
              <View style={[styles.categoryCount, { backgroundColor: colors.surfaceContainerLowest }]}>
                <Text style={[typography.monoSm, { color: colors.onSurfaceVariant, fontSize: 10 }]}>{categoryCounts.archives}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: 'audio' } })}
              style={[styles.categoryPill, { backgroundColor: colors.surfaceContainerHigh }]}
              activeOpacity={0.8}
            >
              <Music size={16} color={colors.primary} />
              <Text style={[typography.labelMd, { color: colors.onSurface, marginLeft: 6 }]}>Audio Notes</Text>
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
    paddingTop: 12,
  },
  greetingSection: {
    marginVertical: 8,
  },
  greetingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pulseWrapper: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    position: 'relative',
  },
  pingCircle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.6,
  },
  pulseCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  privateStoragePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  categoriesSection: {
    marginVertical: 10,
  },
  categoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  categoryCount: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
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
