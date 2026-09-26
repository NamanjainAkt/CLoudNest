// store/useVaultStore.ts
import { create } from 'zustand';
import { FileRecord, FolderRecord, UploadQueueItem, StorageBreakdown, TelegramSession } from '../services/types/models';
import { FileDao, FolderDao, getDb } from '../services/db/dbClient';
import { MTProtoClient } from '../services/telegram/mtprotoClient';
import { SecureStorageService } from '../services/crypto/secureStore';
import { BackgroundSync } from '../services/sync/backgroundSync';
import * as FileSystem from 'expo-file-system/legacy';

interface VaultState {
  isInitialized: boolean;
  isSyncing: boolean;
  session: TelegramSession | null;
  storageStats: StorageBreakdown;
  recentFiles: FileRecord[];
  folders: FolderRecord[];
  trashFiles: FileRecord[];
  uploadQueue: UploadQueueItem[];
  currentFolderId: string | null;

  // Actions
  initialize: () => Promise<void>;
  syncWithTelegramCloud: () => Promise<number>;
  setSession: (session: TelegramSession | null) => void;
  loadVaultData: () => Promise<void>;
  setCurrentFolderId: (folderId: string | null) => void;
  toggleFavorite: (fileId: string) => Promise<void>;
  moveToTrash: (fileId: string) => Promise<void>;
  restoreFromTrash: (fileId: string) => Promise<void>;
  deletePermanently: (fileId: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  createFolder: (name: string, parentId?: string | null) => Promise<string>;
  renameFolder: (folderId: string, newName: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  moveFile: (fileId: string, targetFolderId: string | null) => Promise<void>;
  addUploadQueueItem: (item: Omit<UploadQueueItem, 'id' | 'status' | 'progress' | 'currentChunk' | 'speed' | 'retryCount' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addUploadQueueItems: (items: Omit<UploadQueueItem, 'id' | 'status' | 'progress' | 'currentChunk' | 'speed' | 'retryCount' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  updateQueueItemProgress: (id: string, progress: number, currentChunk: number, speed: string, totalChunks?: number) => void;
  markQueueItemComplete: (id: string, newFile: Omit<FileRecord, 'createdAt' | 'updatedAt'>) => Promise<void>;
  markQueueItemFailed: (id: string, error: string) => void;
  cancelQueueItem: (id: string) => void;
  pauseQueueItem: (id: string) => void;
  resumeQueueItem: (id: string) => void;
  pauseAllUploads: () => void;
  signOut: () => Promise<void>;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  isInitialized: false,
  isSyncing: false,
  session: null,
  storageStats: {
    totalUsedBytes: 0,
    mediaBytes: 0,
    docsBytes: 0,
    archivesBytes: 0,
    audioBytes: 0,
    otherBytes: 0,
    totalFiles: 0,
    totalFolders: 0,
  },
  recentFiles: [],
  folders: [],
  trashFiles: [],
  uploadQueue: [],
  currentFolderId: null,

  initialize: async () => {
    try {
      await getDb();
      const existingSession = await MTProtoClient.init();
      if (existingSession) {
        set({ session: existingSession });
        get().syncWithTelegramCloud().catch((err) => {
          console.warn('Background sync error on init:', err);
        });
      }
      await get().loadVaultData();
      set({ isInitialized: true });
    } catch (err) {
      console.error('VaultStore init error:', err);
      set({ isInitialized: true });
    }
  },

  syncWithTelegramCloud: async () => {
    set({ isSyncing: true });
    try {
      const channelId = get().session?.channelId;
      const remoteFiles = await MTProtoClient.syncFilesFromChannel(channelId);
      const count = await FileDao.syncRemoteFiles(remoteFiles);
      await get().loadVaultData();
      return count;
    } catch (err) {
      console.error('syncWithTelegramCloud error:', err);
      throw err;
    } finally {
      set({ isSyncing: false });
    }
  },

  setSession: (session) => {
    set({ session });
  },

  setCurrentFolderId: (currentFolderId) => {
    set({ currentFolderId });
  },

  loadVaultData: async () => {
    try {
      const [recentFiles, folders, trashFiles, stats] = await Promise.all([
        FileDao.getRecentFiles(15),
        FolderDao.getAllFolders(),
        FileDao.getTrashFiles(),
        FileDao.getStorageStats(),
      ]);

      set({
        recentFiles,
        folders,
        trashFiles,
        storageStats: stats,
      });
    } catch (err) {
      console.error('Error loading vault data:', err);
    }
  },

  toggleFavorite: async (fileId: string) => {
    await FileDao.toggleFavorite(fileId);
    await get().loadVaultData();
  },

  moveToTrash: async (fileId: string) => {
    await FileDao.moveToTrash(fileId);
    await get().loadVaultData();
  },

  restoreFromTrash: async (fileId: string) => {
    await FileDao.restoreFromTrash(fileId);
    await get().loadVaultData();
  },

  deletePermanently: async (fileId: string) => {
    try {
      const file = await FileDao.getFileById(fileId);
      if (file) {
        if (file.telegramMessageId) {
          await MTProtoClient.deleteMessage(file.telegramChannelId, file.telegramMessageId);
        }
        if (file.localCachePath) {
          await FileSystem.deleteAsync(file.localCachePath, { idempotent: true });
        }
      }
    } catch (err) {
      console.warn('Failed to delete file from Telegram or cache:', err);
    }
    await FileDao.deletePermanently(fileId);
    await get().loadVaultData();
  },

  emptyTrash: async () => {
    try {
      const trash = await FileDao.getTrashFiles();
      for (const file of trash) {
        if (file.telegramMessageId) {
          await MTProtoClient.deleteMessage(file.telegramChannelId, file.telegramMessageId);
        }
        if (file.localCachePath) {
          await FileSystem.deleteAsync(file.localCachePath, { idempotent: true });
        }
      }
    } catch (err) {
      console.warn('Failed to empty trash from Telegram or cache:', err);
    }
    await FileDao.emptyTrash();
    await get().loadVaultData();
  },

  createFolder: async (name: string, parentId?: string | null) => {
    const id = await FolderDao.createFolder(name, parentId || null);
    await get().loadVaultData();
    return id;
  },

  renameFolder: async (folderId: string, newName: string) => {
    await FolderDao.renameFolder(folderId, newName);
    await get().loadVaultData();
  },

  deleteFolder: async (folderId: string) => {
    await FolderDao.deleteFolder(folderId);
    await get().loadVaultData();
  },

  renameFile: async (fileId: string, newName: string) => {
    await FileDao.renameFile(fileId, newName);
    await get().loadVaultData();
  },

  moveFile: async (fileId: string, targetFolderId: string | null) => {
    await FileDao.moveFile(fileId, targetFolderId);
    await get().loadVaultData();
  },

  addUploadQueueItem: async (item) => {
    const newItem: UploadQueueItem = {
      ...item,
      id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: 'pending',
      progress: 0.0,
      currentChunk: 0,
      speed: '0 MB/s',
      retryCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({ uploadQueue: [newItem, ...state.uploadQueue] }));
    setTimeout(() => {
      BackgroundSync.processNextPendingUpload();
    }, 0);
  },

  addUploadQueueItems: async (items) => {
    const newItems: UploadQueueItem[] = items.map((item, index) => ({
      ...item,
      id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${index}`,
      status: 'pending',
      progress: 0.0,
      currentChunk: 0,
      speed: '0 MB/s',
      retryCount: 0,
      createdAt: Date.now() + index,
      updatedAt: Date.now() + index,
    }));
    set((state) => ({ uploadQueue: [...newItems, ...state.uploadQueue] }));
    setTimeout(() => {
      BackgroundSync.processNextPendingUpload();
    }, 0);
  },

  updateQueueItemProgress: (id, progress, currentChunk, speed, totalChunks) => {
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === 'paused' ? 'paused' : 'uploading',
              progress,
              currentChunk,
              speed,
              totalChunks: totalChunks !== undefined ? totalChunks : item.totalChunks,
              updatedAt: Date.now(),
            }
          : item
      ),
    }));
  },

  markQueueItemComplete: async (id, newFile) => {
    await FileDao.insertFile(newFile);
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.id === id
          ? { ...item, status: 'completed', progress: 1.0, speed: '0 MB/s', updatedAt: Date.now() }
          : item
      ),
    }));
    await get().loadVaultData();
  },

  markQueueItemFailed: (id, error) => {
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.id === id
          ? { ...item, status: 'failed', errorMessage: error, speed: '0 MB/s', updatedAt: Date.now() }
          : item
      ),
    }));
  },

  cancelQueueItem: (id) => {
    set((state) => ({
      uploadQueue: state.uploadQueue.filter((item) => item.id !== id),
    }));
  },

  pauseQueueItem: (id) => {
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.id === id ? { ...item, status: 'paused', speed: '0 MB/s' } : item
      ),
    }));
  },

  resumeQueueItem: (id) => {
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.id === id ? { ...item, status: 'uploading', speed: '0 MB/s' } : item
      ),
    }));
    setTimeout(() => {
      BackgroundSync.processNextPendingUpload();
    }, 0);
  },

  pauseAllUploads: () => {
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.status === 'uploading' ? { ...item, status: 'paused', speed: '0 MB/s' } : item
      ),
    }));
  },

  signOut: async () => {
    await MTProtoClient.signOut();
    set({ session: null });
  },
}));
