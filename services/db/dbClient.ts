// services/db/dbClient.ts
import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';
import { FileRecord, FolderRecord, UploadQueueItem, StorageBreakdown } from '../types/models';

let databaseInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!databaseInstance) {
    databaseInstance = await SQLite.openDatabaseAsync('cloudnest_vault.db');
    await databaseInstance.execAsync(CREATE_TABLES_SQL);
    await databaseInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS upload_queue_v2 (
        id TEXT PRIMARY KEY,
        targetFolderId TEXT,
        filePath TEXT,
        fileName TEXT,
        fileSize INTEGER,
        mimeType TEXT,
        status TEXT,
        progress REAL,
        currentChunk INTEGER,
        speed TEXT,
        totalChunks INTEGER,
        eta TEXT,
        createdAt INTEGER,
        updatedAt INTEGER,
        retryCount INTEGER,
        errorMessage TEXT
      );
    `);
    try {
      await databaseInstance.execAsync(`ALTER TABLE upload_queue_v2 ADD COLUMN errorMessage TEXT;`);
    } catch {}
    try {
      await databaseInstance.execAsync(`CREATE INDEX IF NOT EXISTS idx_files_tg_msg ON files(telegram_message_id);`);
    } catch {}
    await seedInitialDataIfNeeded(databaseInstance);
    await cleanupDuplicateFiles(databaseInstance);
  }
  return databaseInstance;
}

async function cleanupDuplicateFiles(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    const dupGroups = await db.getAllAsync<{ telegram_message_id: number; count: number }>(
      `SELECT telegram_message_id, COUNT(*) as count 
       FROM files 
       WHERE telegram_message_id IS NOT NULL AND telegram_message_id > 0 AND is_deleted = 0
       GROUP BY telegram_message_id 
       HAVING count > 1`
    );

    for (const group of dupGroups) {
      const rows = await db.getAllAsync<any>(
        `SELECT id, local_cache_path, telegram_channel_id, created_at 
         FROM files 
         WHERE telegram_message_id = ? AND is_deleted = 0
         ORDER BY 
           (CASE WHEN local_cache_path IS NOT NULL AND local_cache_path != '' THEN 0 ELSE 1 END),
           (CASE WHEN telegram_channel_id != 'me' THEN 0 ELSE 1 END),
           (CASE WHEN id LIKE 'file_tg_%' THEN 0 ELSE 1 END),
           created_at ASC`,
        [group.telegram_message_id]
      );

      if (rows && rows.length > 1) {
        const primary = rows[0];
        for (let i = 1; i < rows.length; i++) {
          const secondary = rows[i];
          if (!primary.local_cache_path && secondary.local_cache_path) {
            primary.local_cache_path = secondary.local_cache_path;
            await db.runAsync(`UPDATE files SET local_cache_path = ? WHERE id = ?`, [
              primary.local_cache_path,
              primary.id,
            ]);
          }
          await db.runAsync(`DELETE FROM files WHERE id = ?`, [secondary.id]);
        }
      }
    }
  } catch (err) {
    console.warn('[dbClient] cleanupDuplicateFiles error:', err);
  }
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

const VALID_QUEUE_COLUMNS = new Set([
  'targetFolderId',
  'filePath',
  'fileName',
  'fileSize',
  'mimeType',
  'status',
  'progress',
  'currentChunk',
  'speed',
  'totalChunks',
  'eta',
  'createdAt',
  'updatedAt',
  'retryCount',
  'errorMessage',
]);

export const UploadQueueDao = {
  async getAll(): Promise<UploadQueueItem[]> {
    try {
      const db = await getDb();
      const rows = await db.getAllAsync<any>('SELECT * FROM upload_queue_v2 ORDER BY createdAt ASC');
      return rows || [];
    } catch (err) {
      console.warn('[UploadQueueDao] getAll error:', err);
      return [];
    }
  },
  async insert(item: UploadQueueItem): Promise<void> {
    try {
      const db = await getDb();
      await db.runAsync(
        `INSERT OR REPLACE INTO upload_queue_v2 (id, targetFolderId, filePath, fileName, fileSize, mimeType, status, progress, currentChunk, speed, totalChunks, eta, createdAt, updatedAt, retryCount, errorMessage)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.targetFolderId ?? null,
          item.filePath,
          item.fileName,
          item.fileSize,
          item.mimeType,
          item.status,
          item.progress,
          item.currentChunk,
          item.speed,
          item.totalChunks ?? null,
          item.eta ?? null,
          item.createdAt,
          item.updatedAt,
          item.retryCount,
          (item as any).errorMessage ?? null,
        ]
      );
    } catch (err) {
      console.warn('[UploadQueueDao] insert error:', err);
    }
  },
  async update(id: string, partialItem: Partial<UploadQueueItem>): Promise<void> {
    try {
      const db = await getDb();
      const setClauses: string[] = [];
      const values: any[] = [];
      for (const [key, value] of Object.entries(partialItem)) {
        if (!VALID_QUEUE_COLUMNS.has(key)) continue;
        setClauses.push(`${key} = ?`);
        values.push(value === undefined ? null : value);
      }
      if (setClauses.length === 0) return;
      values.push(id);
      await db.runAsync(
        `UPDATE upload_queue_v2 SET ${setClauses.join(', ')} WHERE id = ?`,
        values
      );
    } catch (err) {
      console.warn('[UploadQueueDao] update error:', err);
    }
  },
  async delete(id: string): Promise<void> {
    try {
      const db = await getDb();
      await db.runAsync('DELETE FROM upload_queue_v2 WHERE id = ?', [id]);
    } catch (err) {
      console.warn('[UploadQueueDao] delete error:', err);
    }
  }
};

