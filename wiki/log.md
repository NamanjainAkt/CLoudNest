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

