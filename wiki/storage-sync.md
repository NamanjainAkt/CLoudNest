# Storage Engine, Sync & State

> Sources: `services/db/{schema,dbClient}.ts`, `services/storage/{cacheManager,chunking}.ts`, `services/sync/backgroundSync.ts`, `store/useVaultStore.ts`, `services/types/models.ts`.

## SQLite VFS (`cloudnest_vault.db`, `expo-sqlite`)

Tables: `folders`, `files`, `upload_queue` (never used), `app_settings` (never used). 5 indexes (`idx_files_folder/_deleted/_favorite`, `idx_folders_parent`, `idx_upload_queue_status`). No FTS5 (search is `LIKE %q%` + `LIMIT 60`); no migration versioning; FKs declared but `PRAGMA foreign_keys` never enabled.

`FileDao`: category counts (JS bucketing), recents (15), folder listing, `searchFiles(query?, category?, {sortBy ×6, favoritesOnly})`, insert/favorite/rename/move/trash/restore/permanent-delete, storage stats (JS sum), cached-files-by-`updated_at ASC` for LRU. `FolderDao.getAllFolders` is N+1 (COUNT+SUM per folder); `deleteFolder` soft-deletes non-recursively.

Category taxonomies diverge between `getCategoryCounts`, `searchFiles`, `getStorageStats` (e.g. `svg/csv/md/json` only in search; `video` union member falls to `other`).

## LRU cache (`cacheManager.ts`)

Limit 1 GB (`cloudnest_max_cache_bytes` in SecureStore); evicts `ORDER BY updated_at ASC`, non-favorites first; `deleteAsync` idempotent + NULLs `local_cache_path`. Recency = `updated_at` (mutation, not access — no atime bump); size from DB, not FS stat.

## Upload pipeline (`backgroundSync.ts` + `useVaultStore`)

`setInterval(3000)` picks first `pending/uploading` item → requires master key + session → `uploadFileStreaming` (512 KB, CTR) with MB/s progress → `markQueueItemComplete` inserts `FileRecord` (`telegramMessageId`, CTR `ivHex`, SHA-256, `localCachePath`) → chains in 500 ms. Failures stay failed (no backoff, restart from part 0); single-flight; pause works only because `paused ∉ {pending,uploading}`.

## Zustand store (`useVaultStore.ts`)

State: `isInitialized`, `session`, `storageStats`, `recentFiles[15]`, `folders`, `trashFiles`, ephemeral `uploadQueue`, `currentFolderId`. Every mutation re-runs full `loadVaultData()` (no optimistic updates); queue seed speed hardcoded `'4.2 MB/s'`; `encrypting` status never emitted; `signOut` clears sessions/master key but not cached file/folder state.

## Gaps

- P0: queue ephemeral; no background daemon; no resume; CTR/GCM metadata divergence (see `crypto-security.md`).
- P1: N+1 folder stats; dead `upload_queue`/`app_settings` tables; taxonomy divergence; full-reload mutations.
