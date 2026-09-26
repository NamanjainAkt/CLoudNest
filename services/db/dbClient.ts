// services/db/dbClient.ts
import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';
import { FileRecord, FolderRecord, UploadQueueItem, StorageBreakdown } from '../types/models';

let databaseInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!databaseInstance) {
    databaseInstance = await SQLite.openDatabaseAsync('cloudnest_vault.db');
    await databaseInstance.execAsync(CREATE_TABLES_SQL);
    await seedInitialDataIfNeeded(databaseInstance);
  }
  return databaseInstance;
}

async function seedInitialDataIfNeeded(db: SQLite.SQLiteDatabase) {
  // Purge any legacy dummy/mock records from database
  try {
    await db.runAsync(
      `DELETE FROM files WHERE id IN ('file_1', 'file_2', 'file_3', 'file_4', 'file_trash_1')`
    );
    await db.runAsync(
      `DELETE FROM folders WHERE id IN ('folder_personal', 'folder_design', 'folder_legal', 'folder_media', 'folder_documents')`
    );
  } catch {}
}

export const FileDao = {
  async getCategoryCounts(): Promise<{ documents: number; media: number; archives: number; audio: number }> {
    const db = await getDb();
    const all = await db.getAllAsync<{ extension: string }>(
      `SELECT extension FROM files WHERE is_deleted = 0`
    );
    let documents = 0;
    let media = 0;
    let archives = 0;
    let audio = 0;
    for (const f of all) {
      const ext = (f.extension || '').toLowerCase();
      if (['pdf', 'doc', 'docx', 'txt', 'key', 'xlsx', 'asc'].includes(ext)) {
        documents++;
      } else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'mov', 'mp4', 'm4v'].includes(ext)) {
        media++;
      } else if (['zip', 'tar', 'gz', 'enc'].includes(ext)) {
        archives++;
      } else if (['mp3', 'wav', 'm4a', 'aac', 'flac'].includes(ext)) {
        audio++;
      }
    }
    return { documents, media, archives, audio };
  },
  async getRecentFiles(limit = 10): Promise<FileRecord[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM files WHERE is_deleted = 0 ORDER BY updated_at DESC LIMIT ?`,
      [limit]
    );
    return rows.map(mapDbFile);
  },

  async getFilesInFolder(folderId: string | null): Promise<FileRecord[]> {
    const db = await getDb();
    const rows = folderId
      ? await db.getAllAsync<any>(
          `SELECT * FROM files WHERE folder_id = ? AND is_deleted = 0 ORDER BY name ASC`,
          [folderId]
        )
      : await db.getAllAsync<any>(
          `SELECT * FROM files WHERE folder_id IS NULL AND is_deleted = 0 ORDER BY name ASC`
        );
    return rows.map(mapDbFile);
  },

  async getAllFiles(): Promise<FileRecord[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM files WHERE is_deleted = 0 ORDER BY updated_at DESC`
    );
    return rows.map(mapDbFile);
  },

  async getFileById(fileId: string): Promise<FileRecord | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM files WHERE id = ? LIMIT 1`,
      [fileId]
    );
    return row ? mapDbFile(row) : null;
  },

  async searchFiles(
    query?: string,
    category?: string,
    options?: {
      sortBy?: 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc';
      favoritesOnly?: boolean;
    }
  ): Promise<FileRecord[]> {
    const db = await getDb();
    let sql = `SELECT * FROM files WHERE is_deleted = 0`;
    const params: any[] = [];

    const trimmed = (query || '').trim();
    if (trimmed.length > 0) {
      sql += ` AND name LIKE ?`;
      params.push(`%${trimmed}%`);
    }

    if (category && category !== 'all') {
      if (category === 'documents') {
        sql += ` AND (extension IN ('pdf', 'doc', 'docx', 'txt', 'key', 'xlsx', 'asc', 'csv', 'md', 'json', 'log'))`;
      } else if (category === 'images' || category === 'media') {
        sql += ` AND (extension IN ('jpg', 'jpeg', 'png', 'webp', 'gif', 'mov', 'mp4', 'm4v', 'svg'))`;
      } else if (category === 'archives') {
        sql += ` AND (extension IN ('zip', 'tar', 'gz', 'enc', '7z', 'rar', 'bz2'))`;
      } else if (category === 'audio') {
        sql += ` AND (extension IN ('mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'))`;
      }
    }

    if (options?.favoritesOnly) {
      sql += ` AND is_favorite = 1`;
    }

    const sortBy = options?.sortBy || 'date_desc';
    if (sortBy === 'name_asc') {
      sql += ` ORDER BY name ASC`;
    } else if (sortBy === 'name_desc') {
      sql += ` ORDER BY name DESC`;
    } else if (sortBy === 'size_desc') {
      sql += ` ORDER BY size DESC`;
    } else if (sortBy === 'size_asc') {
      sql += ` ORDER BY size ASC`;
    } else if (sortBy === 'date_asc') {
      sql += ` ORDER BY updated_at ASC`;
    } else {
      sql += ` ORDER BY updated_at DESC`;
    }

    sql += ` LIMIT 60`;
    const rows = await db.getAllAsync<any>(sql, params);
    return rows.map(mapDbFile);
  },

  async insertFile(file: Omit<FileRecord, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    await db.runAsync(
      `INSERT INTO files (id, folder_id, name, size, mime_type, extension, telegram_message_id, telegram_channel_id, is_encrypted, encryption_iv, sha256_hash, local_cache_path, is_favorite, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        file.id,
        file.folderId,
        file.name,
        file.size,
        file.mimeType,
        file.extension,
        file.telegramMessageId,
        file.telegramChannelId,
        file.isEncrypted ? 1 : 0,
        file.encryptionIv,
        file.sha256Hash,
        file.localCachePath || null,
        file.isFavorite ? 1 : 0,
        file.isDeleted ? 1 : 0,
        now,
        now,
      ]
    );
  },

  async syncRemoteFiles(remoteFiles: Omit<FileRecord, 'createdAt' | 'updatedAt'>[]): Promise<number> {
    const db = await getDb();
    let importedCount = 0;
    for (const file of remoteFiles) {
      if (!file.telegramMessageId) continue;
      const existing = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM files WHERE id = ? OR (telegram_message_id = ? AND telegram_channel_id = ?) LIMIT 1`,
        [file.id, file.telegramMessageId, file.telegramChannelId]
      );
      if (!existing) {
        await this.insertFile(file);
        importedCount++;
      }
    }
    return importedCount;
  },

  async updateLocalCachePath(fileId: string, localCachePath: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE files SET local_cache_path = ?, updated_at = ? WHERE id = ?`,
      [localCachePath, Date.now(), fileId]
    );
  },

  async toggleFavorite(fileId: string): Promise<boolean> {
    const db = await getDb();
    const file = await this.getFileById(fileId);
    if (!file) return false;
    const nextFav = file.isFavorite ? 0 : 1;
    await db.runAsync(`UPDATE files SET is_favorite = ?, updated_at = ? WHERE id = ?`, [
      nextFav,
      Date.now(),
      fileId,
    ]);
    return nextFav === 1;
  },
  async renameFile(fileId: string, newName: string): Promise<void> {
    const db = await getDb();
    const ext = newName.includes('.') ? newName.split('.').pop() || 'dat' : '';
    await db.runAsync(
      `UPDATE files SET name = ?, extension = CASE WHEN ? != '' THEN ? ELSE extension END, updated_at = ? WHERE id = ?`,
      [newName, ext, ext, Date.now(), fileId]
    );
  },

  async moveFile(fileId: string, targetFolderId: string | null): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE files SET folder_id = ?, updated_at = ? WHERE id = ?`,
      [targetFolderId, Date.now(), fileId]
    );
  },

  async moveToTrash(fileId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE files SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?`,
      [Date.now(), Date.now(), fileId]
    );
  },

  async restoreFromTrash(fileId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE files SET is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE id = ?`,
      [Date.now(), fileId]
    );
  },

  async deletePermanently(fileId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM files WHERE id = ?`, [fileId]);
  },

  async getTrashFiles(): Promise<FileRecord[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM files WHERE is_deleted = 1 ORDER BY deleted_at DESC`
    );
    return rows.map(mapDbFile);
  },

  async emptyTrash(): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM files WHERE is_deleted = 1`);
  },

  async getStorageStats(): Promise<StorageBreakdown> {
    const db = await getDb();
    const allFiles = await db.getAllAsync<{ size: number; extension: string }>(
      `SELECT size, extension FROM files WHERE is_deleted = 0`
    );
    const foldersCount = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM folders WHERE is_deleted = 0`
    );

    let total = 0;
    let media = 0;
    let docs = 0;
    let archives = 0;
    let audio = 0;
    let other = 0;

    for (const f of allFiles) {
      total += f.size;
      const ext = f.extension.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'mov', 'mp4', 'webp'].includes(ext)) {
        media += f.size;
      } else if (['pdf', 'doc', 'docx', 'txt', 'key', 'xlsx'].includes(ext)) {
        docs += f.size;
      } else if (['zip', 'tar', 'gz', 'enc'].includes(ext)) {
        archives += f.size;
      } else if (['mp3', 'wav', 'm4a'].includes(ext)) {
        audio += f.size;
      } else {
        other += f.size;
      }
    }

    return {
      totalUsedBytes: total,
      mediaBytes: media,
      docsBytes: docs,
      archivesBytes: archives,
      audioBytes: audio,
      otherBytes: other,
      totalFiles: allFiles.length,
      totalFolders: foldersCount?.count || 0,
    };
  },

  async getCachedFiles(): Promise<FileRecord[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM files WHERE local_cache_path IS NOT NULL AND is_deleted = 0 ORDER BY updated_at ASC`
    );
    return rows.map(mapDbFile);
  },

  async clearFileCache(fileId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE files SET local_cache_path = NULL, updated_at = ? WHERE id = ?`,
      [Date.now(), fileId]
    );
  },

  async clearAllFileCache(): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE files SET local_cache_path = NULL, updated_at = ? WHERE local_cache_path IS NOT NULL`,
      [Date.now()]
    );
  },
};

