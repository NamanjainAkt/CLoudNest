# Storage Engine, Sync & State

> Sources: `services/db/{schema,dbClient}.ts`, `services/storage/{cacheManager,chunking}.ts`, `services/sync/backgroundSync.ts`, `store/useVaultStore.ts`, `services/types/models.ts`.

## SQLite VFS (`cloudnest_vault.db`, `expo-sqlite`)

Tables: `folders`, `files`, `upload_queue` (never used), `app_settings` (never used). 5 indexes (`idx_files_folder/_deleted/_favorite`, `idx_folders_parent`, `idx_upload_queue_status`). No FTS5 (search is `LIKE %q%` + `LIMIT 60`); no migration versioning; FKs declared but `PRAGMA foreign_keys` never enabled.

`FileDao`: category counts (JS bucketing), recents (15), folder listing, `searchFiles(query?, category?, {sortBy ×6, favoritesOnly})`, insert/favorite/rename/move/trash/restore/permanent-delete, storage stats (JS sum), cached-files-by-`updated_at ASC` for LRU. `FolderDao.getAllFolders` is N+1 (COUNT+SUM per folder); `deleteFolder` soft-deletes non-recursively.

Category taxonomies diverge between `getCategoryCounts`, `searchFiles`, `getStorageStats` (e.g. `svg/csv/md/json` only in search; `video` union member falls to `other`).

## LRU cache (`cacheManager.ts`)

Limit 1 GB (`cloudnest_max_cache_bytes` in SecureStore); evicts `ORDER BY updated_at ASC`, non-favorites first; `deleteAsync` idempotent + NULLs `local_cache_path`. Recency = `updated_at` (mutation, not access — no atime bump); size from DB, not FS stat.

## Upload pipeline (`backgroundSync.ts` + `useVaultStore` + `gramjsClient.ts`)

`BackgroundSyncManager` runs parallel uploads up to `MAX_PARALLEL_UPLOADS = 2` concurrent files:
- **MTProto Multi-Worker Part Pipelining (3 concurrent chunk workers per file)**: `uploadFileStreaming` pipelines up to 3 `Api.upload.SaveBigFilePart` / `SaveFilePart` concurrent requests over the primary socket, saturating network bandwidth and eliminating RTT latency.
- **Crypto & Hash Integrity**: Reads and encrypts via AES-256-CTR and hashes via SHA-256 and MD5 strictly sequentially in a bounded sliding window (buffer bound = 1 chunk, max in flight = 3 chunks, total memory < 2MB).
- **Instantaneous Rolling Speed Engine**: Samples delta bytes / delta time every 500ms with exponential smoothing (`smoothed = 0.7 * smoothed + 0.3 * inst`), providing accurate real-time speeds (e.g. `4.8 MB/s`) on cards and dynamically aggregated in `UploadsScreen` header.
- **Cancellation & Graceful Pause**: Abort handler checks store status and immediately terminates worker pipeline without socket or memory leaks, preserving paused state without false failures.
- **Multi-File Batch Selection**: Supports multi-select in document and photo pickers, batch enqueuing via `addUploadQueueItems` with collision-proof IDs (`queue_${timestamp}_${rand}`).

## Zustand store (`useVaultStore.ts`)

State: `isInitialized`, `session`, `storageStats`, `recentFiles[15]`, `folders`, `trashFiles`, ephemeral `uploadQueue`, `currentFolderId`. Every mutation re-runs full `loadVaultData()` (no optimistic updates); queue item speed initializes to `'0 MB/s'` (removed fake hardcoded `'4.2 MB/s'`); `addUploadQueueItems` supports multi-file batch enqueuing; `signOut` clears sessions/master key but not cached file/folder state.

## Gaps

- P0: queue ephemeral; no native OS background daemon (`expo-task-manager`); no resume from arbitrary chunk index; CTR/GCM metadata divergence (see `crypto-security.md`).
- P1: N+1 folder stats; dead `upload_queue`/`app_settings` tables; taxonomy divergence; full-reload mutations.

