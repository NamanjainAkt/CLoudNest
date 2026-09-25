// services/sync/backgroundSync.ts
import * as FileSystem from 'expo-file-system/legacy';
import { useVaultStore } from '../../store/useVaultStore';
import { MTProtoClient } from '../telegram/mtprotoClient';
import { SecureStorageService } from '../crypto/secureStore';
import { UploadQueueItem } from '../types/models';

class BackgroundSyncManager {
  private activeUploadIds = new Set<string>();
  private MAX_PARALLEL_UPLOADS = 2;
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
   * Process pending items in upload queue concurrently up to MAX_PARALLEL_UPLOADS
   */
  async processNextPendingUpload(): Promise<boolean> {
    if (this.activeUploadIds.size >= this.MAX_PARALLEL_UPLOADS) {
      return false;
    }

    const store = useVaultStore.getState();
    const queue = store.uploadQueue;
    const nextItem = queue.find(
      (item) =>
        (item.status === 'uploading' || item.status === 'pending') &&
        !this.activeUploadIds.has(item.id)
    );

    if (!nextItem) return false;

    this.activeUploadIds.add(nextItem.id);

    // Launch upload asynchronously so parallel slots can run concurrently
    this.executeUpload(nextItem).finally(() => {
      this.activeUploadIds.delete(nextItem.id);
      // When upload finishes or fails or aborts, immediately check for the next pending item
      this.processNextPendingUpload();
    });

    // If there is still capacity, trigger another slot immediately
    if (this.activeUploadIds.size < this.MAX_PARALLEL_UPLOADS) {
      this.processNextPendingUpload();
    }

    return true;
  }

  private async executeUpload(nextItem: UploadQueueItem): Promise<void> {
    const store = useVaultStore.getState();

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

      // 2. Stream chunked encryption & upload directly to Telegram MTProto
      store.updateQueueItemProgress(
        nextItem.id,
        0.05,
        1,
        '0 MB/s',
        totalParts
      );

      const uploadRes = await MTProtoClient.uploadFileStreaming(
        nextItem.filePath,
        nextItem.fileName,
        actualSize,
        masterKey,
        (progress, currentPart, total, speedText) => {
          store.updateQueueItemProgress(
            nextItem.id,
            progress,
            currentPart,
            speedText || '0 MB/s',
            total
          );
        },
        () => {
          const item = useVaultStore.getState().uploadQueue.find((i) => i.id === nextItem.id);
          return !item || item.status === 'paused';
        }
      );

      // Verify item wasn't paused or cancelled before final DB commit
      const finalItem = useVaultStore.getState().uploadQueue.find((i) => i.id === nextItem.id);
      if (!finalItem || finalItem.status === 'paused') {
        return;
      }

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
    } catch (err: any) {
      const currentItem = useVaultStore.getState().uploadQueue.find((i) => i.id === nextItem.id);
      if (!currentItem) {
        // Item was cancelled/removed from queue
        return;
      }

      if (currentItem.status === 'paused' || err?.message === 'UPLOAD_ABORTED') {
        // When an item is aborted because it was paused, do NOT mark it as failed. Keep it in paused state.
        if (currentItem.status !== 'paused') {
          store.pauseQueueItem(nextItem.id);
        }
        return;
      }

      console.warn(`[BackgroundSync] Upload failed for ${nextItem.fileName}:`, err);
      store.markQueueItemFailed(nextItem.id, err?.message || 'Sync failed');
    }
  }

  isBusy(): boolean {
    return this.activeUploadIds.size > 0;
  }

  getActiveCount(): number {
    return this.activeUploadIds.size;
  }
}

export const BackgroundSync = new BackgroundSyncManager();
