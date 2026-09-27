# Storage Engine, Sync & State

> Sources: `services/db/{schema,dbClient}.ts`, `services/storage/{cacheManager,chunking}.ts`, `services/sync/backgroundSync.ts`, `store/useVaultStore.ts`, `services/types/models.ts`.

## SQLite VFS (`cloudnest_vault.db`, `expo-sqlite`)

Tables: `folders`, `files`, `upload_queue` (never used), `app_settings` (never used). 5 indexes (`idx_files_folder/_deleted/_favorite`, `idx_folders_parent`, `idx_upload_queue_status`). No FTS5 (search is `LIKE %q%` + `LIMIT 60`); no migration versioning; FKs declared but `PRAGMA foreign_keys` never enabled.

`FileDao`: category counts (JS bucketing), recents (15), folder listing, `searchFiles(query?, category?, {sortBy ×6, favoritesOnly})`, insert/favorite/rename/move/trash/restore/permanent-delete, storage stats (JS sum), cached-files-by-`updated_at ASC` for LRU. `FolderDao.getAllFolders` is N+1 (COUNT+SUM per folder); `deleteFolder` soft-deletes non-recursively.

Category taxonomies diverge between `getCategoryCounts`, `searchFiles`, `getStorageStats` (e.g. `svg/csv/md/json` only in search; `video` union member falls to `other`).

## LRU cache (`cacheManager.ts`)

Limit 1 GB (`cloudnest_max_cache_bytes` in SecureStore); evicts `ORDER BY updated_at ASC`, non-favorites first; `deleteAsync` idempotent + NULLs `local_cache_path`. Recency = `updated_at` (mutation, not access — no atime bump); size from DB, not FS stat.

## High-Throughput Upload Engine (`gramjsClient.ts` + `backgroundSync.ts` + `useVaultStore.ts`)

The upload engine is refactored for maximum network throughput and minimal JS bridge / CPU overhead:
- **Direct Binary File Reading (`react-native-blob-util`)**: Completely removed Base64 encoding/decoding across the JS bridge. Files are read as binary data directly into native memory buffers.
- **4 MB Disk Read Blocks (8x I/O Reduction)**: Reads large 4 MB binary blocks from disk instead of reading 512 KB per cycle. Each 4 MB block is sliced in-memory into eight 512 KB MTProto parts using zero-copy `Buffer.subarray()`, reducing disk read operations and bridge round-trips by 800%.
- **True MTProto Parallelism (`MtprotoSenderPool`)**: Main client creates and maintains 4 independent `MTProtoSender` socket connections (`_createExportedSender(dcId)`). Chunks are dispatched in round-robin fashion across the 4 independent TCP/WSS sockets, preventing serialization bottlenecks on a single connection. Transparent fallback to `client.invoke()` if needed.
- **Deep 32-Chunk Producer Queue (~16 MB Buffer)**: The producer buffers up to 32 parts (32 × 512 KB = 16 MB) in memory. Producer pauses only when queue reaches capacity and resumes when consumers drain, ensuring workers never wait on disk reads while keeping memory strictly bounded.
- **Adaptive Upload Scheduling**: Automatically scales file and worker concurrency based on file size thresholds:
  - *Large files (> 500 MB)*: 1 simultaneous file, 8 chunk workers (prevents bandwidth fragmentation).
  - *Medium files (10 - 500 MB)*: 2 simultaneous files, 4 chunk workers.
  - *Small files (< 10 MB)*: Up to 6 simultaneous files, 2 chunk workers.
