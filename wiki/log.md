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

## [2026-09-30] Play Console Data safety form completed

- Filled all 5 steps for app `4973211743768335546`; saved (Play Console: "Change saved. Send for review in Publishing overview"). Not yet sent for review — "Send app for review" stays disabled until the remaining dashboard setup tasks are done (Government apps, Financial features, Health, category + contact details, store listing, closed test).
- Declared: collects + shares **Personal info → Phone number** and **Files and docs**; encrypted in transit **Yes**; deletion request **Yes** (`https://cloudnest-v1.netlify.app/`, also used as the store-listing Privacy policy). Everything else declared not collected/shared — no analytics/crash/ads SDK exists in `package.json`.
- Basis: phone number goes to Telegram via `auth.sendCode`/`auth.signIn` (no `auth.signUp` → "no in-app account creation"); file contents are client-side AES-256 with the key only in SecureStore (Play end-to-end-encryption exemption), but **file name + MIME type are transmitted in cleartext** via `DocumentAttributeFilename` and the `#CloudNest` caption, which is why "Files and docs" is declared; deletion is real — `deleteMessages(..., {revoke: true})` + cache + SQLite wipe.
- New page `wiki/play-compliance.md`. Open risk logged there: the cleartext filename/mime path contradicts the user-facing zero-knowledge/E2EE claim.

## [2026-09-30] Play setup 11/11 — declarations, store settings, listing

- Dashboard "Finish setting up your app" went 6/11 → **11/11** (setup card gone). Saved, not sent for review: Government apps = No; Financial features = none; Health = none; category = **Productivity** (tags skipped); contact email `namanjainakt007@gmail.com` + website `https://cloudnest-v1.netlify.app/`.
- Default store listing (en-US) saved: short (70 chars) + full (~1.4k chars) descriptions as approved; icon 512×512 (resized from `assets/icon.png`); feature graphic 1024×500 (PIL, brand icon + tagline); 4 screenshots 1080×1920 9:16 rendered from Stitch `code.html` at 540×960 CSS ×2 DPR mobile emulation (home, uploads, file inspector, search; folder-browser render dropped for half-empty frame). AI-asset declaration: "Don't label assets". All six files kept in repo `store-listing/`.
- "Send app for review" still disabled — remaining gates are release-track work: closed-testing release + ≥12 testers for ≥14 days (0 now), then production access. Package `com.cloudnest.vault`.

## [2026-10-01] Foreground-service demo video for the FGS declaration

- Release draft (closed track, bundle vc3 1.0.0 attached, notes saved) was blocked on 2 declarations: Foreground Service (needs demo video URL) and Photo/Video permissions (justifications saved).
- Built `fgs-demo-video/cloudnest-foreground-service-demo.mp4` (1920×1080, 60s): 5-scene HyperFrames explainer with Kokoro voiceover, Stitch-blueprint screenshots, reconstructed FGS notification card. `npm run check` clean, 54/54 contrast.
- Waiting on user: YouTube upload URL → FGS video field; tester email list → closed-track testers + rollout.

## [2026-10-01] Closed testing release submitted for review

- Attached user-uploaded bundle vc3/1.0.0 to the Alpha draft + release notes; FGS declaration saved with the YouTube demo URL; photo/video justifications saved; ad-ID declaration = No (unblocked the submit gate).
- Submitted 14 changes for review (full rollout, 177 countries, `Nfit testers` list). Status: "Changes in review", Google review typically ≤7 days. Production still needs ≥12 testers × 14 days post-approval.

## [2026-10-04] Encryption removal verified + wiki corrected

- User stated file encryption was removed entirely. Verified by code read (no test run): `uploadFileStreaming` (`gramjsClient.ts:501+`) sends raw 512 KB parts (`masterKeyHex` unused, MD5-only ≤10 MB); `downloadFile` (`gramjsClient.ts:1065+`) appends raw chunks; preview uses bytes directly; `backgroundSync.ts` writes `isEncrypted:false`/`encryptionIv:''` with `'unencrypted'` key fallback. `cipher.ts`/`chunking.ts processFileForUpload` have zero live callers; `uploadEncryptedBlob` never encrypts despite `.enc`/E2EE labels.
- Pages touched: `crypto-security.md` (rewritten as removal record), `storage-sync.md`, `architecture.md`, `auth-telegram.md`, `known-gaps.md` (P0-1/P0-2 superseded, new P0-8/9/10), `play-compliance.md` (new P0 E2EE-exemption-invalid), `index.md`.
- Notable: share-link design from 2026-10-04 needs no key-distribution step now (plaintext blobs), but every zero-knowledge/E2EE claim (root `WIKI.md` + `docs/WIKI.md`, AGENTS.md, PRD, store listing, in-app copy) is stale until scrubbed or encryption is restored. Root `WIKI.md`/`docs/WIKI.md` got a staleness banner only (hashes still match) — full §§8/17/27 rewrite still open.

## [2026-10-04] UI encryption-keyword scrub

- Removed user-visible false encryption promises: `RestoreVaultModal` unmounted from `sign-in.tsx` (was already dead — no trigger ever set it visible) with its import/state/`restoreBtn` style; deleted unreachable `app/(auth)/backup-phrase.tsx` (+ route), `components/auth/RestoreVaultModal.tsx`, unused `components/settings/RecoveryPhraseModal.tsx`.
- Reworded: `BiometricLockOverlay` passcode prompt (dropped "vault master key"), uploads subtitle ("Private & Secure •" dropped), preview header ("Cloud Verified" → "Telegram Cloud"), `FileListItem` dead `isEncrypted` badge + `Cloud` import + `lockBadge` style removed.
- Left as-is (no encryption claim): "Private … Telegram Cloud" cards, "Private Search", biometric screen-lock row, `TelemetryBadge` variants / `showEnclaveBadge` (never rendered).
- Verified: `npm run lint` 0 errors, `npm run test` 73/73 pass. Remaining dead surface is non-UI: `cipher.ts`, `chunking.ts`, `mnemonic.ts`, `cloudnest_master_key`, `is_encrypted`/`encryption_iv` columns.
