// services/sync/backgroundSync.ts
import * as FileSystem from 'expo-file-system/legacy';
import { useVaultStore } from '../../store/useVaultStore';
import { MTProtoClient } from '../telegram/mtprotoClient';
import { SecureStorageService } from '../crypto/secureStore';
import { UploadQueueItem } from '../types/models';

class BackgroundSyncManager {
  private activeUploadIds = new Set<string>();
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
   * Adaptive concurrency limit based on file sizes currently in active/pending queue:
   * - Files > 500 MB: 1 simultaneous file
   * - Files 10 - 500 MB: 2 simultaneous files
   * - Files < 10 MB: up to 6 simultaneous files
   */
  getAdaptiveConcurrencyLimit(): number {
    const store = useVaultStore.getState();
    const queue = store.uploadQueue;
    const activeOrPending = queue.filter(
      (item) => item.status === 'uploading' || item.status === 'pending'
    );

    if (activeOrPending.length === 0) return 6;

    const hasLarge = activeOrPending.some((item) => item.fileSize > 500 * 1024 * 1024);
    if (hasLarge) return 1;

    const hasMedium = activeOrPending.some((item) => item.fileSize >= 10 * 1024 * 1024);
    if (hasMedium) return 2;

    return 6;
  }

  getAdaptiveFileLimit(): number {
    return this.getAdaptiveConcurrencyLimit();
  }

  /**
   * Process pending items in upload queue concurrently with adaptive scheduling
   */
  async processNextPendingUpload(): Promise<boolean> {
    let startedAny = false;
    const maxFiles = this.getAdaptiveConcurrencyLimit();

    while (this.activeUploadIds.size < maxFiles) {
      const store = useVaultStore.getState();
      const queue = store.uploadQueue;
      const nextItem = queue.find(
        (item) =>
          (item.status === 'uploading' || item.status === 'pending') &&
          !this.activeUploadIds.has(item.id)
      );

      if (!nextItem) break;

      this.activeUploadIds.add(nextItem.id);
      startedAny = true;

      // Launch upload asynchronously so parallel slots can run concurrently
      this.executeUpload(nextItem).finally(() => {
        this.activeUploadIds.delete(nextItem.id);
        // When upload finishes or fails or aborts, immediately check for the next pending item
        this.processNextPendingUpload();
      });
    }

    return startedAny;
  }

  private async executeUpload(nextItem: UploadQueueItem): Promise<void> {
    const store = useVaultStore.getState();

    try {
      const masterKey = (await SecureStorageService.getMasterKey()) || 'unencrypted';

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

      // 2. Stream chunked upload directly to Telegram MTProto
      store.updateQueueItemProgress(
        nextItem.id,
        0.0,
        0,
        '0 MB/s',
        totalParts,
        'Calculating...'
      );

      let lastProgressDispatchTime = 0;

      const uploadRes = await MTProtoClient.uploadFileStreaming(
        nextItem.filePath,
        nextItem.fileName,
        actualSize,
        masterKey || '',
        (progress, currentPart, total, speedText, eta) => {
          const now = Date.now();
          // Throttle store updates to once per 1000ms unless complete (progress >= 1.0)
          if (progress >= 1.0 || now - lastProgressDispatchTime >= 1000) {
            lastProgressDispatchTime = now;
            store.updateQueueItemProgress(
              nextItem.id,
              progress,
              currentPart,
              speedText || '0 MB/s',
              total,
              eta
            );
          }
        },
        () => {
          const item = useVaultStore.getState().uploadQueue.find((i) => i.id === nextItem.id);
          return !item || item.status === 'paused';
        },
        nextItem.mimeType,
        undefined,
        0
      );

      // Verify item wasn't paused or cancelled before final DB commit
      const finalItem = useVaultStore.getState().uploadQueue.find((i) => i.id === nextItem.id);
      if (!finalItem || finalItem.status === 'paused') {
        return;
      }

      // 3. Mark Complete in local SQLite Virtual File System
      const ext = nextItem.fileName.split('.').pop() || 'bin';
      const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      await store.markQueueItemComplete(nextItem.id, {
        id: fileId,
        folderId: nextItem.targetFolderId,
        name: nextItem.fileName,
        size: actualSize || nextItem.fileSize,
        mimeType: nextItem.mimeType,
        extension: ext,
        telegramMessageId: uploadRes.messageId,
        telegramChannelId: uploadRes.channelId,
        isEncrypted: false,
        encryptionIv: '',
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

  handleAppStateChange(nextState: string): void {
    if (nextState === 'active') {
      const store = useVaultStore.getState();
      const hasPending = store.uploadQueue.some(
        (item) => item.status === 'uploading' || item.status === 'pending'
      );
      if (hasPending) {
        setTimeout(() => {
          this.processNextPendingUpload();
        }, 500);
      }
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
