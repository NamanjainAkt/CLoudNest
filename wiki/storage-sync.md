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
- **Direct Unencrypted High-Speed Streaming**: Removed client-side AES-256 encryption overhead for maximum upload throughput. Files are transferred directly to Telegram with original filenames and MIME types preserved, enabling native previewing of photos, videos, and documents directly in Telegram.
- **Deadlock-Free MTProto Part Pipelining**: `uploadFileStreaming` pipelines up to 4 concurrent `Api.upload.SaveBigFilePart` / `SaveFilePart` requests over the primary socket with a decoupled buffer (`MAX_QUEUE_BUFFER = 4`). A `producerDone` synchronization barrier guarantees all chunks are read and uploaded without early termination race conditions.
- **Socket Timeout & Auto-Retry**: 15-second per-chunk timeout prevents socket hangs on intermittent mobile network blips, automatically backing off and retrying up to 5 times.
- **Background & AppState Resumption**: Subscribes to React Native `AppState` transitions. When the app returns to `active`, any stalled or pending uploads are immediately detected and re-dispatched. Configured with Android `WAKE_LOCK`, `FOREGROUND_SERVICE`, and `FOREGROUND_SERVICE_DATA_SYNC` permissions.
- **Instantaneous Rolling Speed Engine**: Samples delta bytes / delta time every 500ms with exponential smoothing (`smoothed = 0.7 * smoothed + 0.3 * inst`), providing accurate real-time telemetry on queue rows and aggregate badge.
- **Cancellation & Graceful Pause**: Abort handler checks store status and immediately terminates worker pipeline without socket or memory leaks, preserving paused state.
- **Multi-File Batch Selection**: Supports multi-select in document and photo pickers, batch enqueuing via `addUploadQueueItems` with collision-proof IDs.

## APK Size Optimization (`android/app/build.gradle` & `gradle.properties`)
- **ABI Splitting Enabled**: Configured Gradle ABI splits (`armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`) plus universal APK generation. Reduces per-device APK footprint from ~103 MB down to ~28-35 MB for standard 64-bit ARM Android devices.
- **Bundle Compression**: Enabled `android.enableBundleCompression=true` in `gradle.properties` to minimize bundle payload.

## Zustand store (`useVaultStore.ts`)

State: `isInitialized`, `session`, `storageStats`, `recentFiles[15]`, `folders`, `trashFiles`, ephemeral `uploadQueue`, `currentFolderId`. Every mutation re-runs full `loadVaultData()` (no optimistic updates); queue item speed initializes to `'0 MB/s'` (removed fake hardcoded `'4.2 MB/s'`); `addUploadQueueItems` supports multi-file batch enqueuing; `signOut` clears sessions/master key but not cached file/folder state.

## Gaps

- P0: queue ephemeral; no native OS background daemon (`expo-task-manager`); no resume from arbitrary chunk index; CTR/GCM metadata divergence (see `crypto-security.md`).
- P1: N+1 folder stats; dead `upload_queue`/`app_settings` tables; taxonomy divergence; full-reload mutations.

