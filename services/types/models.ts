// services/types/models.ts

export type FileCategory = 'all' | 'documents' | 'images' | 'archives' | 'audio' | 'video';

export interface FileRecord {
  id: string;
  folderId: string | null; // null represents root
  name: string;
  size: number;
  mimeType: string;
  extension: string;
  telegramMessageId: number | null;
  telegramChannelId: string;
  isEncrypted: boolean;
  encryptionIv: string;
  sha256Hash: string;
  localCachePath?: string | null;
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface FolderRecord {
  id: string;
  parentId: string | null; // null represents root
  name: string;
  itemCount?: number;
  totalSize?: number;
  isDeleted: boolean;
  createdAt: number;
  updatedAt: number;
}

export type UploadStatus = 
  | 'pending' 
  | 'encrypting' 
  | 'uploading' 
  | 'completed' 
  | 'failed' 
  | 'paused';

export interface UploadQueueItem {
  id: string;
  filePath: string;
  targetFolderId: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: UploadStatus;
  progress: number; // 0 to 1
  currentChunk: number;
  totalChunks: number;
  speed: string; // e.g. "4.2 MB/s"
  retryCount: number;
  errorMessage?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface TelegramSession {
  phoneNumber: string;
  dcId: number;
  authKeyHex?: string;
  channelId: string; // The private vault storage channel
  channelTitle: string;
  isConnected: boolean;
  lastPingMs: number;
  nodeName: string;
  accountName: string;
  username: string;
}

export interface StorageBreakdown {
  totalUsedBytes: number;
  mediaBytes: number;
  docsBytes: number;
  archivesBytes: number;
  audioBytes: number;
  otherBytes: number;
  totalFiles: number;
  totalFolders: number;
}