import {
  MEDIA_EXTENSIONS,
  DOC_EXTENSIONS,
  AUDIO_EXTENSIONS,
  ARCHIVE_EXTENSIONS,
  normalizeExtension,
  getFileCategory,
} from '../file/categories';

export {
  MEDIA_EXTENSIONS,
  DOC_EXTENSIONS,
  AUDIO_EXTENSIONS,
  ARCHIVE_EXTENSIONS,
  normalizeExtension,
  getFileCategory,
};

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
      const category = getFileCategory(f.extension);
      if (category === 'documents') {
        documents++;
      } else if (category === 'media') {
        media++;
      } else if (category === 'audio') {
        audio++;
      } else {
        archives++;
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
        const quoted = DOC_EXTENSIONS.map((e) => `'${e}'`).join(',');
        sql += ` AND (extension IN (${quoted}))`;
      } else if (category === 'images' || category === 'media') {
        const quoted = MEDIA_EXTENSIONS.map((e) => `'${e}'`).join(',');
        sql += ` AND (extension IN (${quoted}))`;
      } else if (category === 'audio') {
        const quoted = AUDIO_EXTENSIONS.map((e) => `'${e}'`).join(',');
        sql += ` AND (extension IN (${quoted}))`;
      } else if (category === 'archives') {
        const knownOthers = [...DOC_EXTENSIONS, ...MEDIA_EXTENSIONS, ...AUDIO_EXTENSIONS].map((e) => `'${e}'`).join(',');
        sql += ` AND (extension NOT IN (${knownOthers}))`;
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

    // Prevent duplicate records for the same Telegram message or ID
    if (file.telegramMessageId && file.telegramMessageId > 0) {
      const existing = await db.getFirstAsync<{ id: string; local_cache_path: string | null; telegram_channel_id: string }>(
        `SELECT id, local_cache_path, telegram_channel_id FROM files WHERE id = ? OR telegram_message_id = ? LIMIT 1`,
        [file.id, file.telegramMessageId]
      );
      if (existing) {
        if (file.localCachePath && !existing.local_cache_path) {
          await db.runAsync(
            `UPDATE files SET local_cache_path = ?, updated_at = ? WHERE id = ?`,
            [file.localCachePath, now, existing.id]
          );
        }
        if (existing.telegram_channel_id === 'me' && file.telegramChannelId && file.telegramChannelId !== 'me') {
          await db.runAsync(
            `UPDATE files SET telegram_channel_id = ?, updated_at = ? WHERE id = ?`,
            [file.telegramChannelId, now, existing.id]
          );
        }
        return;
      }
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO files (id, folder_id, name, size, mime_type, extension, telegram_message_id, telegram_channel_id, is_encrypted, encryption_iv, sha256_hash, local_cache_path, is_favorite, is_deleted, created_at, updated_at)
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
      const existing = await db.getFirstAsync<{ id: string; local_cache_path: string | null; telegram_channel_id: string }>(
        `SELECT id, local_cache_path, telegram_channel_id FROM files WHERE id = ? OR telegram_message_id = ? LIMIT 1`,
        [file.id, file.telegramMessageId]
      );
      if (!existing) {
        await this.insertFile(file);
        importedCount++;
      } else {
        if (file.localCachePath && !existing.local_cache_path) {
          await db.runAsync(
            `UPDATE files SET local_cache_path = ?, updated_at = ? WHERE id = ?`,
            [file.localCachePath, Date.now(), existing.id]
          );
        }
        if (existing.telegram_channel_id === 'me' && file.telegramChannelId && file.telegramChannelId !== 'me') {
          await db.runAsync(
            `UPDATE files SET telegram_channel_id = ?, updated_at = ? WHERE id = ?`,
            [file.telegramChannelId, Date.now(), existing.id]
          );
        }
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
      const ext = normalizeExtension(f.extension);
      if (MEDIA_EXTENSIONS.includes(ext)) {
        media += f.size;
      } else if (DOC_EXTENSIONS.includes(ext)) {
        docs += f.size;
      } else if (AUDIO_EXTENSIONS.includes(ext)) {
        audio += f.size;
      } else if (ARCHIVE_EXTENSIONS.includes(ext)) {
        archives += f.size;
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
