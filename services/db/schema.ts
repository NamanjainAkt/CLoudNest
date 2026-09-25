// services/db/schema.ts

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY NOT NULL,
  parent_id TEXT,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY NOT NULL,
  folder_id TEXT,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  extension TEXT NOT NULL,
  telegram_message_id INTEGER,
  telegram_channel_id TEXT NOT NULL,
  is_encrypted INTEGER DEFAULT 1,
  encryption_iv TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,
  local_cache_path TEXT,
  is_favorite INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  deleted_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS upload_queue (
  id TEXT PRIMARY KEY NOT NULL,
  file_path TEXT NOT NULL,
  target_folder_id TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL,
  progress REAL DEFAULT 0.0,
  current_chunk INTEGER DEFAULT 0,
  total_chunks INTEGER DEFAULT 1,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(is_deleted, deleted_at);
CREATE INDEX IF NOT EXISTS idx_files_favorite ON files(is_favorite, is_deleted);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_upload_queue_status ON upload_queue(status);
`;