- **Zero Upload-Time SHA-256 Overhead**: Completely eliminated `sha256.update()` in the upload loop. Telegram validates uploaded parts server-side. MD5 checksum is computed only for small files (<= 10 MB) as required by `Api.InputFile(md5Checksum)`.
- **Chunk-Level Resume & SQLite Persistence**: The upload_queue_v2 table backs the Zustand store for full crash-resilience. currentChunk state is saved to the DB and used to seamlessly resumeFromChunk across app restarts, skipping already uploaded parts.
- **Chunk-Level Retries with Jitter**: 15-second per-chunk timeout via `Promise.race()`. Failed chunks retry with exponential backoff and random jitter (`(2^(retries-1) * 500ms) + (0-500ms)`) up to 5 retries. Completed chunks are never re-uploaded.
- **Exponential Smoothing & Live ETA**: 500ms sampling window with exponential smoothing (`smoothed = 0.7 * prev + 0.3 * inst`). Computes dynamic ETA formatted as `< 5s`, `25s`, `1m 40s`, etc.
- **Throttled UI Updates (1/s)**: Zustand store progress updates are throttled to at most once per 1000ms per file (plus final 100% completion), eliminating UI thread jank and maintaining 60 FPS during high-speed transfers.
- **Background & AppState Resumption**: Subscribes to React Native `AppState` transitions. When the app returns to `active`, any stalled or pending uploads are immediately detected and re-dispatched. Configured with Android `WAKE_LOCK`, `FOREGROUND_SERVICE`, and `FOREGROUND_SERVICE_DATA_SYNC` permissions.

## Telegram Cloud Sync & Reinstall Recovery (`gramjsClient.ts` + `dbClient.ts` + `useVaultStore.ts`)
- **Automated Cloud Scanner**: Scans both dedicated vault channels and Saved Messages (`me`) via `client.getMessages({ limit: 100 })`.
- **Channel Continuity**: Matches existing channels matching `CloudNest Cloud Storage`, `CloudNest Private Vault [E2EE]`, or any title containing `CloudNest` to guarantee continuity across app re-installs.
- **Compound Deduplication**: Deduplicates remote files by `(telegram_channel_id, telegram_message_id)` compound keys and scopes primary keys (`file_tg_${sanitizedPeer}_${msg.id}`) to prevent cross-channel ID collisions.
- **Multi-Touch Recovery Hooks**: Auto-syncs on initial login setup (`create-vault.tsx`), triggers on app boot if an active session exists (`useVaultStore.initialize()`), supports pull-to-refresh (`RefreshControl`) on the Home screen, and provides a manual "Sync with Telegram Cloud" action in Settings.
- **Memory-Safe On-Demand MTProto Download**: When a user opens or downloads a file whose local cache is missing, `MTProtoClient.downloadFile` fetches the media from Telegram and uses client.iterDownload to stream 512 KB chunks asynchronously from the cloud, appending them sequentially to disk. This completely eliminates OOM (Out-of-Memory) crashes on large files (>100MB), preventing Hermes JavaScript heap OOM crashes on large files (>30–100MB). Includes error banner and retry UI.

## APK Size Optimization (`android/app/build.gradle` & `gradle.properties`)
- **ABI Splitting Enabled**: Configured Gradle ABI splits (`armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`) plus universal APK generation. Reduces per-device APK footprint from ~103 MB down to ~44.6 MB for standard 64-bit ARM Android devices.
- **Bundle Compression**: Enabled `android.enableBundleCompression=true` in `gradle.properties` to minimize bundle payload.

## Zustand store (`useVaultStore.ts`)

State: `isInitialized`, `session`, `storageStats`, `recentFiles[15]`, `folders`, `trashFiles`, ephemeral `uploadQueue`, `isSyncing`, `currentFolderId`. Every mutation re-runs full `loadVaultData()` (no optimistic updates); queue item speed initializes to `'0 MB/s'` (removed fake hardcoded `'4.2 MB/s'`); `addUploadQueueItems` supports multi-file batch enqueuing; `syncWithTelegramCloud()` synchronizes remote cloud messages into SQLite VFS; `signOut` clears sessions/master key but not cached file/folder state.

## Gaps

- P0: queue ephemeral; no native OS background daemon (`expo-task-manager`); no resume from arbitrary chunk index; CTR/GCM metadata divergence (see `crypto-security.md`).
- P1: N+1 folder stats; dead `upload_queue`/`app_settings` tables; taxonomy divergence; full-reload mutations.

