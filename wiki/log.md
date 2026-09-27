# Wiki Log (append-only)

## [2026-09-25] Full codebase ingestion + wiki bootstrap

- Ingested whole repo via 3 parallel explore subagents (UI routes/components/theme; services/store; docs/tests/config) + direct reads of `WIKI.md`, `AGENTS.md`, `package.json`.
- Created `wiki/` with `SCHEMA.md`, `index.md`, and 6 entity pages (`architecture`, `auth-telegram`, `crypto-security`, `ui-screens`, `storage-sync`, `testing-build`, `known-gaps`).
- Verified `npm run test`: 42/42 pass (root `WIKI.md` banner + §11 claimed 36/36 — stale).
- Fixed in both `WIKI.md` and `docs/WIKI.md` (kept byte-identical): banner 36/36 → 42/42, §11 count, extended TOC to §§13–27, renumbered duplicate `## 14.` cascade (old 14dup–26 → 15–27).
- No `wiki/` folder existed before; bootstrapped per AGENTS.md §1.5 LLM Wiki pattern. `wiki-maintainer` skill is not installed in this environment, so conventions follow `SCHEMA.md` in this folder.

## [2026-09-26] UI Terminology Overhaul, In-App Previews & Trash Deletion
- Removed cryptographic jargon ("encrypt", "decrypt", "E2EE", "cipher", "24-word", "mnemonic", "AES-256", "zero-knowledge") across all 12 screens and components.
- Integrated `expo-video` for native in-app video playback, interactive audio player card, monospace syntax viewer, and formatted document cards in `FullScreenPreviewModal.tsx`.
- Added distinct Download and Share actions with gallery integration via `expo-media-library` and OS sharing via `expo-sharing`.
- Implemented permanent trash deletion calling MTProto `deleteMessages` with `revoke: true` across Telegram channels and Saved Messages.
- Enabled Gradle ABI splitting in `android/app/build.gradle` producing optimized 44.6 MB ARM64 APKs.

## [2026-09-27] Reinstall Cloud Recovery & 4 Concurrent Parallel Uploads
- Implemented automated Telegram Cloud message scanning on reinstall, boot, and pull-to-refresh (`syncWithTelegramCloud()`).
- Added channel continuity matching (`CloudNest Cloud Storage`, `CloudNest Private Vault [E2EE]`, or any title containing `CloudNest`) and compound deduplication `(telegram_channel_id, telegram_message_id)`.
- Increased parallel upload capacity to 4 concurrent files (`MAX_PARALLEL_UPLOADS = 4`) with pending staging, non-blocking masterKey handling, and unique collision-proof SQLite file IDs.
- Implemented memory-safe on-demand MTProto media downloading in 2 MB chunked Base64 slices to prevent Hermes JS heap OOM crashes, complete with error banners and retry UI.
- All 55/55 unit tests passing; TypeScript compilation 0 errors.

## [2026-09-27] Telegram Upload Engine Refactor for Maximum Throughput
- **Direct Binary File Reading**: Installed `react-native-blob-util` and eliminated Base64 conversion over the React Native bridge.
- **4 MB Disk Read Blocks**: Batching disk reads into 4 MB blocks, sliced into eight 512 KB MTProto parts in native memory, reducing disk reads and bridge round-trips by 8x.
- **True MTProto Parallelism (`MtprotoSenderPool`)**: Maintained 4 independent MTProto socket connections (`_createExportedSender(dcId)`) with round-robin dispatch, eliminating serialization on a single connection.
- **Deep 32-Chunk Producer Queue**: 32-chunk queue buffer (~16 MB RAM) with automatic backpressure pausing and consumer wakeup.
- **Adaptive Upload Scheduling**: Scaled file concurrency and workers dynamically: >500MB (1 file, 8 workers), 10-500MB (2 files, 4 workers), <10MB (up to 6 files, 2 workers).
- **Removed Upload-Time SHA-256**: Zero hashing CPU overhead during upload transfer; MD5 preserved only for small files (<= 10MB) per Telegram API specification.
- **Resilient Chunk Retries**: 15s per-chunk timeout with exponential backoff and random jitter up to 5 retries.
- **Speed Smoothing & Live ETA**: 500ms sampling window with exponential smoothing (`0.7 * prev + 0.3 * inst`) and ETA formatting (`< 5s`, `25s`, `1m 40s`, etc.).
- **Throttled UI Updates**: Zustand store updates throttled to 1/s per upload to maintain 60 FPS UI rendering.
- All 61/61 unit tests passing; TypeScript compilation 0 errors.
- **Review Hardening & Safety Patches**: Patched 0-byte empty file infinite microtask loop in `producerLoop`, removed whole-file blob memory hazard from `readBinaryBlock` using seeked reads, cleaned up active timeout handles in `uploadWorker`, added `UPLOAD_ABORTED` status checks, and added `senderPool.destroy()` and client cleanup in `signOut()`.

## [2026-09-27] Play-review bypass for testing-credentials (zero-cost, no spare SIM)

- Added `services/telegram/reviewBypass.ts` (`+91 99999 99999` / `55555` / `REVIEW_MODE`) and short-circuited `MTProtoClient.sendCode/signIn/createPrivateVaultChannel` for that digit-normalized number only; real-user GramJS path untouched.
- Documented in `wiki/auth-telegram.md`. Play Console Sign-in details to file: name `Review Demo Account`, username `+919999999999`, password `N/A - OTP only`, instructions point at `55555` code with full-access checkbox.
- Verified: `npm run lint` 0 errors, `npm run test` 73/73 pass.
