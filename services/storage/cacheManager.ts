import type { FileRecord } from '../types/models';

// Safe dynamic require across Node tests and React Native runtime
let FileDao: any = null;
let SecureStorageService: any = null;
let FileSystem: any = null;

try {
  FileDao = require('../db/dbClient').FileDao;
} catch {}

try {
  SecureStorageService = require('../crypto/secureStore').SecureStorageService;
} catch {}

try {
  FileSystem = require('expo-file-system');
} catch {}

const CACHE_LIMIT_KEY = 'cloudnest_max_cache_bytes';
export const DEFAULT_MAX_CACHE_BYTES = 1024 * 1024 * 1024; // 1 GB default limit

export interface CacheMetrics {
  cachedFilesCount: number;
  totalSizeBytes: number;
  formattedSize: string;
  maxLimitBytes: number;
  formattedMaxLimit: string;
  usagePercentage: number;
}

export class CacheManager {
  /**
   * Format byte count into human-readable string (KB, MB, GB)
   */
  static formatBytes(bytes: number): string {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Get configured maximum cache threshold
   */
  static async getMaxCacheLimit(): Promise<number> {
    try {
      const stored = await SecureStorageService.getItem(CACHE_LIMIT_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    return DEFAULT_MAX_CACHE_BYTES;
  }

  /**
   * Set configured maximum cache threshold
   */
  static async setMaxCacheLimit(bytes: number): Promise<void> {
    await SecureStorageService.saveItem(CACHE_LIMIT_KEY, bytes.toString());
  }

  /**
   * Query database and file system for cache metrics
   */
  static async getMetrics(): Promise<CacheMetrics> {
    try {
      const cachedFiles: FileRecord[] = await FileDao.getCachedFiles();
      const totalSizeBytes = cachedFiles.reduce((acc: number, f: FileRecord) => acc + (f.size || 0), 0);
      const maxLimitBytes = await this.getMaxCacheLimit();
      const usagePercentage = maxLimitBytes > 0 
        ? Math.min(100, Math.round((totalSizeBytes / maxLimitBytes) * 100))
        : 0;

      return {
        cachedFilesCount: cachedFiles.length,
        totalSizeBytes,
        formattedSize: this.formatBytes(totalSizeBytes),
        maxLimitBytes,
        formattedMaxLimit: this.formatBytes(maxLimitBytes),
        usagePercentage,
      };
    } catch (err) {
      console.warn('Failed to retrieve cache metrics:', err);
      return {
        cachedFilesCount: 0,
        totalSizeBytes: 0,
        formattedSize: '0 B',
        maxLimitBytes: DEFAULT_MAX_CACHE_BYTES,
        formattedMaxLimit: this.formatBytes(DEFAULT_MAX_CACHE_BYTES),
        usagePercentage: 0,
      };
    }
  }

  /**
   * Purge least recently used (LRU) files if cache exceeds limit
   */
  static async purgeLruCache(targetMaxSizeBytes?: number): Promise<{ evictedCount: number; freedBytes: number }> {
    const limit = targetMaxSizeBytes || (await this.getMaxCacheLimit());
    const cachedFiles: FileRecord[] = await FileDao.getCachedFiles();
    let currentTotal = cachedFiles.reduce((acc: number, f: FileRecord) => acc + (f.size || 0), 0);

    if (currentTotal <= limit) {
      return { evictedCount: 0, freedBytes: 0 };
    }

    let evictedCount = 0;
    let freedBytes = 0;

    // Prioritize non-favorite files first for eviction
    const nonFavorites = cachedFiles.filter((f: FileRecord) => !f.isFavorite);
    const favorites = cachedFiles.filter((f: FileRecord) => f.isFavorite);
    const evictionCandidates = [...nonFavorites, ...favorites];

    for (const file of evictionCandidates) {
      if (currentTotal <= limit) break;

      // Delete from local file system if path exists
      if (file.localCachePath && FileSystem?.deleteAsync) {
        try {
          await FileSystem.deleteAsync(file.localCachePath, { idempotent: true });
        } catch (err) {
          console.warn(`Failed to delete local cache file for ${file.id}:`, err);
        }
      }

      // Clear in SQLite database
      await FileDao.clearFileCache(file.id);

      currentTotal -= file.size;
      freedBytes += file.size;
      evictedCount++;
    }

    return { evictedCount, freedBytes };
  }

  /**
   * Clear all locally cached decrypted files
   */
  static async clearAllCache(): Promise<{ evictedCount: number; freedBytes: number }> {
    const cachedFiles: FileRecord[] = await FileDao.getCachedFiles();
    let freedBytes = 0;
    let evictedCount = 0;

    for (const file of cachedFiles) {
      if (file.localCachePath && FileSystem?.deleteAsync) {
        try {
          await FileSystem.deleteAsync(file.localCachePath, { idempotent: true });
        } catch (err) {
          console.warn(`Failed to delete cached file ${file.id}:`, err);
        }
      }
      freedBytes += file.size;
      evictedCount++;
    }

    await FileDao.clearAllFileCache();

    return { evictedCount, freedBytes };
  }
}
