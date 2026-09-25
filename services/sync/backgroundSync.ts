// services/sync/backgroundSync.ts
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { useVaultStore } from '../../store/useVaultStore';
import { MTProtoClient } from '../telegram/mtprotoClient';
import { SecureStorageService } from '../crypto/secureStore';
import { encryptBuffer } from '../crypto/cipher';
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

      // 1. Read file from disk
      store.updateQueueItemProgress(nextItem.id, 0.1, 1, 'Reading file…');
      let rawBase64 = '';
      try {
        rawBase64 = await FileSystem.readAsStringAsync(nextItem.filePath, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (readErr: any) {
        throw new Error(`Failed to read file: ${readErr?.message || readErr}`);
      }

      const rawBuffer = Buffer.from(rawBase64, 'base64');
      const rawArrayBuffer = rawBuffer.buffer.slice(
        rawBuffer.byteOffset,
        rawBuffer.byteOffset + rawBuffer.byteLength
      );

      // 2. Client-Side AES-256-GCM Zero-Knowledge Encryption
      store.updateQueueItemProgress(nextItem.id, 0.25, 1, 'Encrypting (AES-256-GCM)…');
      const encResult = await encryptBuffer(rawArrayBuffer, masterKey);

      // Convert encrypted ciphertext back to ArrayBuffer for MTProto upload
      const encBuffer = Buffer.from(encResult.ciphertextBase64, 'base64');
      const encArrayBuffer = encBuffer.buffer.slice(
        encBuffer.byteOffset,
        encBuffer.byteOffset + encBuffer.byteLength
      );

      // 3. Upload to Telegram MTProto / WSS
      store.updateQueueItemProgress(nextItem.id, 0.4, 1, 'Uploading to Telegram…');
      const uploadRes = await MTProtoClient.uploadFileBlob(
        encArrayBuffer,
        nextItem.fileName,
        (progress, currentPart, totalParts) => {
          const scaledProgress = 0.4 + progress * 0.55;
          store.updateQueueItemProgress(
            nextItem.id,
            scaledProgress,
            currentPart,
            `${((nextItem.fileSize * progress) / (1024 * 1024)).toFixed(1)} MB`
          );
        }
      );

      // 4. Mark Complete in local SQLite Virtual File System
      const ext = nextItem.fileName.split('.').pop() || 'bin';
      const fileId = `file_${Date.now()}`;

      await store.markQueueItemComplete(nextItem.id, {
        id: fileId,
        folderId: nextItem.targetFolderId,
        name: nextItem.fileName,
        size: nextItem.fileSize,
        mimeType: nextItem.mimeType,
        extension: ext,
        telegramMessageId: uploadRes.messageId,
        telegramChannelId: uploadRes.channelId,
        isEncrypted: true,
        encryptionIv: encResult.ivHex,
        sha256Hash: encResult.sha256Hash,
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
