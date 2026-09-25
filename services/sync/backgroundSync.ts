// services/sync/backgroundSync.ts
import * as FileSystem from 'expo-file-system/legacy';
import { useVaultStore } from '../../store/useVaultStore';
import { MTProtoClient } from '../telegram/mtprotoClient';
import { SecureStorageService } from '../crypto/secureStore';
import { UploadQueueItem } from '../types/models';

class BackgroundSyncManager {
  private isProcessing = false;
  private syncInterval: any = null;

  /**
   * Start periodic queue checker
   */
  startQueueWatcher(intervalMs: number = 3000): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      this.processNextPendingUpload();
    }, intervalMs);
  }

  /**
   * Stop periodic queue checker
   */
  stopQueueWatcher(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Process the next item in the upload queue
   */
  async processNextPendingUpload(): Promise<boolean> {
    if (this.isProcessing) return false;

    const store = useVaultStore.getState();
    const queue = store.uploadQueue;
    const nextItem = queue.find(
      (item) => item.status === 'uploading' || item.status === 'pending'
    );

    if (!nextItem) return false;

    this.isProcessing = true;

    try {
      const masterKey = await SecureStorageService.getMasterKey();
      if (!masterKey) {
        throw new Error('Master key not found in SecureStore. Please re-authenticate.');
      }

      // Check Telegram session
      const session = store.session || MTProtoClient.getSession();
      if (!session) {
        throw new Error('Telegram session not active. Please sign in to sync.');
      }

      // 1. Get exact file size
      let actualSize = nextItem.fileSize;
      try {
        const fileInfo = await FileSystem.getInfoAsync(nextItem.filePath);
        if (fileInfo.exists && typeof fileInfo.size === 'number' && fileInfo.size > 0) {
          actualSize = fileInfo.size;
        }
      } catch {}

      const totalParts = Math.max(1, Math.ceil(actualSize / (512 * 1024)));
      const startTime = Date.now();

      // 2. Stream chunked encryption & upload directly to Telegram MTProto
      store.updateQueueItemProgress(
        nextItem.id,
        0.05,
        1,
        `0.0 / ${(actualSize / (1024 * 1024)).toFixed(1)} MB`,
        totalParts
      );

      const uploadRes = await MTProtoClient.uploadFileStreaming(
        nextItem.filePath,
        nextItem.fileName,
        actualSize,
        masterKey,
        (progress, currentPart, total) => {
          const sentBytes = Math.min(actualSize, currentPart * (512 * 1024));
          const sentMB = (sentBytes / (1024 * 1024)).toFixed(1);
          const totalMB = (actualSize / (1024 * 1024)).toFixed(1);
          const elapsedSec = (Date.now() - startTime) / 1000;
          const speedText =
            elapsedSec > 0
              ? `${(sentBytes / (1024 * 1024) / elapsedSec).toFixed(1)} MB/s`
              : '...';

          store.updateQueueItemProgress(
            nextItem.id,
            progress,
            currentPart,
            `${sentMB} / ${totalMB} MB • ${speedText}`,
            total
          );
        }
      );

      // 3. Mark Complete in local SQLite Virtual File System
      const ext = nextItem.fileName.split('.').pop() || 'bin';
      const fileId = `file_${Date.now()}`;

      await store.markQueueItemComplete(nextItem.id, {
        id: fileId,
        folderId: nextItem.targetFolderId,
        name: nextItem.fileName,
        size: actualSize || nextItem.fileSize,
        mimeType: nextItem.mimeType,
        extension: ext,
        telegramMessageId: uploadRes.messageId,
        telegramChannelId: uploadRes.channelId,
        isEncrypted: true,
        encryptionIv: uploadRes.ivHex || '',
        sha256Hash: uploadRes.sha256Hash || '',
        localCachePath: nextItem.filePath,
        isFavorite: false,
        isDeleted: false,
      });

      this.isProcessing = false;

      // Process any subsequent pending items in queue
      setTimeout(() => this.processNextPendingUpload(), 500);
      return true;
    } catch (err: any) {
      console.warn(`[BackgroundSync] Upload failed for ${nextItem.fileName}:`, err);
      store.markQueueItemFailed(nextItem.id, err?.message || 'Sync failed');
      this.isProcessing = false;
      return false;
    }
  }

  isBusy(): boolean {
    return this.isProcessing;
  }
}

export const BackgroundSync = new BackgroundSyncManager();