export const FolderDao = {
  async getAllFolders(): Promise<FolderRecord[]> {
    const db = await getDb();
    const folders = await db.getAllAsync<any>(
      `SELECT * FROM folders WHERE is_deleted = 0 ORDER BY name ASC`
    );
    const result: FolderRecord[] = [];
    for (const f of folders) {
      const stats = await db.getFirstAsync<{ count: number; totalSize: number | null }>(
        `SELECT COUNT(*) as count, SUM(size) as totalSize FROM files WHERE folder_id = ? AND is_deleted = 0`,
        [f.id]
      );
      result.push({
        id: f.id,
        parentId: f.parent_id,
        name: f.name,
        itemCount: stats?.count || 0,
        totalSize: stats?.totalSize || 0,
        isDeleted: f.is_deleted === 1,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      });
    }
    return result;
  },

  async getFolderById(folderId: string): Promise<FolderRecord | null> {
    const db = await getDb();
    const f = await db.getFirstAsync<any>(
      `SELECT * FROM folders WHERE id = ? LIMIT 1`,
      [folderId]
    );
    if (!f) return null;
    return {
      id: f.id,
      parentId: f.parent_id,
      name: f.name,
      isDeleted: f.is_deleted === 1,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    };
  },

  async createFolder(name: string, parentId: string | null = null): Promise<string> {
    const db = await getDb();
    const id = `folder_${Date.now()}`;
    const now = Date.now();
    await db.runAsync(
      `INSERT INTO folders (id, parent_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [id, parentId, name, now, now]
    );
    return id;
  },

  async renameFolder(folderId: string, newName: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE folders SET name = ?, updated_at = ? WHERE id = ?`,
      [newName, Date.now(), folderId]
    );
  },

  async deleteFolder(folderId: string): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    // Soft delete the folder
    await db.runAsync(
      `UPDATE folders SET is_deleted = 1, updated_at = ? WHERE id = ?`,
      [now, folderId]
    );
    // Soft delete files in the folder
    await db.runAsync(
      `UPDATE files SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE folder_id = ?`,
      [now, now, folderId]
    );
  },
};

function mapDbFile(row: any): FileRecord {
  return {
    id: row.id,
    folderId: row.folder_id,
    name: row.name,
    size: row.size,
    mimeType: row.mime_type,
    extension: row.extension,
    telegramMessageId: row.telegram_message_id,
    telegramChannelId: row.telegram_channel_id,
    isEncrypted: row.is_encrypted === 1,
    encryptionIv: row.encryption_iv,
    sha256Hash: row.sha256_hash,
    localCachePath: row.local_cache_path,
    isFavorite: row.is_favorite === 1,
    isDeleted: row.is_deleted === 1,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
