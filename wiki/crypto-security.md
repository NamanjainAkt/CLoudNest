# File Security (Encryption Removed — Plaintext Storage)

> Sources: `services/crypto/{cipher,keyDerivation,mnemonic,secureStore,biometrics}.ts`, `services/storage/chunking.ts`, `services/telegram/gramjsClient.ts` (`uploadFileStreaming`, `downloadFile`, `uploadEncryptedBlob`), `services/sync/backgroundSync.ts`, `app/(auth)/create-vault.tsx`, `app/(auth)/backup-phrase.tsx`.
> Status (verified 2026-10-04 by code read): **file-content encryption is NOT applied anywhere in the live path. Files are stored as plaintext on Telegram.** All zero-knowledge / E2EE / AES-256 claims in older wiki pages, root `WIKI.md`, and store-listing copy are stale and must not ship.

## What actually happens (verified)

- Upload (`gramjsClient.ts uploadFileStreaming`): raw 4 MB disk reads → 512 KB MTProto parts → `SaveFilePart` / `SaveBigFilePart`. The `masterKeyHex` parameter is accepted but **never used** — no cipher call in the producer/worker loop. Only MD5 for ≤10 MB files (Telegram API requirement).
- Download (`gramjsClient.ts downloadFile`): `iterDownload` appends raw chunks to disk. No `decryptBuffer` call.
- Preview (`FullScreenPreviewModal.tsx triggerCloudDownload`): uses the downloaded bytes directly. No decryption step.
- Queue commit (`backgroundSync.ts`): `getMasterKey() || 'unencrypted'`, records `isEncrypted: false`, `encryptionIv: ''`.
- Legacy `uploadEncryptedBlob` performs **no encryption** despite its name, the `.enc` filename suffix, and the `[CloudNest E2EE]` caption — labels only.

## Dead / misleading leftovers (still in repo, no effect)

- `cipher.ts` (`encryptBuffer`/`decryptBuffer`, AES-256-GCM): sole caller is `ChunkingService.processFileForUpload`, which itself has **zero callers**. Dead code.
- `chunking.ts` (1 MB GCM chunker): dead — sync uses 512 KB raw streaming.
- `keyDerivation.ts` (`generateMasterSeed`): `create-vault.tsx` still generates and saves a seed to SecureStore (`cloudnest_master_key`), but nothing encrypts with it.
- `mnemonic.ts` + `backup-phrase.tsx` + `RestoreVaultModal`: recovery-phrase UX still exists, but the phrase protects nothing — restoring it does not decrypt anything because blobs are plaintext.
- `biometrics.ts` + `BiometricLockOverlay`: app-level access gate only. Does not encrypt data at rest; `authenticate()` still fail-open (`true` with no hardware).
- DB columns `files.is_encrypted` / `encryption_iv`: always written `0` / `''`. `upload_queue(_v2).status` still lists an `encrypting` state that is never entered.
- MTProto transport TLS (WSS to Telegram DCs) still applies — bytes are protected **in transit** to Telegram, but stored **readable** by anyone with access to the vault channel / Saved Messages / session.

## Consequences

1. Confidentiality now rests solely on the Telegram account + session. Anyone with the session string, channel access, or a share link gets readable files — which is exactly what makes share links trivial to implement (no key distribution needed), at the cost of the zero-knowledge story.
2. `.enc` suffixes, `[CloudNest E2EE]` captions, "Encrypted / Protected & Verified" UI copy, and the `AES-256 encrypted files` store-listing short description are **false labels** — see `known-gaps.md` P0 and `play-compliance.md`.
3. Play Data Safety end-to-end-encryption exemption no longer applies — file contents must be declared as collected/shared without that cover (see `play-compliance.md` P0).
